const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const w = (file, content) => {
  const p = path.join(root, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.trimStart().replace(/\r?\n/g, '\r\n'));
};

const schemaHeader = `import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
`;

w('package.json', `{
  "name": "emin-backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "seed": "ts-node -r tsconfig-paths/register src/infrastructure/database/seeds/seed.ts",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "@nestjs/common": "^11.1.6",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.1.6",
    "@nestjs/mongoose": "^11.0.3",
    "@nestjs/platform-express": "^11.1.6",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "mongoose": "^8.18.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.10",
    "@nestjs/testing": "^11.1.6",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.5.2",
    "jest": "^30.1.3",
    "ts-jest": "^29.4.4",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.9.2"
  }
}`);
w('tsconfig.json', `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strict": true,
    "strictPropertyInitialization": false,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}`);
w('nest-cli.json', `{"collection":"@nestjs/schematics","sourceRoot":"src"}`);
w('jest.config.js', `module.exports = { moduleFileExtensions: ['js', 'json', 'ts'], rootDir: '.', testRegex: '.*\\\\.spec\\\\.ts$', transform: { '^.+\\\\.(t|j)s$': 'ts-jest' }, testEnvironment: 'node' };`);
w('.env.example', `NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/emin
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=change-me
ADMIN_EMAIL=admin@odaboo.local
ADMIN_PASSWORD=ChangeMe123!`);

w('src/common/enums/domain.enums.ts', `export enum UserStatus { ACTIVE = 'ACTIVE', PENDING = 'PENDING', SUSPENDED = 'SUSPENDED', BLOCKED = 'BLOCKED', DELETED = 'DELETED' }
export enum VerificationStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED', SUSPENDED = 'SUSPENDED' }
export enum ReviewableStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum CategoryStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE' }
export enum AttributeType { TEXT = 'TEXT', NUMBER = 'NUMBER', SELECT = 'SELECT', MULTI_SELECT = 'MULTI_SELECT', BOOLEAN = 'BOOLEAN', DATE = 'DATE' }
export enum ProductCondition { NEW = 'NEW', LIKE_NEW = 'LIKE_NEW', USED = 'USED', REFURBISHED = 'REFURBISHED' }
export enum ListingType { BUY_NOW = 'BUY_NOW', AUCTION = 'AUCTION', AUCTION_AND_BUY_NOW = 'AUCTION_AND_BUY_NOW' }
export enum ProductStatus { DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', SOLD = 'SOLD', ARCHIVED = 'ARCHIVED' }
export enum ApprovalStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum AuctionStatus { DRAFT = 'DRAFT', SCHEDULED = 'SCHEDULED', ACTIVE = 'ACTIVE', ENDED = 'ENDED', SOLD = 'SOLD', UNSOLD = 'UNSOLD', CANCELLED = 'CANCELLED' }
export enum BidType { MANUAL = 'MANUAL', AUTO = 'AUTO', SYSTEM = 'SYSTEM' }
export enum BidStatus { VALID = 'VALID', OUTBID = 'OUTBID', CANCELLED = 'CANCELLED', INVALID = 'INVALID' }
export enum PaymentStatus { PENDING = 'PENDING', PROCESSING = 'PROCESSING', PAID = 'PAID', FAILED = 'FAILED', PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', REFUNDED = 'REFUNDED', CANCELLED = 'CANCELLED' }
export enum OrderStatus { PENDING = 'PENDING', CONFIRMED = 'CONFIRMED', PROCESSING = 'PROCESSING', SHIPPED = 'SHIPPED', DELIVERED = 'DELIVERED', CANCELLED = 'CANCELLED', REFUNDED = 'REFUNDED' }
export enum FulfillmentStatus { UNFULFILLED = 'UNFULFILLED', PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED', FULFILLED = 'FULFILLED' }
export enum PaymentTransactionType { AUTHORIZATION = 'AUTHORIZATION', CHARGE = 'CHARGE', CAPTURE = 'CAPTURE', REFUND = 'REFUND', FAILED = 'FAILED' }
export enum RefundStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', PROCESSING = 'PROCESSING', COMPLETED = 'COMPLETED', REJECTED = 'REJECTED', FAILED = 'FAILED' }
export enum ShipmentStatus { PENDING = 'PENDING', READY = 'READY', SHIPPED = 'SHIPPED', IN_TRANSIT = 'IN_TRANSIT', DELIVERED = 'DELIVERED', RETURNED = 'RETURNED', CANCELLED = 'CANCELLED' }
export enum WalletTransactionType { SALE = 'SALE', COMMISSION = 'COMMISSION', REFUND = 'REFUND', WITHDRAWAL = 'WITHDRAWAL', PAYMENT_FEE = 'PAYMENT_FEE', ADJUSTMENT = 'ADJUSTMENT' }
export enum LedgerDirection { CREDIT = 'CREDIT', DEBIT = 'DEBIT' }
export enum WithdrawalStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', PROCESSING = 'PROCESSING', PAID = 'PAID', REJECTED = 'REJECTED', FAILED = 'FAILED' }
export enum CommissionStatus { CALCULATED = 'CALCULATED', POSTED = 'POSTED', REVERSED = 'REVERSED' }
export enum ReviewStatus { PUBLISHED = 'PUBLISHED', HIDDEN = 'HIDDEN', REMOVED = 'REMOVED' }
export enum NotificationChannel { IN_APP = 'IN_APP', EMAIL = 'EMAIL', PUSH = 'PUSH', SMS = 'SMS' }
export enum TicketPriority { LOW = 'LOW', NORMAL = 'NORMAL', HIGH = 'HIGH', URGENT = 'URGENT' }
export enum TicketStatus { OPEN = 'OPEN', IN_PROGRESS = 'IN_PROGRESS', WAITING_FOR_CUSTOMER = 'WAITING_FOR_CUSTOMER', RESOLVED = 'RESOLVED', CLOSED = 'CLOSED' }
export enum DiscountType { PERCENTAGE = 'PERCENTAGE', FIXED = 'FIXED' }
export enum PageStatus { DRAFT = 'DRAFT', PUBLISHED = 'PUBLISHED' }`);
w('src/common/utils/money.util.ts', `import { Types } from 'mongoose';
export type Decimal128 = Types.Decimal128;
export const toDecimal128 = (value: string | number | Decimal128): Decimal128 => {
  if (value instanceof Types.Decimal128) return value;
  if (typeof value === 'number' && !Number.isInteger(value)) throw new Error('Use string input for non-integer money values.');
  return Types.Decimal128.fromString(String(value));
};
export const decimalToString = (value?: Decimal128 | null): string | undefined => value?.toString();`);
w('src/common/dto/money.dto.ts', `import { IsDecimal, IsNotEmpty, IsString, Matches } from 'class-validator';
export class MoneyDto {
  @IsString()
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,18' })
  @Matches(/^\\d+(\\.\\d+)?$/)
  amount: string;
}`);
w('src/infrastructure/database/database.module.ts', `import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ uri: config.getOrThrow<string>('MONGODB_URI') }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}`);
w('src/infrastructure/database/transaction.helper.ts', `import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';
@Injectable()
export class TransactionHelper {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  async withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await work(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}`);
w('src/infrastructure/redis/redis.module.ts', `import { Module } from '@nestjs/common';
@Module({})
export class RedisModule {}`);
w('src/infrastructure/queue/queue.module.ts', `import { Module } from '@nestjs/common';
@Module({})
export class QueueModule {}`);
w('src/infrastructure/storage/storage.module.ts', `import { Module } from '@nestjs/common';
@Module({})
export class StorageModule {}`);
w('src/infrastructure/websocket/websocket.module.ts', `import { Module } from '@nestjs/common';
@Module({})
export class WebsocketModule {}`);
w('src/common/repositories/base.repository.ts', `import { ClientSession, FilterQuery, Model, ProjectionType, QueryOptions, UpdateQuery } from 'mongoose';
export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}
  createOne(data: Partial<T>, session?: ClientSession) { return this.model.create([data], { session }).then((docs) => docs[0]); }
  findOne(filter: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>) { return this.model.findOne(filter, projection, options).exec(); }
  findMany(filter: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>) { return this.model.find(filter, projection, options).exec(); }
  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, session?: ClientSession) { return this.model.updateOne(filter, update, { session }).exec(); }
}`);

