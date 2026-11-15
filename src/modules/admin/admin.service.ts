import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { UserStatus } from '../../common/enums/domain.enums';
import { AuthService } from '../auth/auth.service';
import { UserDocument } from '../users/schemas/user.schema';

type RawUser = Record<string, any> & { _id: Types.ObjectId; email: string };
type PeopleType = 'all' | 'customers' | 'providers';

const MONTHS_BACK = 12;
const USER_FIELDS = {
  passwordHash: 0,
  emailVerificationOtpHash: 0,
  passwordResetOtpHash: 0,
  phoneVerificationOtpHash: 0,
  phoneVerificationPendingPhone: 0,
};

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
};

const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const lastMonths = () => {
  const now = new Date();
  return Array.from({ length: MONTHS_BACK }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_BACK - 1 - index), 1));
    return monthKey(date);
  });
};

/** Read-only reporting over the live collections for the admin dashboard. Every method requires an administrator. */
@Injectable()
export class AdminService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly auth: AuthService,
  ) {}

  private col(name: string) {
    return this.connection.collection(name);
  }

  private fullName(user: RawUser) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
  }

  private summarize(user: RawUser) {
    return {
      id: user._id.toString(),
      name: this.fullName(user),
      email: user.email,
      phone: user.phone ?? '',
      avatar: user.avatar ?? '',
      status: user.status ?? UserStatus.PENDING,
      location: user.location ?? '',
      profession: user.profession ?? '',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isAdmin: this.auth.isAdminUser(user as unknown as UserDocument),
      verification: this.auth.verificationSummary(user as unknown as UserDocument),
    };
  }

  /** Per-user activity counts, keyed by user id. */
  private async activityByUser() {
    const [services, products, bookings, orders] = await Promise.all([
      this.col('services').aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { providerUserId: { $ne: null } } },
        { $group: { _id: '$providerUserId', count: { $sum: 1 } } },
      ]).toArray(),
      this.col('products').aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { sellerUserId: { $ne: null }, deletedAt: { $exists: false } } },
        { $group: { _id: '$sellerUserId', count: { $sum: 1 } } },
      ]).toArray(),
      this.col('bookings').aggregate<{ _id: Types.ObjectId; count: number; spent: number }>([
        { $match: { customerId: { $ne: null } } },
        { $group: { _id: '$customerId', count: { $sum: 1 }, spent: { $sum: { $toDouble: { $ifNull: ['$amount', 0] } } } } },
      ]).toArray(),
      this.col('orders').aggregate<{ _id: Types.ObjectId; count: number; spent: number }>([
        { $group: { _id: '$buyerId', count: { $sum: 1 }, spent: { $sum: { $toDouble: { $ifNull: ['$amounts.total', 0] } } } } },
      ]).toArray(),
    ]);

    const map = new Map<string, { services: number; products: number; bookings: number; orders: number; spent: number }>();
    const entry = (id: unknown) => {
      const key = String(id);
      if (!map.has(key)) map.set(key, { services: 0, products: 0, bookings: 0, orders: 0, spent: 0 });
      return map.get(key)!;
    };
    services.forEach((row) => (entry(row._id).services = row.count));
    products.forEach((row) => (entry(row._id).products = row.count));
    bookings.forEach((row) => {
      entry(row._id).bookings = row.count;
      entry(row._id).spent += row.spent;
    });
    orders.forEach((row) => {
      entry(row._id).orders = row.count;
      entry(row._id).spent += row.spent;
    });
    return map;
  }

  async overview(authorization?: string) {
    await this.auth.requireAdmin(authorization);
    const months = lastMonths();
    const since = new Date(`${months[0]}-01T00:00:00.000Z`);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [users, activity, services, products, bookingStatus, bookingsToday, orders, feedPosts, openTickets, identityPending, revenue] =
      await Promise.all([
        this.col('users').find({ deletedAt: { $exists: false } }, { projection: USER_FIELDS }).sort({ createdAt: -1 }).toArray() as Promise<RawUser[]>,
        this.activityByUser(),
        this.col('services').aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
        this.col('products').aggregate<{ _id: string; count: number }>([
          { $match: { deletedAt: { $exists: false } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]).toArray(),
        this.col('bookings').aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
        this.col('bookings').countDocuments({ scheduledAt: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + 86400000) } }),
        this.col('orders').aggregate<{ _id: string; count: number }>([{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }]).toArray(),
        this.col('feedPosts').countDocuments(),
        this.col('supportTickets').countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'] } }),
        this.col('identityVerifications').countDocuments({ status: 'PENDING' }),
        this.revenueStreams(since),
      ]);

    const count = (rows: Array<{ _id: string; count: number }>, key?: string) =>
      key ? rows.find((row) => row._id === key)?.count ?? 0 : rows.reduce((sum, row) => sum + row.count, 0);

    const members = users.filter((user) => !this.auth.isAdminUser(user as unknown as UserDocument));
    const providerIds = new Set([...activity.entries()].filter(([, a]) => a.services > 0 || a.products > 0).map(([id]) => id));
    const summaries = members.map((user) => this.summarize(user));

    const signupsByMonth = new Map(months.map((month) => [month, 0]));
    members.forEach((user) => {
      if (user.createdAt && user.createdAt >= since) {
        const key = monthKey(new Date(user.createdAt));
        signupsByMonth.set(key, (signupsByMonth.get(key) ?? 0) + 1);
      }
    });

    return {
      currency: 'CHF',
      users: {
        total: members.length,
        newLast30Days: members.filter((user) => user.createdAt && user.createdAt >= thirtyDaysAgo).length,
        emailVerified: summaries.filter((user) => user.verification.email).length,
        phoneVerified: summaries.filter((user) => user.verification.phone).length,
        identityApproved: summaries.filter((user) => user.verification.identity === 'APPROVED').length,
        identityPending,
        blocked: members.filter((user) => user.status === UserStatus.BLOCKED).length,
        providers: members.filter((user) => providerIds.has(user._id.toString())).length,
        customers: members.filter((user) => !providerIds.has(user._id.toString())).length,
      },
      services: { total: count(services), active: count(services, 'ACTIVE') },
      products: { total: count(products), active: count(products, 'ACTIVE'), sold: count(products, 'SOLD') },
      bookings: {
        total: count(bookingStatus),
        pending: count(bookingStatus, 'pending'),
        confirmed: count(bookingStatus, 'confirmed'),
        completed: count(bookingStatus, 'completed'),
        cancelled: count(bookingStatus, 'cancelled'),
        today: bookingsToday,
      },
      orders: { total: count(orders), paid: count(orders, 'PAID') },
      feedPosts,
      openSupportTickets: openTickets,
      revenue: revenue.totals,
      monthly: months.map((month) => ({
        month,
        signups: signupsByMonth.get(month) ?? 0,
        revenue: revenue.monthly.find((row) => row.month === month)?.total ?? 0,
      })),
      recentUsers: summaries.slice(0, 8),
    };
  }

  /** Revenue from paid orders, paid subscription invoices and completed bookings. */
  private async revenueStreams(since: Date) {
    const monthlyGroup = (dateField: string, amountField: string) => [
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } }, total: { $sum: { $toDouble: { $ifNull: [`$${amountField}`, 0] } } } } },
    ];
    const totalGroup = (amountField: string) => [{ $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: [`$${amountField}`, 0] } } } } }];

    const paidOrders = { paymentStatus: 'PAID' };
    const paidInvoices = { status: 'PAID' };
    const completedBookings = { status: 'completed' };

    const [orderTotal, invoiceTotal, bookingTotal, orderMonthly, invoiceMonthly, bookingMonthly] = await Promise.all([
      this.col('orders').aggregate<{ total: number }>([{ $match: paidOrders }, ...totalGroup('amounts.total')]).toArray(),
      this.col('invoices').aggregate<{ total: number }>([{ $match: paidInvoices }, ...totalGroup('amount')]).toArray(),
      this.col('bookings').aggregate<{ total: number }>([{ $match: completedBookings }, ...totalGroup('amount')]).toArray(),
      this.col('orders').aggregate<{ _id: string; total: number }>([{ $match: { ...paidOrders, createdAt: { $gte: since } } }, ...monthlyGroup('createdAt', 'amounts.total')]).toArray(),
      this.col('invoices').aggregate<{ _id: string; total: number }>([{ $match: { ...paidInvoices, createdAt: { $gte: since } } }, ...monthlyGroup('createdAt', 'amount')]).toArray(),
      this.col('bookings').aggregate<{ _id: string; total: number }>([{ $match: { ...completedBookings, createdAt: { $gte: since } } }, ...monthlyGroup('createdAt', 'amount')]).toArray(),
    ]);

    const months = lastMonths();
    const pick = (rows: Array<{ _id: string; total: number }>, month: string) => rows.find((row) => row._id === month)?.total ?? 0;
    const orders = orderTotal[0]?.total ?? 0;
    const subscriptions = invoiceTotal[0]?.total ?? 0;
    const bookings = bookingTotal[0]?.total ?? 0;

    return {
      totals: { total: orders + subscriptions + bookings, orders, subscriptions, bookings },
      monthly: months.map((month) => {
        const row = { month, orders: pick(orderMonthly, month), subscriptions: pick(invoiceMonthly, month), bookings: pick(bookingMonthly, month) };
        return { ...row, total: row.orders + row.subscriptions + row.bookings };
      }),
    };
  }

  async earnings(authorization?: string) {
    await this.auth.requireAdmin(authorization);
    const since = new Date(`${lastMonths()[0]}-01T00:00:00.000Z`);
    const [streams, orders, invoices, bookings] = await Promise.all([
      this.revenueStreams(since),
      this.col('orders').find({}).sort({ createdAt: -1 }).limit(30).toArray(),
      this.col('invoices').find({}).sort({ createdAt: -1 }).limit(30).toArray(),
      this.col('bookings').find({}).sort({ createdAt: -1 }).limit(30).toArray(),
    ]);

    const userIds = [...orders.map((o) => o.buyerId), ...invoices.map((i) => i.userId), ...bookings.map((b) => b.customerId)].filter(Boolean);
    const users = await this.col('users').find({ _id: { $in: userIds } }, { projection: { firstName: 1, lastName: 1, email: 1 } }).toArray() as RawUser[];
    const nameOf = (id: unknown, fallback?: string) => {
      const user = users.find((u) => u._id.toString() === String(id));
      return user ? this.fullName(user) : fallback ?? '—';
    };

    const transactions = [
      ...orders.map((order) => ({
        id: order._id.toString(),
        type: 'ORDER' as const,
        reference: order.orderNumber,
        customer: nameOf(order.buyerId),
        amount: toNumber(order.amounts?.total),
        currency: order.currency ?? 'CHF',
        status: order.paymentStatus,
        date: order.createdAt,
      })),
      ...invoices.map((invoice) => ({
        id: invoice._id.toString(),
        type: 'SUBSCRIPTION' as const,
        reference: invoice.invoiceNumber,
        customer: nameOf(invoice.userId),
        amount: toNumber(invoice.amount),
        currency: invoice.currency ?? 'CHF',
        status: invoice.status,
        date: invoice.paidAt ?? invoice.createdAt,
      })),
      ...bookings.map((booking) => ({
        id: booking._id.toString(),
        type: 'BOOKING' as const,
        reference: booking.serviceTitle,
        customer: booking.customerName ?? nameOf(booking.customerId),
        amount: toNumber(booking.amount),
        currency: booking.currency ?? 'CHF',
        status: booking.status,
        date: booking.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);

    return { currency: 'CHF', totals: streams.totals, monthly: streams.monthly, transactions };
  }

  async people(authorization: string | undefined, type: PeopleType, search?: string, status?: string) {
    await this.auth.requireAdmin(authorization);
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (status && Object.values(UserStatus).includes(status as UserStatus)) filter.status = status;
    if (search?.trim()) {
      const pattern = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ firstName: pattern }, { lastName: pattern }, { email: pattern }, { phone: pattern }];
    }

    const [users, activity] = await Promise.all([
      this.col('users').find(filter, { projection: USER_FIELDS }).sort({ createdAt: -1 }).toArray() as Promise<RawUser[]>,
      this.activityByUser(),
    ]);

    const items = users
      .filter((user) => !this.auth.isAdminUser(user as unknown as UserDocument))
      .map((user) => {
        const stats = activity.get(user._id.toString()) ?? { services: 0, products: 0, bookings: 0, orders: 0, spent: 0 };
        return { ...this.summarize(user), stats, isProvider: stats.services > 0 || stats.products > 0 };
      })
      .filter((user) => (type === 'providers' ? user.isProvider : type === 'customers' ? !user.isProvider : true));

    return { items, total: items.length };
  }

  async person(authorization: string | undefined, id: string) {
    await this.auth.requireAdmin(authorization);
    const userId = new Types.ObjectId(id);
    const user = await this.col('users').findOne({ _id: userId }, { projection: USER_FIELDS }) as RawUser | null;
    if (!user) throw new NotFoundException('User not found.');

    const [services, products, bookings, orders, identity] = await Promise.all([
      this.col('services').find({ providerUserId: userId }).sort({ createdAt: -1 }).toArray(),
      this.col('products').find({ sellerUserId: userId, deletedAt: { $exists: false } }).sort({ createdAt: -1 }).toArray(),
      this.col('bookings').find({ $or: [{ customerId: userId }, { customerEmail: user.email }] }).sort({ createdAt: -1 }).limit(50).toArray(),
      this.col('orders').find({ buyerId: userId }).sort({ createdAt: -1 }).limit(50).toArray(),
      this.col('identityVerifications').find({ userId }).sort({ createdAt: -1 }).limit(1).toArray(),
    ]);

    return {
      ...this.summarize(user),
      bio: user.bio ?? '',
      services: services.map((service) => ({
        id: service._id.toString(),
        title: service.title,
        category: service.category,
        price: toNumber(service.price),
        currency: service.currency ?? 'CHF',
        status: service.status,
        image: service.images?.[0] ?? '',
        createdAt: service.createdAt,
      })),
      products: products.map((product) => ({
        id: product._id.toString(),
        title: product.title,
        category: product.category,
        price: toNumber(product.price),
        currency: product.currency ?? 'CHF',
        status: product.status,
        image: product.images?.[0]?.url ?? '',
        createdAt: product.createdAt,
      })),
      bookings: bookings.map((booking) => ({
        id: booking._id.toString(),
        serviceTitle: booking.serviceTitle,
        amount: toNumber(booking.amount),
        currency: booking.currency ?? 'CHF',
        status: booking.status,
        scheduledAt: booking.scheduledAt,
        createdAt: booking.createdAt,
      })),
      orders: orders.map((order) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        total: toNumber(order.amounts?.total),
        currency: order.currency ?? 'CHF',
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      })),
      identity: identity[0]
        ? { status: identity[0].status, documentType: identity[0].documentType, submittedAt: identity[0].createdAt, reviewedAt: identity[0].decidedAt }
        : null,
    };
  }

  async setStatus(authorization: string | undefined, id: string, status: string) {
    const admin = await this.auth.requireAdmin(authorization);
    if (!Object.values(UserStatus).includes(status as UserStatus)) {
      throw new BadRequestException('Status must be ACTIVE, PENDING, SUSPENDED, BLOCKED, or DELETED.');
    }
    const user = await this.col('users').findOne({ _id: new Types.ObjectId(id) }) as RawUser | null;
    if (!user) throw new NotFoundException('User not found.');
    if (user._id.equals(admin._id)) {
      throw new BadRequestException('You cannot change your own account status.');
    }
    await this.col('users').updateOne({ _id: user._id }, { $set: { status, updatedAt: new Date() } });
    return this.person(authorization, id);
  }

  async admins(authorization?: string) {
    await this.auth.requireAdmin(authorization);
    const users = await this.col('users').find({ deletedAt: { $exists: false } }, { projection: USER_FIELDS }).toArray() as RawUser[];
    return { items: users.filter((user) => this.auth.isAdminUser(user as unknown as UserDocument)).map((user) => this.summarize(user)) };
  }
}
