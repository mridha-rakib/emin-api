import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { AccountType } from '../../../common/enums/domain.enums';
import { AuthService } from '../../auth/auth.service';
import { Booking, BookingDocument } from '../../bookings/schemas/booking.schema';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { HeldPayout, HeldPayoutDocument } from '../schemas/held-payout.schema';
import { PayoutMethod, PayoutMethodDocument } from '../schemas/payout-method.schema';

type HoldInput = {
  payeeId?: Types.ObjectId;
  role?: 'provider' | 'seller';
  sourceType: 'BOOKING' | 'ORDER';
  sourceId: Types.ObjectId;
  amount: number;
  currency: string;
  title: string;
};

const readMoney = (value: unknown) => {
  const parsed = Number(value && typeof value === 'object' && 'toString' in value ? value.toString() : value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clip = (value: string) => value.replace(/\b\d{13,19}\b/g, '[removed]').slice(0, 500);

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
    @InjectModel(PayoutMethod.name) private readonly methods: Model<PayoutMethodDocument>,
    @InjectModel(HeldPayout.name) private readonly payouts: Model<HeldPayoutDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Booking.name) private readonly bookings: Model<BookingDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
  ) {}

  async beginSetup(authorization: string | undefined, ip?: string) {
    const user = await this.requirePayee(authorization);
    const existing = await this.methods.findOne({ userId: user._id }).exec();
    const customerId = existing?.stripeCustomerId || (await this.client().customers.create({
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      metadata: { userId: user._id.toString() },
    })).id;
    if (!existing?.stripeCustomerId) {
      await this.methods.findOneAndUpdate(
        { userId: user._id },
        { $set: { stripeCustomerId: customerId, status: existing?.status || 'PENDING' } },
        { upsert: true },
      ).exec();
    }
    const session = await this.client().checkout.sessions.create({
      mode: 'setup',
      currency: 'chf',
      customer: customerId,
      allowed_payment_method_types: ['card'],
      success_url: `${this.frontendUrl()}/payments/payout-card?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl()}${user.accountType === AccountType.SELLER ? '/seller/products' : '/myprofile_provider'}`,
      metadata: { userId: user._id.toString(), purpose: 'PAYOUT_CARD', ip: ip || '' },
    });
    return { url: session.url };
  }

  async confirmSetup(authorization: string | undefined, sessionId: string) {
    const user = await this.requirePayee(authorization);
    if (!sessionId) throw new BadRequestException('Missing Stripe session.');
    const session = await this.client().checkout.sessions.retrieve(sessionId, {
      expand: ['setup_intent.payment_method'],
    });
    if (session.metadata?.userId !== user._id.toString()) {
      throw new ForbiddenException('This card setup belongs to another account.');
    }
    if (session.status !== 'complete') {
      return { card: null, payouts: await this.listFor(user._id), status: 'PENDING', detail: 'Stripe has not finished saving the card.' };
    }

    const intent = session.setup_intent;
    const method = intent && typeof intent !== 'string' ? intent.payment_method : undefined;
    const paymentMethod = method && typeof method !== 'string' ? method : null;
    const card = paymentMethod?.card;
    if (!card?.last4) {
      return { card: null, payouts: await this.listFor(user._id), status: 'PENDING', detail: 'Stripe did not return a card for this setup.' };
    }

    const existing = await this.methods.findOne({ userId: user._id }).exec();
    let stripeAccountId = existing?.stripeAccountId;
    let status = 'ACTIVE';
    let detail = `Stripe is storing the ${card.brand || 'card'} ending ${card.last4}.`;
    if (!stripeAccountId) {
      try {
        const account = await this.client().accounts.create({
          type: 'custom',
          country: 'CH',
          email: user.email,
          business_type: 'individual',
          capabilities: { transfers: { requested: true } },
          individual: {
            first_name: user.firstName || 'Account',
            last_name: user.lastName || 'Holder',
            email: user.email,
          },
          tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: this.clientIp(session.metadata?.ip),
          },
          metadata: { userId: user._id.toString() },
        });
        stripeAccountId = account.id;
      } catch (error) {
        status = 'PENDING';
        detail = `Stripe is storing the card ending ${card.last4}. The payout account could not be opened: ${this.errorText(error)}`;
      }
    }
    if (stripeAccountId && paymentMethod?.id) {
      try {
        await this.client().accounts.createExternalAccount(stripeAccountId, { external_account: paymentMethod.id });
      } catch (error) {
        status = 'PENDING';
        detail = `Stripe is storing the card ending ${card.last4}. It cannot receive payouts yet: ${this.errorText(error)}`;
      }
    }

    await this.methods.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : existing?.stripeCustomerId,
          stripePaymentMethodId: paymentMethod?.id,
          ...(stripeAccountId ? { stripeAccountId } : {}),
          brand: card.brand,
          last4: card.last4,
          expMonth: card.exp_month,
          expYear: card.exp_year,
          status,
          detail,
        },
      },
      { upsert: true, new: true },
    ).exec();
    return this.mine(authorization);
  }

  async mine(authorization: string | undefined) {
    const user = await this.requirePayee(authorization);
    const method = await this.methods.findOne({ userId: user._id }).exec();
    return { card: method?.last4 ? this.publicCard(method) : null, payouts: await this.listFor(user._id) };
  }

  async hold(input: HoldInput) {
    const missingPayee = !input.payeeId;
    await this.payouts.findOneAndUpdate(
      { sourceType: input.sourceType, sourceId: input.sourceId },
      {
        $setOnInsert: {
          payeeId: input.payeeId,
          role: input.role,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          title: input.title,
          amount: Types.Decimal128.fromString(input.amount.toFixed(2)),
          currency: input.currency || 'CHF',
          status: missingPayee ? 'PENDING' : 'HELD',
          detail: missingPayee
            ? 'Payment is on the platform account, but no provider or seller account is linked to this job.'
            : 'Payment is held on the platform account until the job is marked completed.',
        },
      },
      { upsert: true, new: true },
    ).exec();
  }

  async releaseSource(sourceType: 'BOOKING' | 'ORDER', sourceId: string) {
    if (!Types.ObjectId.isValid(sourceId)) return null;
    const payout = await this.payouts.findOne({ sourceType, sourceId }).exec();
    if (!payout) {
      return { status: 'PENDING', detail: 'No held payment was found for this job.', amount: 0, currency: 'CHF', title: '', sourceType };
    }
    return this.transfer(payout);
  }

  async releaseById(authorization: string | undefined, id: string) {
    const user = await this.requirePayee(authorization);
    const payout = await this.payouts.findById(id).exec();
    if (!payout) throw new NotFoundException('Held payment was not found.');
    if (payout.payeeId?.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only release payments for your own jobs.');
    }
    if (payout.sourceType === 'BOOKING') {
      await this.bookings.updateOne({ _id: payout.sourceId }, { $set: { status: 'completed' } }).exec();
    }
    if (payout.sourceType === 'ORDER') {
      await this.orders.updateOne(
        { _id: payout.sourceId },
        { $set: { orderStatus: 'DELIVERED', fulfillmentStatus: 'FULFILLED' } },
      ).exec();
    }
    return this.transfer(payout);
  }

  async adminList(authorization: string | undefined) {
    await this.auth.requireAdmin(authorization);
    const rows = await this.payouts.find().sort({ createdAt: -1 }).limit(100).select('-stripeTransferId').exec();
    const payeeIds = rows.map((row) => row.payeeId).filter((id): id is Types.ObjectId => Boolean(id));
    const [people, methods] = await Promise.all([
      this.users.find({ _id: { $in: payeeIds } }).select('firstName lastName accountType').exec(),
      this.methods.find({ userId: { $in: payeeIds } }).select('userId brand last4').exec(),
    ]);
    return {
      items: rows.map((row) => {
        const person = people.find((item) => item._id.toString() === row.payeeId?.toString());
        const method = methods.find((item) => item.userId.toString() === row.payeeId?.toString());
        return {
          id: row._id.toString(),
          payeeName: person ? [person.firstName, person.lastName].filter(Boolean).join(' ') : 'Unlinked account',
          role: person?.accountType || row.role || '',
          brand: method?.brand || '',
          last4: method?.last4 || '',
          amount: readMoney(row.amount),
          currency: row.currency,
          status: row.status,
          detail: clip(row.detail || ''),
          title: row.title || '',
          sourceType: row.sourceType,
          createdAt: row.get('createdAt'),
        };
      }),
    };
  }

  private async transfer(payout: HeldPayoutDocument) {
    if (payout.status === 'TRANSFERRED') return this.publicPayout(payout);
    if (!payout.payeeId) {
      payout.status = 'PENDING';
      payout.detail = 'This payment remains on the platform account because no provider or seller is linked to it.';
      await payout.save();
      return this.publicPayout(payout);
    }
    const method = await this.methods.findOne({ userId: payout.payeeId }).exec();
    if (!method?.last4) {
      payout.status = 'PENDING';
      payout.detail = 'This payment remains on the platform account. Add a payout card on the profile before it can be transferred.';
      await payout.save();
      return this.publicPayout(payout);
    }
    if (!method.stripeAccountId) {
      payout.status = 'PENDING';
      payout.detail = clip(method.detail || `The card ending ${method.last4} is saved with Stripe, but the payout account is not ready.`);
      await payout.save();
      return this.publicPayout(payout);
    }
    try {
      const transfer = await this.client().transfers.create({
        amount: Math.round(readMoney(payout.amount) * 100),
        currency: (payout.currency || 'CHF').toLowerCase(),
        destination: method.stripeAccountId,
        metadata: { payoutId: payout._id.toString(), sourceType: payout.sourceType, sourceId: payout.sourceId.toString() },
      });
      payout.status = 'TRANSFERRED';
      payout.stripeTransferId = transfer.id;
      payout.releasedAt = new Date();
      payout.detail = `Transferred to the ${method.brand || 'card'} ending ${method.last4}.`;
    } catch (error) {
      payout.status = 'PENDING';
      payout.detail = `The payment remains on the platform account. Stripe could not transfer it to the card ending ${method.last4}: ${this.errorText(error)}`;
      this.logger.warn(`Payout ${payout._id.toString()} stayed pending.`);
    }
    await payout.save();
    return this.publicPayout(payout);
  }

  private async listFor(userId: Types.ObjectId) {
    const rows = await this.payouts.find({ payeeId: userId }).sort({ createdAt: -1 }).limit(50).exec();
    return rows.map((row) => this.publicPayout(row));
  }

  private publicCard(method: PayoutMethod) {
    return {
      brand: method.brand || 'card',
      last4: method.last4 || '',
      expMonth: method.expMonth,
      expYear: method.expYear,
      status: method.status,
      detail: clip(method.detail || ''),
    };
  }

  private publicPayout(payout: HeldPayoutDocument) {
    return {
      id: payout._id.toString(),
      title: payout.title || '',
      amount: readMoney(payout.amount),
      currency: payout.currency,
      status: payout.status,
      detail: clip(payout.detail || ''),
      sourceType: payout.sourceType,
    };
  }

  private async requirePayee(authorization: string | undefined) {
    const user = await this.auth.requireUser(authorization);
    if (user.accountType !== AccountType.PROVIDER && user.accountType !== AccountType.SELLER) {
      throw new ForbiddenException('Only providers and sellers can add a payout card.');
    }
    return user;
  }

  private client() {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) throw new BadRequestException('STRIPE_SECRET_KEY is not configured.');
    return new Stripe(key);
  }

  private frontendUrl() {
    return (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').replace(/\/$/, '');
  }

  private clientIp(value?: string) {
    const ip = (value || '').replace(/^::ffff:/, '');
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) ? ip : '127.0.0.1';
  }

  private errorText(error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe rejected the payout.';
    return clip(message);
  }
}