const refs = {
  User: 'User', Role: 'Role', SellerProfile: 'SellerProfile', Category: 'Category', Product: 'Product', Auction: 'Auction', Bid: 'Bid', AutoBid: 'AutoBid',
  Cart: 'Cart', Wishlist: 'Wishlist', Order: 'Order', Payment: 'Payment', Refund: 'Refund', Shipment: 'Shipment', Wallet: 'Wallet',
  WalletTransaction: 'WalletTransaction', Withdrawal: 'Withdrawal', Commission: 'Commission', Review: 'Review', Conversation: 'Conversation',
  Message: 'Message', Notification: 'Notification', SupportTicket: 'SupportTicket', Coupon: 'Coupon', Banner: 'Banner', Page: 'Page', AuditLog: 'AuditLog', Setting: 'Setting'
};

function oid(ref, extra = '') { return `{ type: MongooseSchema.Types.ObjectId, ref: '${ref}'${extra} }`; }
const dec = `{ type: MongooseSchema.Types.Decimal128, required: true, min: 0 }`;

const schemas = [
['users','user',`${schemaHeader}import { Exclude } from 'class-transformer';\nimport { UserStatus } from '../../../common/enums/domain.enums';\nexport type UserDocument = HydratedDocument<User>;\n@Schema({ _id: true, versionKey: false })\nexport class Address { @Prop() label?: string; @Prop({ required: true }) fullName: string; @Prop({ required: true }) phone: string; @Prop({ required: true }) addressLine1: string; @Prop() addressLine2?: string; @Prop({ required: true }) city: string; @Prop() state?: string; @Prop({ required: true }) postalCode: string; @Prop({ required: true }) country: string; @Prop() latitude?: number; @Prop() longitude?: number; @Prop({ default: false }) isDefault: boolean; }\nexport const AddressSchema = SchemaFactory.createForClass(Address);\n@Schema({ timestamps: true, versionKey: false, collection: 'users', toJSON: { transform: (_d, r) => { delete r.passwordHash; return r; } } })\nexport class User { @Prop({ required: true, trim: true }) firstName: string; @Prop({ required: true, trim: true }) lastName: string; @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string; @Prop({ sparse: true, trim: true }) phone?: string; @Exclude() @Prop({ required: true, select: false }) passwordHash: string; @Prop() avatar?: string; @Prop() dateOfBirth?: Date; @Prop({ type: [${oid('Role')}], default: [] }) roles: Types.ObjectId[]; @Prop({ type: [AddressSchema], default: [] }) addresses: Address[]; @Prop({ enum: UserStatus, default: UserStatus.PENDING, index: true }) status: UserStatus; @Prop() emailVerifiedAt?: Date; @Prop() phoneVerifiedAt?: Date; @Prop() lastLoginAt?: Date; @Prop() deletedAt?: Date; }\nexport const UserSchema = SchemaFactory.createForClass(User);\nUserSchema.index({ email: 1 }, { unique: true }); UserSchema.index({ phone: 1 }, { sparse: true }); UserSchema.index({ createdAt: 1 });`],
['roles','role',`${schemaHeader}export type RoleDocument = HydratedDocument<Role>;\n@Schema({ timestamps: true, versionKey: false, collection: 'roles' })\nexport class Role { @Prop({ required: true }) name: string; @Prop({ required: true, unique: true }) slug: string; @Prop({ type: [String], default: [] }) permissions: string[]; }\nexport const RoleSchema = SchemaFactory.createForClass(Role);`],
['sellers','seller-profile',`${schemaHeader}import { ReviewableStatus, VerificationStatus } from '../../../common/enums/domain.enums';\nexport type SellerProfileDocument = HydratedDocument<SellerProfile>;\n@Schema({ _id: true, versionKey: false }) export class SellerDocument { @Prop({ required: true }) type: string; @Prop({ required: true }) fileUrl: string; @Prop({ enum: ReviewableStatus, default: ReviewableStatus.PENDING }) status: ReviewableStatus; @Prop() rejectionReason?: string; @Prop(${oid('User')}) reviewedBy?: Types.ObjectId; @Prop() reviewedAt?: Date; }\nconst SellerDocumentSchema = SchemaFactory.createForClass(SellerDocument);\n@Schema({ _id: false, versionKey: false }) class SellerRating { @Prop({ default: 0, min: 0, max: 5 }) average: number; @Prop({ default: 0, min: 0 }) total: number; }\nconst SellerRatingSchema = SchemaFactory.createForClass(SellerRating);\n@Schema({ timestamps: true, versionKey: false, collection: 'sellerProfiles' }) export class SellerProfile { @Prop(${oid('User', ', required: true, unique: true')}) userId: Types.ObjectId; @Prop({ required: true }) displayName: string; @Prop() businessName?: string; @Prop() businessType?: string; @Prop() registrationNumber?: string; @Prop() taxNumber?: string; @Prop() description?: string; @Prop({ enum: VerificationStatus, default: VerificationStatus.PENDING, index: true }) verificationStatus: VerificationStatus; @Prop({ type: [SellerDocumentSchema], default: [] }) documents: SellerDocument[]; @Prop({ type: SellerRatingSchema, default: () => ({ average: 0, total: 0 }) }) rating: SellerRating; @Prop({ default: 0, min: 0 }) totalSales: number; @Prop() verifiedAt?: Date; @Prop() deletedAt?: Date; }\nexport const SellerProfileSchema = SchemaFactory.createForClass(SellerProfile); SellerProfileSchema.index({ createdAt: 1 });`],
['categories','category',`${schemaHeader}import { AttributeType, CategoryStatus } from '../../../common/enums/domain.enums';\nexport type CategoryDocument = HydratedDocument<Category>;\n@Schema({ _id: true, versionKey: false }) export class CategoryAttribute { @Prop({ required: true }) name: string; @Prop({ enum: AttributeType, required: true }) type: AttributeType; @Prop({ default: false }) required: boolean; @Prop({ default: false }) filterable: boolean; @Prop({ type: [String], default: undefined }) options?: string[]; @Prop({ default: 0 }) sortOrder: number; }\nconst CategoryAttributeSchema = SchemaFactory.createForClass(CategoryAttribute);\n@Schema({ timestamps: true, versionKey: false, collection: 'categories' }) export class Category { @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', default: null, index: true }) parentId?: Types.ObjectId | null; @Prop({ required: true }) name: string; @Prop({ required: true, unique: true }) slug: string; @Prop() description?: string; @Prop() image?: string; @Prop() icon?: string; @Prop({ type: [CategoryAttributeSchema], default: [] }) attributes: CategoryAttribute[]; @Prop({ enum: CategoryStatus, default: CategoryStatus.ACTIVE, index: true }) status: CategoryStatus; @Prop({ default: 0, index: true }) sortOrder: number; }\nexport const CategorySchema = SchemaFactory.createForClass(Category);`],
['products','product',`${schemaHeader}import { ApprovalStatus, ListingType, ProductCondition, ProductStatus } from '../../../common/enums/domain.enums';\nexport type ProductDocument = HydratedDocument<Product>;\n@Schema({ _id: true, versionKey: false }) class ProductImage { @Prop({ required: true }) url: string; @Prop() thumbnailUrl?: string; @Prop({ default: false }) isPrimary: boolean; @Prop({ default: 0 }) sortOrder: number; }\nconst ProductImageSchema = SchemaFactory.createForClass(ProductImage);\n@Schema({ _id: false, versionKey: false }) class ProductAttributeValue { @Prop({ type: MongooseSchema.Types.ObjectId, required: true }) attributeId: Types.ObjectId; @Prop({ required: true }) name: string; @Prop({ type: MongooseSchema.Types.Mixed, required: true }) value: string | number | boolean | string[]; }\nconst ProductAttributeValueSchema = SchemaFactory.createForClass(ProductAttributeValue);\n@Schema({ timestamps: true, versionKey: false, collection: 'products' }) export class Product { @Prop(${oid('SellerProfile', ', required: true, index: true')}) sellerId: Types.ObjectId; @Prop(${oid('Category', ', required: true, index: true')}) categoryId: Types.ObjectId; @Prop({ required: true }) title: string; @Prop({ required: true, unique: true }) slug: string; @Prop({ required: true }) description: string; @Prop({ enum: ProductCondition, required: true }) condition: ProductCondition; @Prop({ enum: ListingType, required: true, index: true }) listingType: ListingType; @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) price?: Types.Decimal128; @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) buyNowPrice?: Types.Decimal128; @Prop({ required: true, default: 'USD' }) currency: string; @Prop({ required: true, min: 0, default: 0 }) quantity: number; @Prop() sku?: string; @Prop({ type: [ProductImageSchema], default: [] }) images: ProductImage[]; @Prop({ type: [ProductAttributeValueSchema], default: [] }) attributes: ProductAttributeValue[]; @Prop({ enum: ProductStatus, default: ProductStatus.DRAFT, index: true }) status: ProductStatus; @Prop({ enum: ApprovalStatus, default: ApprovalStatus.PENDING, index: true }) approvalStatus: ApprovalStatus; @Prop() publishedAt?: Date; @Prop() deletedAt?: Date; }\nexport const ProductSchema = SchemaFactory.createForClass(Product); ProductSchema.index({ title: 'text', description: 'text' }); ProductSchema.index({ createdAt: 1 });`],
['auctions','auction',`${schemaHeader}import { AuctionStatus } from '../../../common/enums/domain.enums';\nexport type AuctionDocument = HydratedDocument<Auction>;\n@Schema({ timestamps: true, versionKey: false, collection: 'auctions' }) export class Auction { @Prop(${oid('Product', ', required: true, unique: true')}) productId: Types.ObjectId; @Prop(${oid('SellerProfile', ', required: true, index: true')}) sellerId: Types.ObjectId; @Prop(${dec}) startPrice: Types.Decimal128; @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) reservePrice?: Types.Decimal128; @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) buyNowPrice?: Types.Decimal128; @Prop(${dec}) currentPrice: Types.Decimal128; @Prop(${dec}) minimumIncrement: Types.Decimal128; @Prop({ required: true, index: true }) startAt: Date; @Prop({ required: true }) endAt: Date; @Prop({ enum: AuctionStatus, default: AuctionStatus.DRAFT }) status: AuctionStatus; @Prop(${oid('Bid')}) winningBidId?: Types.ObjectId; @Prop(${oid('User', ', index: true')}) winningUserId?: Types.ObjectId; @Prop({ default: 0, min: 0 }) totalBids: number; @Prop({ default: true }) autoExtendEnabled: boolean; }\nexport const AuctionSchema = SchemaFactory.createForClass(Auction); AuctionSchema.index({ status: 1, endAt: 1 });`],
['bids','bid',`${schemaHeader}import { BidStatus, BidType } from '../../../common/enums/domain.enums';\nexport type BidDocument = HydratedDocument<Bid>;\n@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'bids' }) export class Bid { @Prop(${oid('Auction', ', required: true')}) auctionId: Types.ObjectId; @Prop(${oid('User', ', required: true')}) bidderId: Types.ObjectId; @Prop(${dec}) amount: Types.Decimal128; @Prop({ enum: BidType, required: true }) type: BidType; @Prop({ enum: BidStatus, default: BidStatus.VALID }) status: BidStatus; }\nexport const BidSchema = SchemaFactory.createForClass(Bid); BidSchema.index({ auctionId: 1, amount: -1 }); BidSchema.index({ auctionId: 1, createdAt: -1 }); BidSchema.index({ bidderId: 1, createdAt: -1 });`],
['bids','auto-bid',`${schemaHeader}export type AutoBidDocument = HydratedDocument<AutoBid>;\n@Schema({ timestamps: true, versionKey: false, collection: 'autoBids' }) export class AutoBid { @Prop(${oid('Auction', ', required: true')}) auctionId: Types.ObjectId; @Prop(${oid('User', ', required: true')}) userId: Types.ObjectId; @Prop(${dec}) maxAmount: Types.Decimal128; @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) currentAmount?: Types.Decimal128; @Prop({ default: true }) active: boolean; }\nexport const AutoBidSchema = SchemaFactory.createForClass(AutoBid); AutoBidSchema.index({ auctionId: 1, userId: 1 }, { unique: true });`],
];

