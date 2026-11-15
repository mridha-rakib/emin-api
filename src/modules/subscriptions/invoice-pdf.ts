import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';

const logo = readFileSync(
  [
    join(__dirname, 'logo.png'),
    join(__dirname, '../../../modules/subscriptions/logo.png'),
    join(process.cwd(), 'src/modules/subscriptions/logo.png'),
  ].find((path) => existsSync(path)) ?? join(__dirname, 'logo.png'),
);

export type InvoicePdfInput = {
  invoiceNumber: string;
  issuedAt: Date;
  status: string;
  currency: string;
  amount: number;
  title: string;
  customerName: string;
  customerEmail?: string;
  reference?: string;
  planName?: string;
  billingCycle?: string;
  activeUntil?: string;
};

export function buildInvoicePdf(input: InvoicePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const amount = `${input.currency} ${input.amount.toFixed(2)}`;
    const issued = input.issuedAt.toISOString().slice(0, 10);

    const logoWidth = 132;
    const logoHeight = logoWidth * (148 / 241);
    doc.image(logo, 56, 46, { width: logoWidth });
    doc.fillColor('#64748b').fontSize(11).text('Invoice', 56, 46 + logoHeight + 10);
    doc.moveDown(1.2);

    doc.fillColor('#0f172a').fontSize(12);
    doc.text(`Invoice number: ${input.invoiceNumber}`);
    doc.text(`Date: ${issued}`);
    doc.text(`Status: ${input.status}`);
    if (input.reference) doc.text(`Reference: ${input.reference}`);
    if (input.planName) doc.text(`Plan: ${input.planName}`);
    if (input.billingCycle) doc.text(`Billing: ${input.billingCycle}`);
    if (input.activeUntil) doc.text(`Active until: ${input.activeUntil}`);
    doc.moveDown();

    doc.fontSize(11).fillColor('#64748b').text('Billed to');
    doc.fillColor('#0f172a').fontSize(12).text(input.customerName || 'Customer');
    if (input.customerEmail) doc.text(input.customerEmail);
    doc.moveDown(1.4);

    const top = doc.y;
    doc.rect(56, top, 483, 36).fill('#f8fafc');
    doc.fillColor('#64748b').fontSize(10).text('Description', 68, top + 12);
    doc.text('Amount', 430, top + 12, { width: 90, align: 'right' });
    doc.fillColor('#0f172a').fontSize(12).text(input.title || 'Payment', 68, top + 52, { width: 340 });
    doc.text(amount, 430, top + 52, { width: 90, align: 'right' });
    doc.moveDown(3);

    doc.moveTo(56, doc.y).lineTo(539, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.6);
    doc.fontSize(14).fillColor('#0D2357').text(`Total paid: ${amount}`, { align: 'right' });
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#64748b').text('Odaboo · hello@odaboo.com');
    doc.text('This invoice was issued after a successful payment.');
    doc.end();
  });
}

export function invoiceFileName(invoiceNumber: string) {
  const safe = invoiceNumber.replace(/[^A-Za-z0-9._-]/g, '-');
  return `Odaboo-${safe}.pdf`;
}
