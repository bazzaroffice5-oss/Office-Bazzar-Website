import { NextResponse } from 'next/server';
import { getQuotationById } from '@/lib/db/store';
import { BUSINESS_CONFIG } from '@/lib/config/business';

function numberToIndianWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const twoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 !== 0 ? ' ' + ones[n % 10] : ''}`;
  };

  const threeDigits = (n: number): string => {
    if (n < 100) return twoDigits(n);
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 !== 0 ? ' and ' + twoDigits(n % 100) : ''}`;
  };

  let num = Math.abs(rounded);
  const parts: string[] = [];

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
  if (remainder > 0) parts.push(threeDigits(remainder));

  return `Rupees ${parts.join(' ')} Only`;
}

function escapeHtml(str?: string | number | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const decodedId = decodeURIComponent(id);
    const { searchParams } = new URL(req.url);
    const autoPrint = searchParams.get('print') === '1';

    const quotation = await getQuotationById(decodedId);
    if (!quotation) {
      return NextResponse.json(
        { error: `Quotation "${decodedId}" not found in Zoho CRM.` },
        { status: 404 }
      );
    }

    const subtotal = quotation.subtotal ?? quotation.indicativeSubtotal ?? 0;
    const discountPercent = quotation.discountPercent ?? 0;
    const discountAmount = quotation.discountAmount ?? 0;
    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const gstPercent = quotation.gstPercent ?? 18;
    const gstAmount = quotation.gstAmount ?? quotation.indicativeGstAmount ?? 0;
    const deliveryCharges = quotation.deliveryCharges ?? 0;
    const additionalCharges = quotation.additionalCharges ?? 0;
    const grandTotal =
      quotation.grandTotal ?? quotation.quotedAmount ?? quotation.indicativeTotal ?? 0;

    const halfGstRate = gstPercent / 2;
    const halfGstAmount = gstAmount / 2;

    const issueDate = new Date(quotation.updatedAt || quotation.createdAt).toLocaleDateString(
      'en-IN',
      { day: '2-digit', month: 'short', year: 'numeric' }
    );
    const rfqDate = new Date(quotation.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const rowsHtml = quotation.items
      .map((item, idx) => {
        const lineSub = item.lineSubtotal ?? item.quantity * item.indicativeUnitPrice;
        const origQty = item.originalQuantity ?? item.quantity;
        return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>
            <div class="prod-name">${escapeHtml(item.productName)}</div>
            <div class="prod-meta">
              SKU: <strong>${escapeHtml(item.sku)}</strong>
              ${item.packSize ? ` &bull; Pack: ${escapeHtml(item.packSize)}` : ''}
              ${item.hsnCode ? ` &bull; HSN: ${escapeHtml(item.hsnCode)}` : ''}
            </div>
          </td>
          <td class="text-center muted">${origQty}</td>
          <td class="text-center font-bold">${item.quantity}</td>
          <td class="text-right">₹${item.indicativeUnitPrice.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
          <td class="text-center">${item.gstPercent ?? gstPercent}%</td>
          <td class="text-right font-bold">₹${lineSub.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</td>
        </tr>`;
      })
      .join('');

    const statusBadgeLabel =
      quotation.status === 'approved'
        ? 'APPROVED QUOTATION'
        : quotation.status === 'sent_to_customer'
        ? 'FINAL QUOTATION'
        : quotation.status === 'quotation_prepared'
        ? 'DRAFT QUOTATION'
        : 'RFQ QUOTATION';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quotation_${escapeHtml(quotation.quotationNumber)}_OfficeBazzar</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #e2e8f0;
      padding: 24px 16px;
      font-size: 12px;
      line-height: 1.45;
    }
    .toolbar {
      max-width: 850px;
      margin: 0 auto 16px auto;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }
    .toolbar-title {
      font-size: 13px;
      font-weight: 700;
    }
    .toolbar-sub {
      font-size: 11px;
      color: #94a3b8;
    }
    .btn-print {
      background: #dc2626;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-print:hover {
      background: #b91c1c;
    }
    .page {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand-logo {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #1e3a8a;
    }
    .brand-logo span {
      color: #dc2626;
    }
    .company-legal {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .company-address {
      font-size: 11px;
      color: #475569;
      margin-top: 4px;
      max-width: 380px;
    }
    .doc-box {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      background: #1e3a8a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .doc-number {
      font-size: 18px;
      font-weight: 800;
      color: #dc2626;
      margin-top: 6px;
      font-family: monospace;
    }
    .doc-meta {
      font-size: 11px;
      color: #475569;
      margin-top: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px 14px;
      background: #f8fafc;
    }
    .info-card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e3a8a;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11.5px;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
    }
    .info-val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table.items-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 9px 8px;
      border: 1px solid #0f172a;
    }
    table.items-table td {
      padding: 9px 8px;
      border: 1px solid #cbd5e1;
      font-size: 11.5px;
      vertical-align: top;
    }
    .prod-name {
      font-weight: 700;
      color: #0f172a;
    }
    .prod-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .muted { color: #64748b; }
    .summary-section {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .words-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px 14px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      font-size: 12px;
    }
    .totals-table tr.grand-row td {
      background: #fef2f2;
      border-top: 2px solid #dc2626;
      font-size: 14px;
      font-weight: 800;
      color: #dc2626;
      padding: 9px 10px;
    }
    .terms-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 24px;
      font-size: 11px;
      color: #334155;
    }
    .footer-sign {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
    }
    .sign-box {
      text-align: right;
    }
    .sign-line {
      margin-top: 36px;
      border-top: 1px solid #0f172a;
      padding-top: 4px;
      font-weight: 700;
      display: inline-block;
      min-width: 200px;
      text-align: center;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none !important; }
      .page { box-shadow: none; padding: 15px 20px; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <div class="toolbar-title">Office Bazzar — Official Quotation PDF Preview (${escapeHtml(quotation.quotationNumber)})</div>
      <div class="toolbar-sub">Revision v${quotation.version || 1} &bull; Click "Print / Download PDF" to save as A4 PDF</div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Print / Download PDF</button>
  </div>

  <div class="page">
    <div class="header">
      <div>
        <div class="brand-logo">OFFICE<span>BAZZAR</span></div>
        <div class="company-legal">${escapeHtml(BUSINESS_CONFIG.legalEntityName)}</div>
        <div class="company-address">
          ${escapeHtml(BUSINESS_CONFIG.headquarters.address)}, ${escapeHtml(BUSINESS_CONFIG.headquarters.city)}, ${escapeHtml(BUSINESS_CONFIG.headquarters.state)} – ${escapeHtml(BUSINESS_CONFIG.headquarters.pincode)}<br/>
          Phone: ${escapeHtml(BUSINESS_CONFIG.contact.salesPhone)} / ${escapeHtml(BUSINESS_CONFIG.contact.corporatePhone)} &bull; Email: ${escapeHtml(BUSINESS_CONFIG.contact.salesEmail)}<br/>
          Website: ${escapeHtml(BUSINESS_CONFIG.websiteUrl)}${BUSINESS_CONFIG.tax.gstin ? ` &bull; GSTIN: <strong>${escapeHtml(BUSINESS_CONFIG.tax.gstin)}</strong>` : ''}
        </div>
      </div>
      <div class="doc-box">
        <div class="doc-badge">${statusBadgeLabel}</div>
        <div class="doc-number">${escapeHtml(quotation.quotationNumber)}</div>
        <div class="doc-meta">
          <strong>Quotation Date:</strong> ${issueDate}<br/>
          <strong>Valid Until:</strong> ${escapeHtml(quotation.validUntil || '30 Days')}<br/>
          <strong>Revision:</strong> v${quotation.version || 1}
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-title">Customer &amp; Billing / Delivery Details</div>
        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
          ${escapeHtml(quotation.companyName)}
        </div>
        <div style="font-size: 12px; color: #334155; margin-bottom: 3px;">
          <strong>Contact Person:</strong> ${escapeHtml(quotation.customerName)}
        </div>
        <div style="font-size: 11.5px; color: #334155; margin-bottom: 3px;">
          <strong>Email:</strong> ${escapeHtml(quotation.email)} &nbsp;|&nbsp; <strong>Phone:</strong> ${escapeHtml(quotation.phone)}
        </div>
        <div style="font-size: 11.5px; color: #334155; margin-bottom: 3px;">
          <strong>Customer GSTIN:</strong> ${escapeHtml(quotation.gstin || 'Not Provided')}
        </div>
        <div style="font-size: 11.5px; color: #334155;">
          <strong>Delivery Location:</strong> ${escapeHtml(quotation.deliveryLocation ? `${quotation.deliveryLocation}, ` : '')}PIN: <strong>${escapeHtml(quotation.pincode)}</strong>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-title">Quotation &amp; RFQ Reference</div>
        <div class="info-row">
          <span class="info-label">Original RFQ Ref:</span>
          <span class="info-val">${escapeHtml(quotation.quotationNumber)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">RFQ Submitted Date:</span>
          <span class="info-val">${rfqDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Quotation Validity:</span>
          <span class="info-val" style="color: #dc2626;">${escapeHtml(quotation.validUntil || '30 Days')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Prepared / Assigned By:</span>
          <span class="info-val">${escapeHtml(quotation.assignedTo || quotation.approvedBy || 'Office Bazzar B2B Sales Desk')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Currency:</span>
          <span class="info-val">INR (₹)</span>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 36px;">#</th>
          <th style="text-align: left;">Product Description &amp; SKU</th>
          <th style="width: 75px;">RFQ Qty</th>
          <th style="width: 80px;">Quoted Qty</th>
          <th style="width: 110px; text-align: right;">Unit Price (₹)</th>
          <th style="width: 65px;">GST %</th>
          <th style="width: 120px; text-align: right;">Item Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="words-box">
        <div>
          <div class="info-card-title">Grand Total in Words</div>
          <div style="font-size: 12.5px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
            ${escapeHtml(numberToIndianWords(grandTotal))}
          </div>

          <div class="info-card-title" style="margin-top: 8px;">Payment Terms</div>
          <div style="font-size: 11.5px; color: #334155; white-space: pre-wrap;">${escapeHtml(quotation.paymentTerms || '100% Advance against Proforma Invoice or as mutually agreed.')}</div>
        </div>

        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 10.5px; color: #475569;">
          <strong>Tax Breakup Note:</strong> Total GST (${gstPercent}%) = ₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Intra-state: CGST ${halfGstRate}% ₹${halfGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + SGST ${halfGstRate}% ₹${halfGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / Inter-state: IGST ${gstPercent}%).
        </div>
      </div>

      <div>
        <table class="totals-table">
          <tr>
            <td class="muted">Subtotal (Excl. Taxes):</td>
            <td class="text-right font-bold">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td class="muted">Discount (${discountPercent}%):</td>
            <td class="text-right font-bold" style="color: #16a34a;">-₹${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td class="muted">Taxable Amount:</td>
            <td class="text-right font-bold">₹${taxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td class="muted">GST (${gstPercent}%):</td>
            <td class="text-right font-bold">+₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td class="muted">Delivery &amp; Transport Charges:</td>
            <td class="text-right font-bold">+₹${deliveryCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td class="muted">Additional Charges:</td>
            <td class="text-right font-bold">+₹${additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr class="grand-row">
            <td>GRAND TOTAL (INR):</td>
            <td class="text-right">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="terms-box">
      <div class="info-card-title">Terms &amp; Conditions</div>
      <div style="white-space: pre-wrap; line-height: 1.55;">${escapeHtml(quotation.termsAndConditions || '')}</div>
    </div>

    <div class="footer-sign">
      <div style="color: #64748b;">
        <div>This is a computer-generated official commercial quotation from <strong>${escapeHtml(BUSINESS_CONFIG.legalEntityName)}</strong>.</div>
        <div>For questions or PO placement, email <strong>${escapeHtml(BUSINESS_CONFIG.contact.salesEmail)}</strong> or call <strong>${escapeHtml(BUSINESS_CONFIG.contact.salesPhone)}</strong>.</div>
      </div>
      <div class="sign-box">
        <div style="font-size: 11px; font-weight: 700; color: #1e3a8a;">For ${escapeHtml(BUSINESS_CONFIG.legalEntityName)}</div>
        <div class="sign-line">Authorized Signatory</div>
      </div>
    </div>
  </div>

  ${autoPrint ? `<script>window.addEventListener('load', () => { setTimeout(() => window.print(), 300); });</script>` : ''}
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate quotation PDF' },
      { status: 500 }
    );
  }
}