const simpleSchemas = [
['carts','cart',`@Schema({ _id: true, versionKey: false }) class CartItem { @Prop(${oid('Product', ', required: true')}) productId: Types.ObjectId; @Prop({ required: true, min: 1 }) quantity: number; @Prop({ default: Date.now }) addedAt: Date; }\nconst CartItemSchema = SchemaFactory.createForClass(CartItem);\n@Schema({ timestamps: true, versionKey: false, collection: 'carts' }) export class Cart { @Prop(${oid('User', ', required: true, unique: true')}) userId: Types.ObjectId; @Prop({ type: [CartItemSchema], default: [] }) items: CartItem[]; }\nexport type CartDocument = HydratedDocument<Cart>; export const CartSchema = SchemaFactory.createForClass(Cart); CartSchema.index({ userId: 1, 'items.productId': 1 }, { unique: true, partialFilterExpression: { 'items.productId': { $exists: true } } });`],
['wishlists','wishlist',`@Schema({ _id: true, versionKey: false }) class WishlistItem { @Prop(${oid('Product', ', required: true')}) productId: Types.ObjectId; @Prop({ default: Date.now }) addedAt: Date; }\nconst WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);\n@Schema({ timestamps: true, versionKey: false, collection: 'wishlists' }) export class Wishlist { @Prop(${oid('User', ', required: true, unique: true')}) userId: Types.ObjectId; @Prop({ type: [WishlistItemSchema], default: [] }) items: WishlistItem[]; }\nexport type WishlistDocument = HydratedDocument<Wishlist>; export const WishlistSchema = SchemaFactory.createForClass(Wishlist);`],
['orders','order',`import { FulfillmentStatus, OrderStatus, PaymentStatus } from '../../../common/enums/domain.enums';\n@Schema({ _id: false, versionKey: false }) class AddressSnapshot { @Prop({ required: true }) fullName: string; @Prop({ required: true }) phone: string; @Prop({ required: true }) addressLine1: string; @Prop() addressLine2?: string; @Prop({ required: true }) city: string; @Prop() state?: string; @Prop({ required: true }) postalCode: string; @Prop({ required: true }) country: string; }\nconst AddressSnapshotSchema = SchemaFactory.createForClass(AddressSnapshot);\n@Schema({ _id: false, versionKey: false }) class OrderAmounts { @Prop(${dec}) subtotal: Types.Decimal128; @Prop(${dec}) shipping: Types.Decimal128; @Prop(${dec}) tax: Types.Decimal128; @Prop(${dec}) discount: Types.Decimal128; @Prop(${dec}) total: Types.Decimal128; }\nconst OrderAmountsSchema = SchemaFactory.createForClass(OrderAmounts);\n@Schema({ _id: true, versionKey: false }) class OrderItem { @Prop(${oid('Product', ', required: true')}) productId: Types.ObjectId; @Prop(${oid('SellerProfile', ', required: true')}) sellerId: Types.ObjectId; @Prop(${oid('Auction')}) auctionId?: Types.ObjectId; @Prop({ type: MongooseSchema.Types.Mixed, required: true }) productSnapshot: Record<string, unknown>; @Prop({ required: true, min: 1 }) quantity: number; @Prop(${dec}) unitPrice: Types.Decimal128; @Prop(${dec}) subtotal: Types.Decimal128; @Prop(${dec}) commissionAmount: Types.Decimal128; @Prop(${dec}) sellerNetAmount: Types.Decimal128; }\nconst OrderItemSchema = SchemaFactory.createForClass(OrderItem);\n@Schema({ _id: false, versionKey: false }) class OrderStatusHistory { @Prop({ required: true }) status: string; @Prop(${oid('User')}) changedBy?: Types.ObjectId; @Prop() note?: string; @Prop({ default: Date.now }) timestamp: Date; }\nconst OrderStatusHistorySchema = SchemaFactory.createForClass(OrderStatusHistory);\n@Schema({ timestamps: true, versionKey: false, collection: 'orders' }) export class Order { @Prop({ required: true, unique: true }) orderNumber: string; @Prop(${oid('User', ', required: true')}) buyerId: Types.ObjectId; @Prop({ type: [OrderItemSchema], default: [] }) items: OrderItem[]; @Prop({ type: AddressSnapshotSchema, required: true }) shippingAddress: AddressSnapshot; @Prop({ type: AddressSnapshotSchema }) billingAddress?: AddressSnapshot; @Prop({ type: OrderAmountsSchema, required: true }) amounts: OrderAmounts; @Prop({ required: true }) currency: string; @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING }) paymentStatus: PaymentStatus; @Prop({ enum: OrderStatus, default: OrderStatus.PENDING }) orderStatus: OrderStatus; @Prop({ enum: FulfillmentStatus, default: FulfillmentStatus.UNFULFILLED }) fulfillmentStatus: FulfillmentStatus; @Prop({ type: [OrderStatusHistorySchema], default: [] }) statusHistory: OrderStatusHistory[]; }\nexport type OrderDocument = HydratedDocument<Order>; export const OrderSchema = SchemaFactory.createForClass(Order); OrderSchema.index({ buyerId: 1, createdAt: -1 }); OrderSchema.index({ paymentStatus: 1 }); OrderSchema.index({ orderStatus: 1 }); OrderSchema.index({ createdAt: 1 }); OrderSchema.index({ 'items.sellerId': 1, createdAt: -1 });`],
['payments','payment',`import { PaymentStatus, PaymentTransactionType } from '../../../common/enums/domain.enums';\n@Schema({ _id: true, versionKey: false }) class PaymentTransaction { @Prop({ enum: PaymentTransactionType, required: true }) type: PaymentTransactionType; @Prop() providerReference?: string; @Prop(${dec}) amount: Types.Decimal128; @Prop({ required: true }) status: string; @Prop({ default: Date.now }) createdAt: Date; }\nconst PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);\n@Schema({ timestamps: true, versionKey: false, collection: 'payments' }) export class Payment { @Prop(${oid('Order', ', required: true, index: true')}) orderId: Types.ObjectId; @Prop(${oid('User', ', required: true, index: true')}) userId: Types.ObjectId; @Prop({ required: true }) provider: string; @Prop({ sparse: true, unique: true }) providerPaymentId?: string; @Prop(${dec}) amount: Types.Decimal128; @Prop({ required: true }) currency: string; @Prop() paymentMethod?: string; @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING, index: true }) status: PaymentStatus; @Prop({ type: [PaymentTransactionSchema], default: [] }) transactions: PaymentTransaction[]; @Prop() paidAt?: Date; }\nexport type PaymentDocument = HydratedDocument<Payment>; export const PaymentSchema = SchemaFactory.createForClass(Payment); PaymentSchema.index({ createdAt: 1 });`],
['refunds','refund',`import { RefundStatus } from '../../../common/enums/domain.enums';\n@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'refunds' }) export class Refund { @Prop(${oid('Order', ', required: true')}) orderId: Types.ObjectId; @Prop(${oid('Payment', ', required: true')}) paymentId: Types.ObjectId; @Prop(${oid('User', ', required: true')}) requestedBy: Types.ObjectId; @Prop(${dec}) amount: Types.Decimal128; @Prop({ required: true }) reason: string; @Prop({ enum: RefundStatus, default: RefundStatus.PENDING }) status: RefundStatus; @Prop() providerRefundId?: string; @Prop(${oid('User')}) reviewedBy?: Types.ObjectId; @Prop() processedAt?: Date; }\nexport type RefundDocument = HydratedDocument<Refund>; export const RefundSchema = SchemaFactory.createForClass(Refund);`],
['shipments','shipment',`import { ShipmentStatus } from '../../../common/enums/domain.enums';\n@Schema({ timestamps: true, versionKey: false, collection: 'shipments' }) export class Shipment { @Prop(${oid('Order', ', required: true')}) orderId: Types.ObjectId; @Prop(${oid('SellerProfile', ', required: true')}) sellerId: Types.ObjectId; @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] }) itemIds: Types.ObjectId[]; @Prop() carrier?: string; @Prop() service?: string; @Prop() trackingNumber?: string; @Prop() trackingUrl?: string; @Prop({ enum: ShipmentStatus, default: ShipmentStatus.PENDING }) status: ShipmentStatus; @Prop() shippedAt?: Date; @Prop() deliveredAt?: Date; }\nexport type ShipmentDocument = HydratedDocument<Shipment>; export const ShipmentSchema = SchemaFactory.createForClass(Shipment); ShipmentSchema.index({ orderId: 1 }); ShipmentSchema.index({ sellerId: 1 });`],
['wallets','wallet',`@Schema({ timestamps: true, versionKey: false, collection: 'wallets' }) export class Wallet { @Prop(${oid('SellerProfile', ', required: true, unique: true')}) sellerId: Types.ObjectId; @Prop({ required: true }) currency: string; @Prop(${dec}) availableBalance: Types.Decimal128; @Prop(${dec}) pendingBalance: Types.Decimal128; }\nexport type WalletDocument = HydratedDocument<Wallet>; export const WalletSchema = SchemaFactory.createForClass(Wallet);`],
['wallets','wallet-transaction',`import { LedgerDirection, WalletTransactionType } from '../../../common/enums/domain.enums';\n@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'walletTransactions' }) export class WalletTransaction { @Prop(${oid('Wallet', ', required: true')}) walletId: Types.ObjectId; @Prop(${oid('SellerProfile', ', required: true')}) sellerId: Types.ObjectId; @Prop({ enum: WalletTransactionType, required: true }) type: WalletTransactionType; @Prop({ required: true }) referenceType: string; @Prop({ type: MongooseSchema.Types.ObjectId }) referenceId?: Types.ObjectId; @Prop(${dec}) amount: Types.Decimal128; @Prop({ enum: LedgerDirection, required: true }) direction: LedgerDirection; @Prop(${dec}) balanceBefore: Types.Decimal128; @Prop(${dec}) balanceAfter: Types.Decimal128; @Prop() description?: string; }\nexport type WalletTransactionDocument = HydratedDocument<WalletTransaction>; export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction); WalletTransactionSchema.index({ walletId: 1, createdAt: -1 }); WalletTransactionSchema.index({ sellerId: 1, createdAt: -1 }); WalletTransactionSchema.index({ referenceType: 1, referenceId: 1 });`],
['withdrawals','withdrawal',`import { WithdrawalStatus } from '../../../common/enums/domain.enums';\n@Schema({ versionKey: false, collection: 'withdrawals' }) export class Withdrawal { @Prop(${oid('SellerProfile', ', required: true')}) sellerId: Types.ObjectId; @Prop(${oid('Wallet', ', required: true')}) walletId: Types.ObjectId; @Prop(${dec}) amount: Types.Decimal128; @Prop({ required: true }) currency: string; @Prop({ required: true }) payoutMethod: string; @Prop({ type: MongooseSchema.Types.Mixed, required: true, select: false }) payoutDetails: Record<string, unknown>; @Prop({ enum: WithdrawalStatus, default: WithdrawalStatus.PENDING }) status: WithdrawalStatus; @Prop(${oid('User')}) approvedBy?: Types.ObjectId; @Prop({ default: Date.now }) requestedAt: Date; @Prop() processedAt?: Date; @Prop() rejectionReason?: string; }\nexport type WithdrawalDocument = HydratedDocument<Withdrawal>; export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);`],
['commissions','commission',`import { CommissionStatus } from '../../../common/enums/domain.enums';\n@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'commissions' }) export class Commission { @Prop(${oid('Order', ', required: true')}) orderId: Types.ObjectId; @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true }) orderItemId: Types.ObjectId; @Prop(${oid('SellerProfile', ', required: true')}) sellerId: Types.ObjectId; @Prop(${dec}) grossAmount: Types.Decimal128; @Prop(${dec}) commissionRate: Types.Decimal128; @Prop(${dec}) commissionAmount: Types.Decimal128; @Prop(${dec}) sellerNetAmount: Types.Decimal128; @Prop({ enum: CommissionStatus, default: CommissionStatus.CALCULATED }) status: CommissionStatus; }\nexport type CommissionDocument = HydratedDocument<Commission>; export const CommissionSchema = SchemaFactory.createForClass(Commission);`],
['reviews','review',`import { ReviewStatus } from '../../../common/enums/domain.enums';\n@Schema({ timestamps: true, versionKey: false, collection: 'reviews' }) export class Review { @Prop(${oid('Order', ', required: true')}) orderId: Types.ObjectId; @Prop(${oid('Product', ', required: true')}) productId: Types.ObjectId; @Prop(${oid('SellerProfile', ', required: true')}) sellerId: Types.ObjectId; @Prop(${oid('User', ', required: true')}) reviewerId: Types.ObjectId; @Prop({ required: true, min: 1, max: 5 }) rating: number; @Prop() title?: string; @Prop() comment?: string; @Prop({ enum: ReviewStatus, default: ReviewStatus.PUBLISHED }) status: ReviewStatus; }\nexport type ReviewDocument = HydratedDocument<Review>; export const ReviewSchema = SchemaFactory.createForClass(Review); ReviewSchema.index({ orderId: 1, productId: 1, reviewerId: 1 }, { unique: true });`],
['conversations','conversation',`@Schema({ _id: false, versionKey: false }) class LastMessage { @Prop() text?: string; @Prop(${oid('User', ', required: true')}) senderId: Types.ObjectId; @Prop({ required: true }) createdAt: Date; } const LastMessageSchema = SchemaFactory.createForClass(LastMessage);\n@Schema({ timestamps: true, versionKey: false, collection: 'conversations' }) export class Conversation { @Prop({ type: [${oid('User')}], default: [] }) participants: Types.ObjectId[]; @Prop(${oid('Product')}) productId?: Types.ObjectId; @Prop(${oid('Order')}) orderId?: Types.ObjectId; @Prop({ type: LastMessageSchema }) lastMessage?: LastMessage; }\nexport type ConversationDocument = HydratedDocument<Conversation>; export const ConversationSchema = SchemaFactory.createForClass(Conversation); ConversationSchema.index({ participants: 1 });`],
['conversations','message',`@Schema({ _id: false, versionKey: false }) class Attachment { @Prop({ required: true }) url: string; @Prop({ required: true }) type: string; @Prop() name?: string; } const AttachmentSchema = SchemaFactory.createForClass(Attachment);\n@Schema({ _id: false, versionKey: false }) class ReadReceipt { @Prop(${oid('User', ', required: true')}) userId: Types.ObjectId; @Prop({ required: true }) readAt: Date; } const ReadReceiptSchema = SchemaFactory.createForClass(ReadReceipt);\n@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'messages' }) export class Message { @Prop(${oid('Conversation', ', required: true')}) conversationId: Types.ObjectId; @Prop(${oid('User', ', required: true')}) senderId: Types.ObjectId; @Prop() text?: string; @Prop({ type: [AttachmentSchema], default: [] }) attachments: Attachment[]; @Prop({ type: [ReadReceiptSchema], default: [] }) readBy: ReadReceipt[]; }\nexport type MessageDocument = HydratedDocument<Message>; export const MessageSchema = SchemaFactory.createForClass(Message); MessageSchema.index({ conversationId: 1, createdAt: -1 }); MessageSchema.index({ senderId: 1 });`],
['notifications','notification',`import { NotificationChannel } from '../../../common/enums/domain.enums';\n@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'notifications' }) export class Notification { @Prop(${oid('User', ', required: true')}) userId: Types.ObjectId; @Prop({ required: true }) type: string; @Prop({ required: true }) title: string; @Prop({ required: true }) body: string; @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) data: Record<string, unknown>; @Prop({ enum: NotificationChannel, required: true }) channel: NotificationChannel; @Prop() readAt?: Date; }\nexport type NotificationDocument = HydratedDocument<Notification>; export const NotificationSchema = SchemaFactory.createForClass(Notification); NotificationSchema.index({ userId: 1, createdAt: -1 }); NotificationSchema.index({ userId: 1, readAt: 1 });`],
['support','support-ticket',`import { TicketPriority, TicketStatus } from '../../../common/enums/domain.enums';\n@Schema({ _id: false, versionKey: false }) class SupportAttachment { @Prop({ required: true }) url: string; @Prop() type?: string; } const SupportAttachmentSchema = SchemaFactory.createForClass(SupportAttachment);\n@Schema({ _id: true, versionKey: false }) class SupportMessage { @Prop(${oid('User', ', required: true')}) senderId: Types.ObjectId; @Prop({ required: true }) message: string; @Prop({ type: [SupportAttachmentSchema], default: [] }) attachments: SupportAttachment[]; @Prop({ default: Date.now }) createdAt: Date; } const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage);\n@Schema({ timestamps: true, versionKey: false, collection: 'supportTickets' }) export class SupportTicket { @Prop({ required: true, unique: true }) ticketNumber: string; @Prop(${oid('User', ', required: true')}) userId: Types.ObjectId; @Prop(${oid('Order')}) orderId?: Types.ObjectId; @Prop(${oid('User')}) assignedAdminId?: Types.ObjectId; @Prop({ required: true }) subject: string; @Prop({ required: true }) category: string; @Prop({ enum: TicketPriority, default: TicketPriority.NORMAL }) priority: TicketPriority; @Prop({ enum: TicketStatus, default: TicketStatus.OPEN }) status: TicketStatus; @Prop({ type: [SupportMessageSchema], default: [] }) messages: SupportMessage[]; }\nexport type SupportTicketDocument = HydratedDocument<SupportTicket>; export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);`],
['coupons','coupon',`import { DiscountType } from '../../../common/enums/domain.enums';\n@Schema({ timestamps: true, versionKey: false, collection: 'coupons' }) export class Coupon { @Prop({ required: true, unique: true, uppercase: true }) code: string; @Prop({ enum: DiscountType, required: true }) discountType: DiscountType; @Prop(${dec}) discountValue: Types.Decimal128; @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) minimumOrderAmount?: Types.Decimal128; @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) maximumDiscountAmount?: Types.Decimal128; @Prop({ min: 0 }) usageLimit?: number; @Prop({ min: 0 }) usagePerUser?: number; @Prop() startsAt?: Date; @Prop() expiresAt?: Date; @Prop({ default: true }) active: boolean; }\nexport type CouponDocument = HydratedDocument<Coupon>; export const CouponSchema = SchemaFactory.createForClass(Coupon);`],
['cms','banner',`@Schema({ timestamps: true, versionKey: false, collection: 'banners' }) export class Banner { @Prop() title?: string; @Prop({ required: true }) desktopImageUrl: string; @Prop() mobileImageUrl?: string; @Prop() targetUrl?: string; @Prop({ required: true }) placement: string; @Prop({ default: 0 }) sortOrder: number; @Prop() startsAt?: Date; @Prop() endsAt?: Date; @Prop({ default: true }) active: boolean; }\nexport type BannerDocument = HydratedDocument<Banner>; export const BannerSchema = SchemaFactory.createForClass(Banner); BannerSchema.index({ placement: 1, active: 1, sortOrder: 1 });`],
['cms','page',`import { PageStatus } from '../../../common/enums/domain.enums';\n@Schema({ timestamps: true, versionKey: false, collection: 'pages' }) export class Page { @Prop({ required: true }) title: string; @Prop({ required: true, unique: true }) slug: string; @Prop({ type: MongooseSchema.Types.Mixed, required: true }) content: Record<string, unknown>; @Prop() seoTitle?: string; @Prop() seoDescription?: string; @Prop({ enum: PageStatus, default: PageStatus.DRAFT }) status: PageStatus; }\nexport type PageDocument = HydratedDocument<Page>; export const PageSchema = SchemaFactory.createForClass(Page);`],
['audit','audit-log',`@Schema({ timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: 'auditLogs' }) export class AuditLog { @Prop(${oid('User')}) actorId?: Types.ObjectId; @Prop({ required: true }) action: string; @Prop({ required: true }) entityType: string; @Prop({ type: MongooseSchema.Types.ObjectId }) entityId?: Types.ObjectId; @Prop({ type: MongooseSchema.Types.Mixed }) before?: Record<string, unknown>; @Prop({ type: MongooseSchema.Types.Mixed }) after?: Record<string, unknown>; @Prop() ipAddress?: string; @Prop() userAgent?: string; }\nexport type AuditLogDocument = HydratedDocument<AuditLog>; export const AuditLogSchema = SchemaFactory.createForClass(AuditLog); AuditLogSchema.index({ actorId: 1, createdAt: -1 }); AuditLogSchema.index({ entityType: 1, entityId: 1 });`],
['settings','setting',`@Schema({ timestamps: true, versionKey: false, collection: 'settings' }) export class Setting { @Prop({ required: true, unique: true }) key: string; @Prop({ type: MongooseSchema.Types.Mixed, required: true }) value: unknown; @Prop() description?: string; @Prop(${oid('User')}) updatedBy?: Types.ObjectId; }\nexport type SettingDocument = HydratedDocument<Setting>; export const SettingSchema = SchemaFactory.createForClass(Setting);`],
];

