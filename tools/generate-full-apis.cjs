const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const w = (file, content) => {
  const p = path.join(root, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.trimStart().replace(/\r?\n/g, '\r\n'));
};

const modules = {
  users: ['User'], roles: ['Role'], sellers: ['SellerProfile'], categories: ['Category'],
  products: ['Product'], auctions: ['Auction'], bids: ['Bid', 'AutoBid'], carts: ['Cart'],
  wishlists: ['Wishlist'], orders: ['Order'], payments: ['Payment'], refunds: ['Refund'],
  shipments: ['Shipment'], wallets: ['Wallet', 'WalletTransaction'], withdrawals: ['Withdrawal'],
  commissions: ['Commission'], reviews: ['Review'], conversations: ['Conversation', 'Message'],
  notifications: ['Notification'], support: ['SupportTicket'], coupons: ['Coupon'], cms: ['Banner', 'Page'],
  audit: ['AuditLog'], settings: ['Setting'],
};

const endpoint = { SellerProfile: 'seller-profiles', AutoBid: 'auto-bids', WalletTransaction: 'wallet-transactions', SupportTicket: 'support-tickets', AuditLog: 'audit-logs' };
const protectedRecords = new Set(['Order', 'Payment', 'Refund', 'Bid', 'Commission', 'WalletTransaction', 'Withdrawal', 'AuditLog']);
const appendOnly = new Set(['AuditLog', 'WalletTransaction']);
const softDelete = new Set(['User', 'Product', 'SellerProfile']);
const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const pascal = (s) => s.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const camel = (s) => s[0].toLowerCase() + s.slice(1);

w('src/common/dto/pagination-query.dto.ts', `import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;

  @IsOptional()
  @IsString()
  search?: string;
}`);

w('src/common/pipes/parse-object-id.pipe.ts', `import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    return value;
  }
}`);

w('src/common/repositories/base.repository.ts', `import { ClientSession, FilterQuery, Model, ProjectionType, QueryOptions, UpdateQuery } from 'mongoose';

export interface PageOptions {
  page?: number;
  limit?: number;
}

export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  createOne(data: Partial<T>, session?: ClientSession) {
    return this.model.create([data], { session }).then((docs) => docs[0]);
  }

  findOne(filter: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>) {
    return this.model.findOne(filter, projection, options).exec();
  }

  findMany(filter: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>) {
    return this.model.find(filter, projection, options).exec();
  }

  async paginate(filter: FilterQuery<T>, options: PageOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, session?: ClientSession) {
    return this.model.findOneAndUpdate(filter, update, { new: true, session }).exec();
  }

  deleteOne(filter: FilterQuery<T>, session?: ClientSession) {
    return this.model.deleteOne(filter, { session }).exec();
  }
}`);

for (const [mod, classes] of Object.entries(modules)) {
  for (const cls of classes) {
    const file = kebab(cls);
    const ep = endpoint[cls] ?? `${file}s`;
    const repo = `${cls}Repository`;
    const service = `${cls}Service`;
    const controller = `${cls}Controller`;
    const modelVar = `${camel(cls)}Model`;

    w(`src/modules/${mod}/repositories/${file}.repository.ts`, `import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { ${cls}, ${cls}Document } from '../schemas/${file}.schema';

@Injectable()
export class ${repo} extends BaseRepository<${cls}Document> {
  constructor(@InjectModel(${cls}.name) private readonly ${modelVar}: Model<${cls}Document>) {
    super(${modelVar});
  }
}`);

    const serviceImport = (appendOnly.has(cls) || protectedRecords.has(cls)) ? `import { Injectable, MethodNotAllowedException } from '@nestjs/common';` : `import { Injectable } from '@nestjs/common';`;
    const create = appendOnly.has(cls)
      ? `create(_dto: Create${cls}Dto): never {\n    throw new MethodNotAllowedException('${cls} records are system-managed.');\n  }`
      : `create(dto: Create${cls}Dto) {\n    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<${cls}Document>));\n  }`;
    const update = appendOnly.has(cls)
      ? `update(_id: string, _dto: Update${cls}Dto): never {\n    throw new MethodNotAllowedException('${cls} records are append-only.');\n  }`
      : `update(id: string, dto: Update${cls}Dto) {\n    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });\n  }`;
    const remove = protectedRecords.has(cls)
      ? `remove(_id: string): never {\n    throw new MethodNotAllowedException('${cls} records cannot be deleted.');\n  }`
      : softDelete.has(cls)
        ? `remove(id: string) {\n    return this.repository.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });\n  }`
        : `remove(id: string) {\n    return this.repository.deleteOne({ _id: id });\n  }`;

    w(`src/modules/${mod}/services/${file}.service.ts`, `${serviceImport}
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ${cls}Document } from '../schemas/${file}.schema';
import { Create${cls}Dto } from '../dto/create-${file}.dto';
import { Update${cls}Dto } from '../dto/update-${file}.dto';
import { ${repo} } from '../repositories/${file}.repository';

@Injectable()
export class ${service} {
  constructor(private readonly repository: ${repo}) {}

  ${create}

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  ${update}

  ${remove}
}`);

    w(`src/modules/${mod}/controllers/${file}.controller.ts`, `import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { Create${cls}Dto } from '../dto/create-${file}.dto';
import { Update${cls}Dto } from '../dto/update-${file}.dto';
import { ${service} } from '../services/${file}.service';

@Controller('${ep}')
export class ${controller} {
  constructor(private readonly service: ${service}) {}

  @Post()
  create(@Body() dto: Create${cls}Dto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: Update${cls}Dto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}`);
  }

  const imports = classes.map((cls) => {
    const file = kebab(cls);
    return [
      `import { ${cls}, ${cls}Schema } from './schemas/${file}.schema';`,
      `import { ${cls}Repository } from './repositories/${file}.repository';`,
      `import { ${cls}Service } from './services/${file}.service';`,
      `import { ${cls}Controller } from './controllers/${file}.controller';`,
    ].join('\n');
  }).join('\n');
  const modelDefs = classes.map((cls) => `{ name: ${cls}.name, schema: ${cls}Schema }`).join(', ');
  const providers = classes.flatMap((cls) => [`${cls}Repository`, `${cls}Service`]);
  const controllers = classes.map((cls) => `${cls}Controller`);
  w(`src/modules/${mod}/${mod}.module.ts`, `import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
${imports}

@Module({
  imports: [MongooseModule.forFeature([${modelDefs}])],
  controllers: [${controllers.join(', ')}],
  providers: [${providers.join(', ')}],
  exports: [MongooseModule, ${providers.join(', ')}],
})
export class ${pascal(mod)}Module {}`);
}

