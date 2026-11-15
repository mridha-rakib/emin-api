import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ProductDocument } from '../schemas/product.schema';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductRepository } from '../repositories/product.repository';
import { Category, CategoryDocument } from '../../categories/schemas/category.schema';
import { SellerProfile, SellerProfileDocument } from '../../sellers/schemas/seller-profile.schema';
import { ApprovalStatus, CategoryStatus, ListingType, ProductStatus, VerificationStatus } from '../../../common/enums/domain.enums';

@Injectable()
export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    @InjectModel(Category.name) private readonly categories: Model<CategoryDocument>,
    @InjectModel(SellerProfile.name) private readonly sellers: Model<SellerProfileDocument>,
    private readonly auth: AuthService,
  ) {}

  async create(dto: CreateProductDto, authorization?: string) {
    const seller = await this.auth.requireVerifiedSeller(authorization, 'products');
    const payload = { ...(dto.payload ?? (dto as unknown as Record<string, unknown>)) };
    delete payload.sellerId;
    payload.sellerUserId = seller._id.toString();
    payload.sellerEmail = seller.email;
    payload.sellerName = [seller.firstName, seller.lastName].filter(Boolean).join(' ') || payload.sellerName;
    const normalized = await this.normalizeSellerProductPayload(payload);
    return this.repository.createOne(normalized as Partial<ProductDocument>);
  }

  async findAll(query: PaginationQueryDto & { sellerId?: string; sellerUserId?: string; sellerEmail?: string }) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };

    if (query.sellerId && Types.ObjectId.isValid(query.sellerId)) {
      filter.sellerId = new Types.ObjectId(query.sellerId);
    } else if (query.sellerUserId && Types.ObjectId.isValid(query.sellerUserId)) {
      const sellerUserId = new Types.ObjectId(query.sellerUserId);
      const seller = await this.sellers.findOne({ userId: sellerUserId, deletedAt: { $exists: false } }).exec();
      filter.$or = [
        { sellerUserId },
        ...(seller?._id ? [{ sellerId: seller._id }] : []),
        ...(query.sellerEmail ? [{ sellerEmail: String(query.sellerEmail).trim().toLowerCase() }] : []),
      ];
    } else if (query.sellerEmail) {
      filter.sellerEmail = String(query.sellerEmail).trim().toLowerCase();
    }

    return this.repository.paginate(filter, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  async update(id: string, dto: UpdateProductDto, authorization?: string) {
    const user = await this.assertOwner(id, authorization);
    const changes = { ...(dto.payload ?? (dto as unknown as Record<string, unknown>)) };
    ['sellerId', 'sellerUserId', 'sellerEmail'].forEach((field) => delete changes[field]);
    const isAdmin = this.auth.isAdminUser(user);
    if (!isAdmin || !Object.values(ApprovalStatus).includes(changes.approvalStatus as ApprovalStatus)) {
      delete changes.approvalStatus;
    }
    return this.repository.updateOne({ _id: id, deletedAt: { $exists: false } }, { $set: changes });
  }

  async remove(id: string, authorization?: string) {
    await this.assertOwner(id, authorization);
    return this.repository.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
  }

  private async assertOwner(id: string, authorization?: string) {
    const user = await this.auth.requireUser(authorization);
    const product = await this.repository.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!product) throw new NotFoundException('Product not found.');
    const isOwner = product.sellerUserId?.toString() === user._id.toString();
    if (!isOwner && !this.auth.isAdminUser(user)) {
      throw new ForbiddenException('You can only change your own listings.');
    }
    return user;
  }

  private async normalizeSellerProductPayload(payload: Record<string, unknown>) {
    const title = String(payload.title || payload.name || 'New Listing').trim();
    const categoryName = String(payload.category || 'General').trim();
    const seller = await this.resolveSeller(payload);
    const category = await this.resolveCategory(categoryName);

    return {
      ...payload,
      sellerId: payload.sellerId && Types.ObjectId.isValid(String(payload.sellerId))
        ? new Types.ObjectId(String(payload.sellerId))
        : seller._id,
      sellerUserId: seller.userId,
      categoryId: payload.categoryId && Types.ObjectId.isValid(String(payload.categoryId))
        ? new Types.ObjectId(String(payload.categoryId))
        : category._id,
      title,
      slug: payload.slug || await this.uniqueSlug(title),
      description: payload.description || 'Detailed description coming soon.',
      listingType: payload.listingType || ListingType.BUY_NOW,
      currency: payload.currency || 'CHF',
      quantity: Number(payload.quantity ?? 1),
      status: payload.status || ProductStatus.ACTIVE,
      approvalStatus: payload.approvalStatus || ApprovalStatus.APPROVED,
      category: categoryName,
      sellerName: payload.sellerName || seller.displayName,
      sellerEmail: payload.sellerEmail ? String(payload.sellerEmail).trim().toLowerCase() : undefined,
      publishedAt: payload.publishedAt || new Date(),
    };
  }

  private async resolveSeller(payload: Record<string, unknown>) {
    if (payload.sellerId && Types.ObjectId.isValid(String(payload.sellerId))) {
      const existing = await this.sellers.findById(payload.sellerId).exec();
      if (existing) return existing;
    }

    const sellerUserId = String(payload.sellerUserId || payload.userId || '');
    if (!Types.ObjectId.isValid(sellerUserId)) {
      throw new BadRequestException('A valid sellerUserId or sellerId is required to create a seller product.');
    }

    const userId = new Types.ObjectId(sellerUserId);
    const displayName = String(payload.sellerName || 'Seller');
    return this.sellers.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          displayName,
          businessName: displayName,
          verificationStatus: VerificationStatus.APPROVED,
          verifiedAt: new Date(),
        },
      },
      { new: true, upsert: true },
    ).exec();
  }

  private async resolveCategory(name: string) {
    const slug = this.slugify(name);
    return this.categories.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          name,
          slug,
          description: `${name} products`,
          status: CategoryStatus.ACTIVE,
          sortOrder: 0,
        },
      },
      { new: true, upsert: true },
    ).exec();
  }

  private async uniqueSlug(title: string) {
    const base = this.slugify(title);
    let slug = base;
    let suffix = 1;

    while (await this.repository.findOne({ slug })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    return slug;
  }

  private slugify(value: string) {
    const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug || 'listing';
  }
}