for (const [mod, name, content] of schemas) w(`src/modules/${mod}/schemas/${name}.schema.ts`, content);
for (const [mod, name, content] of simpleSchemas) w(`src/modules/${mod}/schemas/${name}.schema.ts`, `${schemaHeader}${content}`);

const modules = {
  users:['User'], roles:['Role'], sellers:['SellerProfile'], categories:['Category'], products:['Product'], auctions:['Auction'], bids:['Bid','AutoBid'], carts:['Cart'], wishlists:['Wishlist'], orders:['Order'], payments:['Payment'], refunds:['Refund'], shipments:['Shipment'], wallets:['Wallet','WalletTransaction'], withdrawals:['Withdrawal'], commissions:['Commission'], reviews:['Review'], conversations:['Conversation','Message'], notifications:['Notification'], support:['SupportTicket'], coupons:['Coupon'], cms:['Banner','Page'], audit:['AuditLog'], settings:['Setting'], auth:[]
};
for (const [mod, classes] of Object.entries(modules)) {
  for (const d of ['dto','enums','repositories','services','controllers']) w(`src/modules/${mod}/${d}/.gitkeep`, '');
  const imports = classes.map(c => {
    const file = c.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return `import { ${c}, ${c}Schema } from './schemas/${file}.schema';`;
  }).join('\n');
  const feature = classes.length ? `MongooseModule.forFeature([${classes.map(c => `{ name: ${c}.name, schema: ${c}Schema }`).join(', ')}])` : '';
  w(`src/modules/${mod}/${mod}.module.ts`, `import { Module } from '@nestjs/common';\n${classes.length ? "import { MongooseModule } from '@nestjs/mongoose';\n" + imports : ''}\n@Module({ imports: [${feature}], exports: [${classes.length ? 'MongooseModule' : ''}] })\nexport class ${mod.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('')}Module {}`);
}

