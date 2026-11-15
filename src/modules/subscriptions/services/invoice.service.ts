import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { AuthService } from '../../auth/auth.service';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { buildInvoicePdf, invoiceFileName } from '../invoice-pdf';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { InvoiceDocument } from '../schemas/invoice.schema';
import { UserSubscription, UserSubscriptionDocument } from '../schemas/user-subscription.schema';

const readMoney = (value: unknown) => {
  const parsed = Number(value && typeof value === 'object' && 'toString' in value ? value.toString() : value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char);

export type PaidInvoiceInput = {
  userId: Types.ObjectId;
  amount: number;
  currency?: string;
  title: string;
  purpose: 'SUBSCRIPTION' | 'MARKETPLACE' | 'SERVICE';
  subscriptionId?: Types.ObjectId;
  sessionId?: string;
  reference?: string;
};

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly repository: InvoiceRepository,
    private readonly auth: AuthService,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(UserSubscription.name) private readonly subscriptions: Model<UserSubscriptionDocument>,
  ) {}

  create(dto: RawPayloadDto) {
    return this.repository.createOne(dto.payload ?? {});
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: RawPayloadDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? {} });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }

  async issuePaid(input: PaidInvoiceInput) {
    const invoice = await this.repository.createOne({
      invoiceNumber: `INV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
      userId: input.userId,
      ...(input.subscriptionId ? { subscriptionId: input.subscriptionId } : {}),
      amount: Types.Decimal128.fromString(input.amount.toFixed(2)),
      currency: input.currency || 'CHF',
      status: 'PAID',
      paidAt: new Date(),
      metadata: {
        purpose: input.purpose,
        title: input.title,
        ...(input.sessionId ? { stripeSessionId: input.sessionId } : {}),
        ...(input.reference ? { reference: input.reference } : {}),
      },
    });
    const emailed = await this.emailInvoice(invoice);
    return { invoice, emailed };
  }

  async download(id: string) {
    const invoice = await this.repository.findOne({ _id: id });
    if (!invoice) throw new NotFoundException('Invoice not found.');
    const file = await this.render(invoice);
    return { ...file, invoiceNumber: invoice.invoiceNumber };
  }

  private async emailInvoice(invoice: InvoiceDocument) {
    const customer = await this.customer(invoice);
    if (!customer.email) return false;
    try {
      const file = await this.render(invoice, customer);
      const amount = `${invoice.currency || 'CHF'} ${readMoney(invoice.amount).toFixed(2)}`;
      const subscription = await this.subscriptionSummary(invoice);
      const summary = subscription
        ? `Subscription\nPlan: ${subscription.planName}\nBilling: ${subscription.billingCycle}\nAmount: ${amount}${subscription.activeUntil ? `\nActive until: ${subscription.activeUntil}` : ''}\n\n`
        : '';
      const summaryHtml = subscription
        ? `<p><strong>Subscription</strong><br>Plan: ${escapeHtml(subscription.planName)}<br>Billing: ${escapeHtml(subscription.billingCycle)}<br>Amount: ${escapeHtml(amount)}${subscription.activeUntil ? `<br>Active until: ${escapeHtml(subscription.activeUntil)}` : ''}</p>`
        : '';
      const text = `Your payment was successful.\n\n${summary}Invoice ${invoice.invoiceNumber} for ${amount} is attached as a PDF.\n\nOdaboo\nhello@odaboo.com`;
      const html = `<p>Your payment was successful.</p>${summaryHtml}<p>Invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong> for ${escapeHtml(amount)} is attached as a PDF.</p><p>Odaboo<br>hello@odaboo.com</p>`;
      await this.auth.sendEmail(customer.email, `Your Odaboo invoice ${invoice.invoiceNumber}`, text, html, [
        { filename: file.filename, content: file.buffer, contentType: 'application/pdf' },
      ]);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(`Invoice ${invoice.invoiceNumber} could not be emailed: ${message}`);
      return false;
    }
  }

  private async render(invoice: InvoiceDocument, knownCustomer?: { name: string; email: string }) {
    const customer = knownCustomer ?? (await this.customer(invoice));
    const metadata = invoice.metadata ?? {};
    const title = typeof metadata.title === 'string' && metadata.title ? metadata.title : 'Payment';
    const reference = typeof metadata.reference === 'string' ? metadata.reference : undefined;
    const subscription = await this.subscriptionSummary(invoice);
    const buffer = await buildInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.paidAt ?? new Date(),
      status: invoice.status || 'PAID',
      currency: invoice.currency || 'CHF',
      amount: readMoney(invoice.amount),
      title,
      customerName: customer.name,
      customerEmail: customer.email,
      reference,
      planName: subscription?.planName,
      billingCycle: subscription?.billingCycle,
      activeUntil: subscription?.activeUntil,
    });
    return { buffer, filename: invoiceFileName(invoice.invoiceNumber) };
  }

  private async subscriptionSummary(invoice: InvoiceDocument) {
    if (!invoice.subscriptionId) return null;
    const subscription = await this.subscriptions.findById(invoice.subscriptionId).select('planName billingCycle endsAt').exec();
    if (!subscription) return null;
    return {
      planName: subscription.planName,
      billingCycle: subscription.billingCycle === 'yearly' ? 'Yearly' : 'Monthly',
      activeUntil: subscription.endsAt
        ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(subscription.endsAt)
        : '',
    };
  }

  private async customer(invoice: InvoiceDocument) {
    const user = await this.users.findById(invoice.userId).select('firstName lastName email').exec();
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    return { name: name || 'Customer', email: user?.email || '' };
  }
}