w('src/modules/bids/controllers/bidding.controller.ts', `import { Body, Controller, Param, Post } from '@nestjs/common';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { PlaceBidDto } from '../../auctions/dto/place-bid.dto';
import { BidService } from '../services/bid.service';

@Controller('auctions')
export class BiddingController {
  constructor(private readonly bidService: BidService) {}

  @Post(':auctionId/bids')
  placeBid(@Param('auctionId', ParseObjectIdPipe) auctionId: string, @Body() dto: PlaceBidDto) {
    return this.bidService.placeBid(auctionId, dto.bidderId, dto.amount);
  }
}`);

let bidServicePath = path.join(root, 'src/modules/bids/services/bid.service.ts');
let bidService = fs.readFileSync(bidServicePath, 'utf8');
bidService = bidService
  .replace(`import { Injectable, MethodNotAllowedException } from '@nestjs/common';`, `import { ConflictException, Injectable, MethodNotAllowedException } from '@nestjs/common';`)
  .replace(`import { Injectable } from '@nestjs/common';`, `import { ConflictException, Injectable } from '@nestjs/common';`);
if (!bidService.includes(`@InjectModel(Auction.name)`)) {
  bidService = bidService
    .replace(`import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';`, `import { InjectModel } from '@nestjs/mongoose';\nimport { Model, Types } from 'mongoose';\nimport { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';\nimport { TransactionHelper } from '../../../infrastructure/database/transaction.helper';\nimport { toDecimal128 } from '../../../common/utils/money.util';\nimport { BidStatus, BidType } from '../../../common/enums/domain.enums';\nimport { Auction, AuctionDocument } from '../../auctions/schemas/auction.schema';`)
    .replace(`constructor(private readonly repository: BidRepository) {}`, `constructor(\n    private readonly repository: BidRepository,\n    @InjectModel(Auction.name) private readonly auctions: Model<AuctionDocument>,\n    private readonly tx: TransactionHelper,\n  ) {}`);
}
if (!bidService.includes('async placeBid(')) {
  bidService = bidService.replace(/\n}\s*$/, `

  async placeBid(auctionId: string, bidderId: string, amount: string) {
    return this.tx.withTransaction(async (session) => {
      const bid = await this.repository.createOne({
        auctionId: new Types.ObjectId(auctionId),
        bidderId: new Types.ObjectId(bidderId),
        amount: toDecimal128(amount),
        type: BidType.MANUAL,
        status: BidStatus.VALID,
      } as Partial<BidDocument>, session);

      const updated = await this.auctions.updateOne(
        { _id: auctionId, endAt: { $gt: new Date() }, currentPrice: { $lt: toDecimal128(amount) } },
        { $set: { currentPrice: toDecimal128(amount), winningBidId: bid._id, winningUserId: new Types.ObjectId(bidderId) }, $inc: { totalBids: 1 } },
        { session },
      );

      if (updated.modifiedCount !== 1) {
        throw new ConflictException('Bid rejected by current auction state.');
      }

      return bid;
    });
  }
}
`);
}
fs.writeFileSync(bidServicePath, bidService.replace(/\r?\n/g, '\r\n'));

let bidModulePath = path.join(root, 'src/modules/bids/bids.module.ts');
let bidModule = fs.readFileSync(bidModulePath, 'utf8');
if (!bidModule.includes('BiddingController')) bidModule = bidModule.replace(`import { BidController } from './controllers/bid.controller';`, `import { BidController } from './controllers/bid.controller';\nimport { BiddingController } from './controllers/bidding.controller';`);
if (!bidModule.includes('TransactionHelper')) bidModule = bidModule.replace(`import { AutoBidController } from './controllers/auto-bid.controller';`, `import { AutoBidController } from './controllers/auto-bid.controller';\nimport { TransactionHelper } from '../../infrastructure/database/transaction.helper';\nimport { Auction, AuctionSchema } from '../auctions/schemas/auction.schema';`);
bidModule = bidModule.replace(/MongooseModule\.forFeature\(\[[^\]]+\]\)/, `MongooseModule.forFeature([{ name: Bid.name, schema: BidSchema }, { name: AutoBid.name, schema: AutoBidSchema }, { name: Auction.name, schema: AuctionSchema }])`);
bidModule = bidModule.replace(/controllers: \[[^\]]+\]/, `controllers: [BidController, AutoBidController, BiddingController]`);
bidModule = bidModule.replace(/providers: \[[^\]]+\]/, `providers: [BidRepository, BidService, AutoBidRepository, AutoBidService, TransactionHelper]`);
fs.writeFileSync(bidModulePath, bidModule.replace(/\r?\n/g, '\r\n'));

console.log('Generated full REST API surface.');