w('src/modules/products/dto/create-product.dto.ts', `import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ListingType, ProductCondition } from '../../../common/enums/domain.enums';
export class CreateProductDto {
  @IsMongoId() sellerId: string;
  @IsMongoId() categoryId: string;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() slug: string;
  @IsString() @IsNotEmpty() description: string;
  @IsEnum(ProductCondition) condition: ProductCondition;
  @IsEnum(ListingType) listingType: ListingType;
  @IsOptional() @IsString() price?: string;
  @IsString() currency: string;
  @Min(0) quantity: number;
  @IsArray() images: unknown[];
}`);
w('src/modules/products/dto/update-product.dto.ts', `import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
export class UpdateProductDto extends PartialType(CreateProductDto) {}`);
w('src/modules/auctions/dto/place-bid.dto.ts', `import { IsMongoId, IsNotEmpty, IsString, Matches } from 'class-validator';
export class PlaceBidDto {
  @IsMongoId() auctionId: string;
  @IsMongoId() bidderId: string;
  @IsString() @IsNotEmpty() @Matches(/^\\d+(\\.\\d+)?$/) amount: string;
}`);

w('src/modules/bids/services/bid.service.ts', `import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionHelper } from '../../../infrastructure/database/transaction.helper';
import { toDecimal128 } from '../../../common/utils/money.util';
import { Auction, AuctionDocument } from '../../auctions/schemas/auction.schema';
import { Bid, BidDocument } from '../schemas/bid.schema';
import { BidStatus, BidType } from '../../../common/enums/domain.enums';
@Injectable()
export class BidService {
  constructor(@InjectModel(Auction.name) private readonly auctions: Model<AuctionDocument>, @InjectModel(Bid.name) private readonly bids: Model<BidDocument>, private readonly tx: TransactionHelper) {}
  async placeBid(auctionId: string, bidderId: string, amount: string) {
    return this.tx.withTransaction(async (session) => {
      const bid = await this.bids.create([{ auctionId: new Types.ObjectId(auctionId), bidderId: new Types.ObjectId(bidderId), amount: toDecimal128(amount), type: BidType.MANUAL, status: BidStatus.VALID }], { session });
      const updated = await this.auctions.updateOne({ _id: auctionId, endAt: { $gt: new Date() }, currentPrice: { $lt: toDecimal128(amount) } }, { $set: { currentPrice: toDecimal128(amount), winningBidId: bid[0]._id, winningUserId: bidderId }, $inc: { totalBids: 1 } }, { session });
      if (updated.modifiedCount !== 1) throw new ConflictException('Bid rejected by current auction state.');
      return bid[0];
    });
  }
}`);

