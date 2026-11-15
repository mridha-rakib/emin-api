const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const w = (file, content) => {
  const p = path.join(root, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.trimStart().replace(/\r?\n/g, '\r\n'));
};

const schemaHeader = `import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
`;

const features = [
  {
    mod: 'bookings',
    cls: 'Booking',
    route: 'bookings',
    collection: 'bookings',
    fields: `@Prop({ required: true }) customerName: string;
  @Prop() customerEmail?: string;
  @Prop() customerPhone?: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) customerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SellerProfile' }) providerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' }) serviceId?: Types.ObjectId;
  @Prop({ required: true }) serviceTitle: string;
  @Prop() serviceCategory?: string;
  @Prop() scheduledAt?: Date;
  @Prop() location?: string;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) amount?: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }) status: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;`,
  },
  {
    mod: 'services',
    cls: 'ServiceListing',
    route: 'services',
    collection: 'services',
    fields: `@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SellerProfile' }) providerId?: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop() slug?: string;
  @Prop() description?: string;
  @Prop() category?: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) price?: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ type: [String], default: [] }) images: string[];
  @Prop({ enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'], default: 'ACTIVE' }) status: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;`,
  },
  {
    mod: 'blogs',
    cls: 'BlogPost',
    route: 'blogs',
    collection: 'blogs',
    fields: `@Prop({ required: true }) title: string;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop() excerpt?: string;
  @Prop({ required: true }) content: string;
  @Prop() coverImage?: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) authorId?: Types.ObjectId;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' }) status: string;
  @Prop() publishedAt?: Date;`,
  },
  {
    mod: 'feed',
    cls: 'FeedPost',
    route: 'feed-posts',
    collection: 'feedPosts',
    fields: `@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) userId?: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop() description?: string;
  @Prop() category?: string;
  @Prop() budget?: string;
  @Prop() location?: string;
  @Prop({ type: [String], default: [] }) attachments: string[];
  @Prop({ enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'], default: 'OPEN' }) status: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;`,
  },
  {
    mod: 'subscriptions',
    cls: 'SubscriptionPlan',
    route: 'subscription-plans',
    collection: 'subscriptionPlans',
    fields: `@Prop({ required: true }) name: string;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0, required: true }) monthlyPrice: Types.Decimal128;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) yearlyPrice?: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ type: [String], default: [] }) features: string[];
  @Prop({ default: true }) active: boolean;`,
  },
  {
    mod: 'subscriptions',
    cls: 'UserSubscription',
    route: 'subscriptions',
    collection: 'subscriptions',
    fields: `@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SubscriptionPlan' }) planId?: Types.ObjectId;
  @Prop({ required: true }) planName: string;
  @Prop({ enum: ['monthly', 'yearly'], default: 'monthly' }) billingCycle: string;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0, required: true }) amount: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'], default: 'ACTIVE' }) status: string;
  @Prop() startsAt?: Date;
  @Prop() endsAt?: Date;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) paymentDetails: Record<string, unknown>;`,
  },
  {
    mod: 'subscriptions',
    cls: 'Invoice',
    route: 'invoices',
    collection: 'invoices',
    fields: `@Prop({ required: true, unique: true }) invoiceNumber: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'UserSubscription' }) subscriptionId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0, required: true }) amount: Types.Decimal128;
  @Prop({ default: 'USD' }) currency: string;
  @Prop({ enum: ['PENDING', 'PAID', 'FAILED', 'VOID'], default: 'PENDING' }) status: string;
  @Prop() paidAt?: Date;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;`,
  },
  {
    mod: 'ai',
    cls: 'AiNegotiationLog',
    route: 'ai-negotiation-logs',
    collection: 'aiNegotiationLogs',
    fields: `@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' }) productId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) buyerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SellerProfile' }) sellerId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) offerAmount?: Types.Decimal128;
  @Prop({ type: MongooseSchema.Types.Decimal128, min: 0 }) counterAmount?: Types.Decimal128;
  @Prop({ enum: ['SUBMITTED', 'ACCEPTED', 'COUNTERED', 'REJECTED'], default: 'SUBMITTED' }) status: string;
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] }) messages: Record<string, unknown>[];
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) metadata: Record<string, unknown>;`,
  },
  {
    mod: 'platform',
    cls: 'PlatformCustomization',
    route: 'platform-customization',
    collection: 'platformCustomizations',
    singleton: true,
    fields: `@Prop({ required: true, unique: true, default: 'default' }) key: string;
  @Prop() logoUrl?: string;
  @Prop() faviconUrl?: string;
  @Prop() primaryColor?: string;
  @Prop() secondaryColor?: string;
  @Prop() supportEmail?: string;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) branding: Record<string, unknown>;
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} }) aiRules: Record<string, unknown>;`,
  },
  {
    mod: 'faqs',
    cls: 'Faq',
    route: 'faqs',
    collection: 'faqs',
    fields: `@Prop({ required: true }) question: string;
  @Prop({ required: true }) answer: string;
  @Prop() category?: string;
  @Prop({ default: 0 }) sortOrder: number;
  @Prop({ default: true }) active: boolean;`,
  },
];

