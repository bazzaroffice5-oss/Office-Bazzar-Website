import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/service';
import { getAllQuotations, updateQuotation } from '@/lib/db/store';
import { syncQuotationToZoho } from '@/lib/zoho/crm';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = getSessionFromRequest(req);
    const authHeader = req.headers.get('authorization') || req.headers.get('x-admin-secret');
    const secretKey = process.env.ADMIN_SECRET_KEY;
    const isCronAuthorized = secretKey && (authHeader === secretKey || authHeader === `Bearer ${secretKey}`);

    if (!isCronAuthorized && (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'staff'))) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative session or valid admin secret required.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetNumber = body.quotationNumber?.trim();

    const allQuotes = await getAllQuotations();
    const candidateQuotes = targetNumber
      ? allQuotes.filter((q) => q.quotationNumber.toUpperCase() === targetNumber.toUpperCase())
      : allQuotes.filter((q) => q.syncMode === 'queued_recovery' || (!q.zohoLeadId && !q.zohoQuoteId));

    if (candidateQuotes.length === 0) {
      return NextResponse.json({
        success: true,
        message: targetNumber
          ? `No pending synchronization needed for ${targetNumber}.`
          : 'All quotations are already synchronized with Zoho CRM.',
        syncedCount: 0,
        results: [],
      });
    }

    const results: Array<{
      quotationNumber: string;
      success: boolean;
      syncMode?: string;
      leadId?: string;
      quoteId?: string;
      error?: string;
    }> = [];

    for (const quote of candidateQuotes) {
      try {
        const syncRes = await syncQuotationToZoho(quote);
        if (syncRes.success) {
          const updates: any = {
            syncMode: syncRes.syncMode,
            syncStatus: syncRes.syncStatus || 'SYNCED',
            syncError: undefined,
            lastSyncedAt: new Date().toISOString(),
            zohoQuoteId: syncRes.quoteId || quote.zohoQuoteId,
            zohoLeadId: syncRes.leadId || quote.zohoLeadId,
            zohoContactId: syncRes.contactId || quote.zohoContactId,
            zohoAccountId: syncRes.accountId || quote.zohoAccountId,
          };
          if (syncRes.quoteId) {
            updates.id = syncRes.quoteId;
          }

          await updateQuotation(quote.id, updates);

          results.push({
            quotationNumber: quote.quotationNumber,
            success: true,
            syncMode: syncRes.syncMode,
            leadId: syncRes.leadId,
            quoteId: syncRes.quoteId,
          });
        } else {
          await updateQuotation(quote.id, {
            syncStatus: 'RETRY_PENDING',
            syncError: syncRes.error || 'Synchronization failed',
            lastSyncedAt: new Date().toISOString(),
          });
          results.push({
            quotationNumber: quote.quotationNumber,
            success: false,
            error: syncRes.error || 'Synchronization failed',
          });
        }
      } catch (err: any) {
        await updateQuotation(quote.id, {
          syncStatus: 'FAILED',
          syncError: err?.message || String(err),
          lastSyncedAt: new Date().toISOString(),
        });
        results.push({
          quotationNumber: quote.quotationNumber,
          success: false,
          error: err?.message || String(err),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      syncedCount: successCount,
      failedCount: results.length - successCount,
      results,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to execute Zoho CRM synchronization retry.' },
      { status: 500 }
    );
  }
}