w('src/app.module.ts', `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
${Object.keys(modules).filter(m=>m!=='auth').map(m=>`import { ${m.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('')}Module } from './modules/${m}/${m}.module';`).join('\n')}
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, RedisModule, QueueModule, AuthModule, ${Object.keys(modules).filter(m=>m!=='auth').map(m=>`${m.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('')}Module`).join(', ')}] })
export class AppModule {}`);
w('src/main.ts', `import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();`);

w('src/infrastructure/database/seeds/seed.ts', `import 'reflect-metadata';
import mongoose from 'mongoose';
import { RoleSchema } from '../../../modules/roles/schemas/role.schema';
import { SettingSchema } from '../../../modules/settings/schemas/setting.schema';
import { CategorySchema } from '../../../modules/categories/schemas/category.schema';
const roles = ['SUPER_ADMIN','ADMIN','MODERATOR','SUPPORT','FINANCE','SELLER','BUYER'];
async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/emin');
  const Role = mongoose.model('Role', RoleSchema);
  const Setting = mongoose.model('Setting', SettingSchema);
  const Category = mongoose.model('Category', CategorySchema);
  for (const slug of roles) await Role.updateOne({ slug }, { $setOnInsert: { name: slug.replace('_', ' '), slug, permissions: [] } }, { upsert: true });
  for (const [key, value] of Object.entries({ 'platform.currency': 'USD', 'platform.defaultCommission': '10', 'auction.defaultMinimumIncrement': '1', 'auction.extensionSeconds': 120, 'seller.minimumWithdrawal': '25', 'order.paymentTimeoutMinutes': 30 })) await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true });
  await Category.updateOne({ slug: 'electronics' }, { $setOnInsert: { name: 'Electronics', slug: 'electronics', attributes: [{ name: 'Brand', type: 'TEXT', required: false, filterable: true, sortOrder: 1 }], sortOrder: 1 } }, { upsert: true });
  await mongoose.disconnect();
}
void main();`);