const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const pascal = (s) => s.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');

w('src/common/dto/raw-payload.dto.ts', `import { IsObject, IsOptional } from 'class-validator';

export class RawPayloadDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}`);

function writeFeature(f) {
  const file = kebab(f.cls);
  const service = `${f.cls}Service`;
  const controller = `${f.cls}Controller`;
  const repo = `${f.cls}Repository`;
  w(`src/modules/${f.mod}/schemas/${file}.schema.ts`, `${schemaHeader}
export type ${f.cls}Document = HydratedDocument<${f.cls}>;

@Schema({ timestamps: true, versionKey: false, collection: '${f.collection}' })
export class ${f.cls} {
  ${f.fields}
}

export const ${f.cls}Schema = SchemaFactory.createForClass(${f.cls});
`);
  w(`src/modules/${f.mod}/repositories/${file}.repository.ts`, `import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { ${f.cls}, ${f.cls}Document } from '../schemas/${file}.schema';

@Injectable()
export class ${repo} extends BaseRepository<${f.cls}Document> {
  constructor(@InjectModel(${f.cls}.name) model: Model<${f.cls}Document>) {
    super(model);
  }
}`);
  w(`src/modules/${f.mod}/services/${file}.service.ts`, `import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { ${repo} } from '../repositories/${file}.repository';

@Injectable()
export class ${service} {
  constructor(private readonly repository: ${repo}) {}

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

  ${f.singleton ? `findDefault() {\n    return this.repository.findOne({ key: 'default' });\n  }\n\n  upsertDefault(dto: RawPayloadDto) {\n    return this.repository.updateOne({ key: 'default' }, { $set: { key: 'default', ...(dto.payload ?? {}) } });\n  }` : ''}
}`);
  w(`src/modules/${f.mod}/controllers/${file}.controller.ts`, `import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { ${service} } from '../services/${file}.service';

@Controller('${f.route}')
export class ${controller} {
  constructor(private readonly service: ${service}) {}

  @Post()
  create(@Body() dto: RawPayloadDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  ${f.singleton ? `@Get('default')\n  findDefault() {\n    return this.service.findDefault();\n  }\n\n  @Patch('default')\n  upsertDefault(@Body() dto: RawPayloadDto) {\n    return this.service.upsertDefault(dto);\n  }\n` : ''}
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: RawPayloadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}`);
}

for (const f of features) writeFeature(f);

for (const mod of [...new Set(features.map((f) => f.mod))]) {
  const mine = features.filter((f) => f.mod === mod);
  const imports = mine.map((f) => {
    const file = kebab(f.cls);
    return `import { ${f.cls}, ${f.cls}Schema } from './schemas/${file}.schema';
import { ${f.cls}Repository } from './repositories/${file}.repository';
import { ${f.cls}Service } from './services/${file}.service';
import { ${f.cls}Controller } from './controllers/${file}.controller';`;
  }).join('\n');
  const models = mine.map((f) => `{ name: ${f.cls}.name, schema: ${f.cls}Schema }`).join(', ');
  const providers = mine.flatMap((f) => [`${f.cls}Repository`, `${f.cls}Service`]).join(', ');
  const controllers = mine.map((f) => `${f.cls}Controller`).join(', ');
  w(`src/modules/${mod}/${mod}.module.ts`, `import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
${imports}

@Module({
  imports: [MongooseModule.forFeature([${models}])],
  controllers: [${controllers}],
  providers: [${providers}],
  exports: [MongooseModule, ${providers}],
})
export class ${pascal(mod)}Module {}`);
}

