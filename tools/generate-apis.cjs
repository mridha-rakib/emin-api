const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const w = (file, content) => {
  const p = path.join(root, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.trimStart().replace(/\r?\n/g, '\r\n'));
};

const modules = {
  users: ['User'],
  roles: ['Role'],
  sellers: ['SellerProfile'],
  categories: ['Category'],
  products: ['Product'],
  auctions: ['Auction'],
  bids: ['Bid', 'AutoBid'],
  carts: ['Cart'],
  wishlists: ['Wishlist'],
  orders: ['Order'],
  payments: ['Payment'],
  refunds: ['Refund'],
  shipments: ['Shipment'],
  wallets: ['Wallet', 'WalletTransaction'],
  withdrawals: ['Withdrawal'],
  commissions: ['Commission'],
  reviews: ['Review'],
  conversations: ['Conversation', 'Message'],
  notifications: ['Notification'],
  support: ['SupportTicket'],
  coupons: ['Coupon'],
  cms: ['Banner', 'Page'],
  audit: ['AuditLog'],
  settings: ['Setting'],
};

const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const pascal = (s) => s.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const camel = (s) => s[0].toLowerCase() + s.slice(1);

const readonly = new Set(['AuditLog', 'WalletTransaction']);
const endpoint = {
  SellerProfile: 'seller-profiles',
  AutoBid: 'auto-bids',
  WalletTransaction: 'wallet-transactions',
  SupportTicket: 'support-tickets',
  AuditLog: 'audit-logs',
};

for (const [mod, classes] of Object.entries(modules)) {
  for (const cls of classes) {
    const file = kebab(cls);
    const ep = endpoint[cls] ?? `${file}s`;
    const repo = `${cls}Repository`;
    const service = `${cls}Service`;
    const controller = `${cls}Controller`;
    const modelVar = `${camel(cls)}Model`;

    w(`src/modules/${mod}/dto/create-${file}.dto.ts`, `import { IsObject, IsOptional } from 'class-validator';

export class Create${cls}Dto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}`);
    w(`src/modules/${mod}/dto/update-${file}.dto.ts`, `import { PartialType } from '@nestjs/mapped-types';
import { Create${cls}Dto } from './create-${file}.dto';

export class Update${cls}Dto extends PartialType(Create${cls}Dto) {}`);

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

    const createBlock = readonly.has(cls)
      ? `create(): never {\n    throw new MethodNotAllowedException('${cls} records are append-only or system-managed.');\n  }`
      : `create(dto: Create${cls}Dto) {\n    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<${cls}Document>));\n  }`;
    const updateBlock = readonly.has(cls)
      ? `update(): never {\n    throw new MethodNotAllowedException('${cls} records cannot be updated through this API.');\n  }`
      : `update(id: string, dto: Update${cls}Dto) {\n    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });\n  }`;
    const serviceImports = readonly.has(cls) ? `import { Injectable, MethodNotAllowedException } from '@nestjs/common';` : `import { Injectable } from '@nestjs/common';`;
    w(`src/modules/${mod}/services/${file}.service.ts`, `${serviceImports}
import { ${cls}Document } from '../schemas/${file}.schema';
import { Create${cls}Dto } from '../dto/create-${file}.dto';
import { Update${cls}Dto } from '../dto/update-${file}.dto';
import { ${repo} } from '../repositories/${file}.repository';

@Injectable()
export class ${service} {
  constructor(private readonly repository: ${repo}) {}

  ${createBlock}

  findAll() {
    return this.repository.findMany({});
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  ${updateBlock}
}`);

    w(`src/modules/${mod}/controllers/${file}.controller.ts`, `import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Update${cls}Dto) {
    return this.service.update(id, dto);
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

w('src/modules/bids/controllers/bidding.controller.ts', `import { Body, Controller, Post } from '@nestjs/common';
import { PlaceBidDto } from '../../auctions/dto/place-bid.dto';
import { BidService } from '../services/bid.service';

@Controller('auctions')
export class BiddingController {
  constructor(private readonly bidService: BidService) {}

  @Post(':auctionId/bids')
  placeBid(@Body() dto: PlaceBidDto) {
    return this.bidService.placeBid(dto.auctionId, dto.bidderId, dto.amount);
  }
}`);

const bidMod = fs.readFileSync(path.join(root, 'src/modules/bids/bids.module.ts'), 'utf8');
const nextBidMod = bidMod
  .replace(`import { BidController } from './controllers/bid.controller';`, `import { BidController } from './controllers/bid.controller';\nimport { BiddingController } from './controllers/bidding.controller';\nimport { TransactionHelper } from '../../infrastructure/database/transaction.helper';`)
  .replace('controllers: [BidController, AutoBidController]', 'controllers: [BidController, AutoBidController, BiddingController]')
  .replace('providers: [BidRepository, BidService, AutoBidRepository, AutoBidService]', 'providers: [BidRepository, BidService, AutoBidRepository, AutoBidService, TransactionHelper]');
fs.writeFileSync(path.join(root, 'src/modules/bids/bids.module.ts'), nextBidMod.replace(/\r?\n/g, '\r\n'));

console.log('Generated REST API controllers, services, and repositories.');
