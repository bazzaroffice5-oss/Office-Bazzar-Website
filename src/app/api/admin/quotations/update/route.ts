import { NextRequest, NextResponse } from 'next/server';
import { getQuotationById, updateQuotation, getNotificationLogs } from '@/lib/db/store';
import { saveAdminQuotationInZoho, AdminQuotationUpdateInput } from '@/lib/zoho/quotes';
import { sendFinalQuotationToCustomer } from '@/lib/notifications/service';
import { getSessionFromRequest } from '@/lib/auth/service';
import { QuotationStatus } from '@/types';

const VALID_STATUSES: QuotationStatus[] = [
  'new',
  'under_review',
  'quotation_prepared',
  'approved',
  'sent_to_customer',
  'accepted',
  'rejected',
  'closed',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      action,
      status,
      items,
      discountPercent,
      discountAmount,
      gstPercent,
      deliveryCharges,
      additionalCharges,
      validUntil,
      paymentTerms,
      termsAndConditions,
      assignedTo,
      internalNotes,
      quotationDocumentUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Quotation ID is required for update' }, { status: 400 });
    }

    const existing = await getQuotationById(id);
    if (!existing) {
      return NextResponse.json(
        { error: `Quotation "${id}" not found in Zoho CRM` },
        { status: 404 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status "${status}". Allowed values: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Identify Admin actor from session cookie if available
    const sessionUser = getSessionFromRequest(req);
    const actor = sessionUser?.email
      ? `${sessionUser.name || 'Admin'} (${sessionUser.email})`
      : body.actor || 'Office Bazzar Admin';

    // Determine effective editor action
    const effectiveAction: AdminQuotationUpdateInput['action'] =
      action === 'save_draft' ||
      action === 'edit_quotation' ||
      action === 'approve' ||
      action === 'send_to_customer'
        ? action
        : status === 'approved'
        ? 'approve'
        : status === 'sent_to_customer'
        ? 'send_to_customer'
        : 'save_draft';

    // Strict Approval Gate: Final quotation can ONLY be sent to customer after Admin explicitly approves
    if (effectiveAction === 'send_to_customer') {
      const isAlreadyApproved =
        existing.status === 'approved' ||
        existing.status === 'sent_to_customer' ||
        Boolean(existing.approvedAt);

      if (!isAlreadyApproved) {
        return NextResponse.json(
          {
            error:
              'Quotation must be explicitly approved by Admin ("Approve Quotation") before sending the final quotation to the customer.',
          },
          { status: 400 }
        );
      }
    }

    // If sending to customer:
    // Step 1: First save any current form edits in Zoho CRM while keeping status 'approved'
    if (effectiveAction === 'send_to_customer') {
      const preSaveRes = await saveAdminQuotationInZoho(id, {
        action: 'approve',
        actor,
        items,
        discountPercent,
        discountAmount,
        gstPercent,
        deliveryCharges,
        additionalCharges,
        validUntil,
        paymentTerms,
        termsAndConditions,
        assignedTo,
        internalNotes,
        quotationDocumentUrl,
      });

      if (!preSaveRes.success || !preSaveRes.quotation) {
        return NextResponse.json(
          { error: preSaveRes.error || 'Failed to save quotation in Zoho CRM before sending.' },
          { status: 502 }
        );
      }

      // Step 2: Dispatch final quotation email to customer via Zoho CRM Send Mail API
      const emailRes = await sendFinalQuotationToCustomer(preSaveRes.quotation);
      if (!emailRes.success) {
        return NextResponse.json(
          {
            error: `Zoho CRM Send Mail API failed to deliver customer quotation: ${emailRes.error || 'Unknown error'}`,
            quotation: preSaveRes.quotation,
            emailResult: emailRes,
          },
          { status: 502 }
        );
      }

      // Step 3: Record 'sent_to_customer' state and messageId in Zoho CRM
      const sentSaveRes = await saveAdminQuotationInZoho(id, {
        action: 'send_to_customer',
        actor,
        items,
        discountPercent,
        discountAmount,
        gstPercent,
        deliveryCharges,
        additionalCharges,
        validUntil,
        paymentTerms,
        termsAndConditions,
        assignedTo,
        internalNotes,
        quotationDocumentUrl,
        sentMessageId: emailRes.messageId,
      });

      const finalQuotation = sentSaveRes.quotation || preSaveRes.quotation;
      await updateQuotation(finalQuotation.id, finalQuotation);
      const notificationLogs = await getNotificationLogs();

      return NextResponse.json({
        success: true,
        action: 'send_to_customer',
        quotation: finalQuotation,
        emailResult: emailRes,
        notificationLogs,
        message: `Final quotation ${finalQuotation.quotationNumber} sent to customer (${emailRes.recipient}) via Zoho CRM Send Mail API.`,
      });
    }

    // Standard Save Draft / Edit Quotation / Approve Quotation in Zoho CRM
    const zohoUpdateRes = await saveAdminQuotationInZoho(id, {
      action: effectiveAction,
      actor,
      items,
      discountPercent,
      discountAmount,
      gstPercent,
      deliveryCharges,
      additionalCharges,
      validUntil,
      paymentTerms,
      termsAndConditions,
      assignedTo,
      internalNotes,
      quotationDocumentUrl,
    });

    if (!zohoUpdateRes.success || !zohoUpdateRes.quotation) {
      return NextResponse.json(
        { error: zohoUpdateRes.error || 'Failed to update quotation in Zoho CRM' },
        { status: 502 }
      );
    }

    await updateQuotation(zohoUpdateRes.quotation.id, zohoUpdateRes.quotation);

    const actionMessageMap: Record<AdminQuotationUpdateInput['action'], string> = {
      save_draft: `Draft quotation ${zohoUpdateRes.quotation.quotationNumber} (v${zohoUpdateRes.quotation.version}) saved in Zoho CRM.`,
      edit_quotation: `Quotation ${zohoUpdateRes.quotation.quotationNumber} (v${zohoUpdateRes.quotation.version}) unlocked for editing and saved in Zoho CRM.`,
      approve: `Quotation ${zohoUpdateRes.quotation.quotationNumber} (v${zohoUpdateRes.quotation.version}) approved in Zoho CRM! You can now send the final quotation to the customer.`,
      send_to_customer: `Final quotation ${zohoUpdateRes.quotation.quotationNumber} sent to customer.`,
    };

    return NextResponse.json({
      success: true,
      action: effectiveAction,
      quotation: zohoUpdateRes.quotation,
      message: actionMessageMap[effectiveAction],
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update quotation' },
      { status: 500 }
    );
  }
}