w('src/modules/auth/dto/auth.dto.ts', `import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class EmailDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResetPasswordDto extends VerifyOtpDto {
  @IsString()
  @MinLength(6)
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}`);

w('src/modules/auth/auth.service.ts', `import { Injectable } from '@nestjs/common';
import { ChangePasswordDto, EmailDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  register(dto: RegisterDto) {
    return { accessToken: 'dev-token', user: { email: dto.email, firstName: dto.firstName, lastName: dto.lastName } };
  }

  login(dto: LoginDto) {
    return { accessToken: 'dev-token', user: { email: dto.email } };
  }

  forgotPassword(dto: EmailDto) {
    return { message: 'OTP sent if the account exists.', email: dto.email };
  }

  verifyOtp(dto: VerifyOtpDto) {
    return { verified: true, email: dto.email };
  }

  resetPassword(dto: ResetPasswordDto) {
    return { message: 'Password reset accepted.', email: dto.email };
  }

  changePassword(_dto: ChangePasswordDto) {
    return { message: 'Password changed.' };
  }

  me() {
    return { id: 'dev-user', email: 'dev@example.com' };
  }
}`);

w('src/modules/auth/auth.controller.ts', `import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, EmailDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyOtpDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: EmailDto) {
    return this.service.forgotPassword(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.service.verifyOtp(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(dto);
  }

  @Patch('change-password')
  changePassword(@Body() dto: ChangePasswordDto) {
    return this.service.changePassword(dto);
  }

  @Get('me')
  me() {
    return this.service.me();
  }
}`);

w('src/modules/auth/auth.module.ts', `import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}`);

w('src/modules/reports/reports.controller.ts', `import { Controller, Get } from '@nestjs/common';

@Controller()
export class ReportsController {
  @Get('dashboard/summary')
  dashboardSummary() {
    return { users: 0, providers: 0, bookings: 0, revenue: '0' };
  }

  @Get('reports/summary')
  reportsSummary() {
    return { sales: [], users: [], products: [], bookings: [] };
  }

  @Get('earnings/summary')
  earningsSummary() {
    return { totalRevenue: '0', commission: '0', payouts: '0', chart: [] };
  }
}`);
w('src/modules/reports/reports.module.ts', `import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
})
export class ReportsModule {}`);

const appPath = path.join(root, 'src/app.module.ts');
let app = fs.readFileSync(appPath, 'utf8');
const moduleNames = ['BookingsModule', 'ServicesModule', 'BlogsModule', 'FeedModule', 'SubscriptionsModule', 'AiModule', 'PlatformModule', 'FaqsModule', 'ReportsModule'];
const importLines = [
  `import { BookingsModule } from './modules/bookings/bookings.module';`,
  `import { ServicesModule } from './modules/services/services.module';`,
  `import { BlogsModule } from './modules/blogs/blogs.module';`,
  `import { FeedModule } from './modules/feed/feed.module';`,
  `import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';`,
  `import { AiModule } from './modules/ai/ai.module';`,
  `import { PlatformModule } from './modules/platform/platform.module';`,
  `import { FaqsModule } from './modules/faqs/faqs.module';`,
  `import { ReportsModule } from './modules/reports/reports.module';`,
];
for (const line of importLines) if (!app.includes(line)) app = app.replace(`import { QueueModule } from './infrastructure/queue/queue.module';`, `import { QueueModule } from './infrastructure/queue/queue.module';\n${line}`);
for (const name of moduleNames) if (!app.includes(`${name}]`) && !app.includes(`${name},`)) app = app.replace('QueueModule, AuthModule,', `QueueModule, AuthModule, ${name},`);
fs.writeFileSync(appPath, app.replace(/\r?\n/g, '\r\n'));

console.log('Generated missing feature APIs from dashboard/frontend page scan.');
