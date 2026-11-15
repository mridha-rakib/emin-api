import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { OrderStatus, PaymentStatus, ProductStatus } from '../../../common/enums/domain.enums';
import { AuthService } from '../../auth/auth.service';
import { Booking, BookingDocument } from '../../bookings/schemas/booking.schema';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import { Product, ProductDocument } from '../../products/schemas/product.schema';
import { ServiceListing, ServiceListingDocument } from '../../services/schemas/service-listing.schema';
import { InvoiceService } from '../../subscriptions/services/invoice.service';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../../subscriptions/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionDocument } from '../../subscriptions/schemas/user-subscription.schema';
import { CheckoutDto } from '../dto/checkout.dto';
import { PayoutService } from './payout.service';
import { StripeCheckout, StripeCheckoutDocument } from '../schemas/stripe-checkout.schema';

const money = (amount: number) => Types.Decimal128.fromString(amount.toFixed(2));
const readMoney = (value: unknown) => {
  const parsed = Number(value && typeof value === 'object' && 'toString' in value ? value.toString() : value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

@Injectable()
export class StripeCheckoutService {
  private readonly logger = new Logger(StripeCheckoutService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
    @InjectModel(StripeCheckout.name) private readonly checkouts: Model<StripeCheckoutDocument>,
    @InjectModel(SubscriptionPlan.name) private readonly plans: Model<SubscriptionPlanDocument>,
    @InjectModel(UserSubscription.name) private readonly subscriptions: Model<UserSubscriptionDocument>,
    private readonly invoices: InvoiceService,
    @InjectModel(Product.name) private readonly products: Model<ProductDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(ServiceListing.name) private readonly services: Model<ServiceListingDocument>,
    @InjectModel(Booking.name) private readonly bookings: Model<BookingDocument>,
    private readonly payouts: PayoutService,
  ) {}

  async create(authorization: string | undefined, dto: CheckoutDto) {
    const user = await this.auth.requireUser(authorization);
    const prepared = await this.prepare(dto);
    if (prepared.amount === 0 && dto.purpose === 'SUBSCRIPTION') {
      const result = await this.activateSubscription(user._id, prepared.payload, 0, undefined);
      return { activated: true, url: null, ...result };
    }
    if (prepared.amount < 0.5) throw new BadRequestException('Stripe payments must be at least CHF 0.50.');

    const checkout = await this.checkouts.create({
      userId: user._id,
      purpose: dto.purpose,
      amount: prepared.amount,
      currency: 'CHF',
      payload: prepared.payload,
    });
    const stripe = this.client();
    const session = await stripe.checkout.sessions.create({
      mode: dto.purpose === 'SUBSCRIPTION' ? 'subscription' : 'payment',
      customer_email: user.email,
      client_reference_id: checkout._id.toString(),
      success_url: `${this.frontendUrl()}/payments/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl()}/payments/cancelled`,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'chf',
          unit_amount: Math.round(prepared.amount * 100),
          product_data: { name: prepared.title },
          ...(dto.purpose === 'SUBSCRIPTION'
            ? { recurring: { interval: dto.billingCycle === 'yearly' ? 'year' : 'month' } }
            : {}),
        },
      }],
      metadata: { checkoutId: checkout._id.toString(), purpose: dto.purpose },
    });
    checkout.stripeSessionId = session.id;
    await checkout.save();
    return { activated: false, url: session.url, checkoutId: checkout._id.toString() };
  }

  async confirm(sessionId: string) {
    if (!sessionId) throw new BadRequestException('Missing Stripe session.');
    const session = await this.client().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return { status: 'PENDING', purpose: session.metadata?.purpose };
    }
    return this.fulfill(sessionId);
  }

  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured.');
    if (!rawBody || !signature) throw new BadRequestException('Missing Stripe signature.');
    const event = this.client().webhooks.constructEvent(rawBody, signature, secret);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.fulfill(session.id);
    }
    return { received: true };
  }

  private async fulfill(sessionId: string) {
    const checkout = await this.checkouts.findOne({ stripeSessionId: sessionId }).exec();
    if (!checkout) throw new NotFoundException('Checkout was not found.');
    if (checkout.status === 'PAID' && checkout.result) return checkout.result;

    const result = checkout.purpose === 'SUBSCRIPTION'
      ? await this.activateSubscription(checkout.userId, checkout.payload, checkout.amount, sessionId)
      : checkout.purpose === 'MARKETPLACE'
        ? await this.recordOrder(checkout.userId, checkout.payload, checkout.amount, sessionId)
        : await this.recordBooking(checkout.userId, checkout.payload, checkout.amount, sessionId);

    checkout.status = 'PAID';
    checkout.paidAt = new Date();
    checkout.result = result;
    await checkout.save();
    return result;
  }

  private async prepare(dto: CheckoutDto) {
    if (dto.purpose === 'SUBSCRIPTION') {
      if (!dto.planId || !Types.ObjectId.isValid(dto.planId)) throw new BadRequestException('Choose a subscription plan.');
      const plan = await this.plans.findById(dto.planId).exec();
      if (!plan || plan.active === false) throw new NotFoundException('This plan is not available.');
      const yearly = dto.billingCycle === 'yearly';
      return {
        amount: readMoney(yearly ? plan.yearlyPrice : plan.monthlyPrice),
        title: `${plan.name} subscription`,
        payload: { planId: plan._id.toString(), planName: plan.name, billingCycle: yearly ? 'yearly' : 'monthly' },
      };
    }
    if (dto.purpose === 'MARKETPLACE') {
      if (!dto.productId || !Types.ObjectId.isValid(dto.productId)) throw new BadRequestException('Choose a product.');
      if (!dto.shipping) throw new BadRequestException('A delivery address is required.');
      const product = await this.products.findById(dto.productId).exec();
      if (!product || product.deletedAt || product.status === ProductStatus.SOLD) throw new NotFoundException('This product is not available.');
      const listed = readMoney(product.buyNowPrice ?? product.price);
      const offered = dto.amount && dto.amount > 0 && dto.amount <= listed ? dto.amount : listed;
      return {
        amount: offered,
        title: product.title,
        payload: {
          productId: product._id.toString(),
          sellerId: product.sellerId.toString(),
          title: product.title,
          listed,
          shipping: dto.shipping,
        },
      };
    }
    if (!dto.serviceId || !Types.ObjectId.isValid(dto.serviceId)) throw new BadRequestException('Choose a service.');
    if (!dto.booking) throw new BadRequestException('Booking details are required.');
    const service = await this.services.findById(dto.serviceId).exec();
    if (!service || service.status !== 'ACTIVE') throw new NotFoundException('This service is not available.');
    return {
      amount: readMoney(service.price) || 60,
      title: service.title,
      payload: {
        serviceId: service._id.toString(),
        serviceTitle: service.title,
        serviceCategory: service.category,
        providerId: service.providerId?.toString(),
        booking: dto.booking,
      },
    };
  }

  private async activateSubscription(userId: Types.ObjectId, payload: Record<string, unknown>, amount: number, sessionId?: string) {
    await this.subscriptions.updateMany({ userId, status: 'ACTIVE' }, { $set: { status: 'CANCELLED' } }).exec();
    const subscription = await this.subscriptions.create({
      userId,
      planId: new Types.ObjectId(String(payload.planId)),
      planName: String(payload.planName),
      billingCycle: payload.billingCycle,
      amount: money(amount),
      currency: 'CHF',
      status: 'ACTIVE',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + (payload.billingCycle === 'yearly' ? 365 : 30) * 86400000),
      paymentDetails: { provider: amount === 0 ? 'free' : 'stripe', sessionId },
    });
    const issued = amount > 0
      ? await this.invoices.issuePaid({
          userId,
          amount,
          title: `${String(payload.planName)} subscription`,
          purpose: 'SUBSCRIPTION',
          subscriptionId: subscription._id,
          sessionId,
        })
      : null;
    return {
      status: 'PAID',
      purpose: 'SUBSCRIPTION',
      planName: subscription.planName,
      amount,
      subscriptionId: subscription._id.toString(),
      invoiceId: issued?.invoice._id.toString(),
      invoiceNumber: issued?.invoice.invoiceNumber,
      emailSent: issued?.emailed ?? false,
    };
  }

  private async recordOrder(userId: Types.ObjectId, payload: Record<string, unknown>, amount: number, sessionId: string) {
    const shipping = payload.shipping as CheckoutDto['shipping'];
    const listed = Number(payload.listed) || amount;
    const order = await this.orders.create({
      orderNumber: `ORD-${Date.now()}`,
      buyerId: userId,
      items: [{
        productId: new Types.ObjectId(String(payload.productId)),
        sellerId: new Types.ObjectId(String(payload.sellerId)),
        productSnapshot: { title: payload.title },
        quantity: 1,
        unitPrice: money(amount),
        subtotal: money(amount),
        commissionAmount: money(0),
        sellerNetAmount: money(amount),
      }],
      shippingAddress: {
        fullName: shipping?.fullName || 'Customer',
        phone: shipping?.phone || '-',
        addressLine1: shipping?.addressLine1 || '-',
        city: shipping?.city || '-',
        postalCode: shipping?.postalCode || '-',
        country: shipping?.country || 'Switzerland',
      },
      amounts: { subtotal: money(listed), shipping: money(0), tax: money(0), discount: money(Math.max(listed - amount, 0)), total: money(amount) },
      currency: 'CHF',
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.CONFIRMED,
    });
    await this.products.updateOne({ _id: payload.productId }, { $set: { status: ProductStatus.SOLD, quantity: 0 } }).exec();
    const product = await this.products.findById(payload.productId).exec();
    await this.holdPayout({
      payeeId: product?.sellerUserId,
      role: 'seller',
      sourceType: 'ORDER',
      sourceId: order._id,
      amount,
      currency: 'CHF',
      title: String(payload.title || 'Marketplace order'),
    });
    const issued = await this.invoices.issuePaid({
      userId,
      amount,
      title: String(payload.title || 'Marketplace purchase'),
      purpose: 'MARKETPLACE',
      sessionId,
      reference: order.orderNumber,
    });
    return {
      status: 'PAID',
      purpose: 'MARKETPLACE',
      orderNumber: order.orderNumber,
      amount,
      stripeSessionId: sessionId,
      invoiceId: issued.invoice._id.toString(),
      invoiceNumber: issued.invoice.invoiceNumber,
      emailSent: issued.emailed,
    };
  }

  private async recordBooking(userId: Types.ObjectId, payload: Record<string, unknown>, amount: number, sessionId: string) {
    const booking = payload.booking as CheckoutDto['booking'];
    const saved = await this.bookings.create({
      customerId: userId,
      customerName: booking?.customerName || 'Customer',
      customerPhone: booking?.customerPhone,
      providerId: payload.providerId ? new Types.ObjectId(String(payload.providerId)) : undefined,
      serviceId: new Types.ObjectId(String(payload.serviceId)),
      serviceTitle: String(payload.serviceTitle),
      serviceCategory: payload.serviceCategory ? String(payload.serviceCategory) : undefined,
      scheduledAt: booking?.date ? new Date(`${booking.date}T09:00:00`) : undefined,
      location: booking?.location,
      amount: money(amount),
      currency: 'CHF',
      status: 'confirmed',
      metadata: { paymentStatus: 'PAID', stripeSessionId: sessionId, timeSlot: booking?.time, notes: booking?.notes },
    });
    const service = await this.services.findById(payload.serviceId).exec();
    await this.holdPayout({
      payeeId: service?.providerUserId,
      role: 'provider',
      sourceType: 'BOOKING',
      sourceId: saved._id,
      amount,
      currency: 'CHF',
      title: String(saved.serviceTitle || 'Service booking'),
    });
    const issued = await this.invoices.issuePaid({
      userId,
      amount,
      title: String(saved.serviceTitle || 'Service booking'),
      purpose: 'SERVICE',
      sessionId,
      reference: saved._id.toString(),
    });
    return {
      status: 'PAID',
      purpose: 'SERVICE',
      bookingId: saved._id.toString(),
      serviceTitle: saved.serviceTitle,
      amount,
      invoiceId: issued.invoice._id.toString(),
      invoiceNumber: issued.invoice.invoiceNumber,
      emailSent: issued.emailed,
    };
  }

  private async holdPayout(input: Parameters<PayoutService['hold']>[0]) {
    try {
      await this.payouts.hold(input);
    } catch (error) {
      this.logger.warn(`Could not record the held payout: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private client() {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) throw new BadRequestException('STRIPE_SECRET_KEY is not configured.');
    return new Stripe(key);
  }

  private frontendUrl() {
    return (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3002').replace(/\/$/, '');
  }
}