w('test/schema-indexes.spec.ts', `import { ProductSchema } from '../src/modules/products/schemas/product.schema';
import { AuctionSchema } from '../src/modules/auctions/schemas/auction.schema';
import { BidSchema } from '../src/modules/bids/schemas/bid.schema';
import { WalletTransactionSchema } from '../src/modules/wallets/schemas/wallet-transaction.schema';
describe('marketplace schema indexes', () => {
  it('defines product search and listing indexes', () => { expect(ProductSchema.indexes()).toEqual(expect.arrayContaining([[{ title: 'text', description: 'text' }, expect.any(Object)]])); });
  it('defines auction concurrency lookup indexes', () => { expect(AuctionSchema.indexes().some(([i]) => i.status === 1 && i.endAt === 1)).toBe(true); });
  it('keeps bids outside auctions with bid history indexes', () => { expect(BidSchema.indexes().some(([i]) => i.auctionId === 1 && i.createdAt === -1)).toBe(true); });
  it('defines immutable ledger history indexes', () => { expect(WalletTransactionSchema.indexes().some(([i]) => i.walletId === 1 && i.createdAt === -1)).toBe(true); });
});`);

w('docs/database.md', `# Odaboo Marketplace Database Layer

## Collections
users, roles, sellerProfiles, categories, products, auctions, bids, autoBids, carts, wishlists, orders, payments, refunds, shipments, wallets, walletTransactions, withdrawals, commissions, reviews, conversations, messages, notifications, supportTickets, coupons, banners, pages, auditLogs, settings.

## Embedding
Addresses, seller documents, category attributes, product images/attributes, cart and wishlist items, order items/address snapshots/status history, payment transactions, notification data, and support ticket messages are embedded as specified.

## References
Schemas use ObjectId refs for users, roles, sellers, categories, products, auctions, bids, orders, payments, refunds, shipments, wallets, withdrawals, commissions, reviews, conversations, notifications, tickets, audit actors, and setting updaters.

## Index Review
Indexes cover product listings/search, category filtering, seller products, active and ending auctions, bid history, buyer orders, seller order item lookup, payment lookup, wallet ledger history, conversation messages, notifications, and admin filtering.

## Transactions Required
Use TransactionHelper for placing bids, settlement, checkout, payment settlement, refunds, commission posting, wallet credit/debit, withdrawal approval, and withdrawal settlement. Redis lock hooks are intentionally isolated for future distributed auction locking.

## Scaling Notes
Bids, messages, wallet transactions, notifications, and audit logs are separate collections to avoid unbounded parent arrays. Support messages are embedded now, but the module boundary allows migration to a separate support messages collection later.

## Deviations
No intentional schema deviations. Service implementations are intentionally skeletal except for an example transactional bid path; business workflows should be expanded around the provided schemas and transaction helper.`);

console.log('Generated Emin backend scaffold.');
