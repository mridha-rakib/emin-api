import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryStatus } from '../../../common/enums/domain.enums';

const HOMEPAGE_CATEGORIES = [
  { name: 'Trades & Crafts', nameDe: 'Handwerk & Gewerbe', slug: 'trades-crafts', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop', professionalCount: 180, priceCHF: 45, sortOrder: 1 },
  { name: 'Education & Tutoring', nameDe: 'Bildung & Nachhilfe', slug: 'education-tutoring', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop', professionalCount: 95, priceCHF: 35, sortOrder: 2 },
  { name: 'Gastronomy, Catering & Event', nameDe: 'Gastronomie & Events', slug: 'gastronomy-catering-event', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop', professionalCount: 110, priceCHF: 50, sortOrder: 3 },
  { name: 'Transport & Moving', nameDe: 'Transport & Umzug', slug: 'transport-moving', image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=800&auto=format&fit=crop', professionalCount: 130, priceCHF: 55, sortOrder: 4 },
  { name: 'Business & IT', nameDe: 'Business, IT & Marketing', slug: 'business-it', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop', professionalCount: 85, priceCHF: 65, sortOrder: 5 },
  { name: 'Sports, Leisure & Care', nameDe: 'Sport, Freizeit & Betreuung', slug: 'sports-leisure-care', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop', professionalCount: 75, priceCHF: 40, sortOrder: 6 },
  { name: 'Design & Photography', nameDe: 'Design, Fotografie & Film', slug: 'design-photography', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop', professionalCount: 90, priceCHF: 60, sortOrder: 7 },
  { name: 'Beauty & Health', nameDe: 'Schönheit & Styling', slug: 'beauty-health', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop', professionalCount: 105, priceCHF: 45, sortOrder: 8 },
];

@Injectable()
export class CategoryService implements OnModuleInit {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly repository: CategoryRepository) {}

  async onModuleInit() {
    for (const item of HOMEPAGE_CATEGORIES) {
      const existing = await this.repository.findOne({ $or: [{ slug: item.slug }, { name: item.name, parentId: null }] });
      const details = {
        nameDe: item.nameDe,
        image: item.image,
        priceCHF: item.priceCHF,
        professionalCount: item.professionalCount,
        rating: 4.9,
        reviewCount: 500,
        featured: true,
        status: CategoryStatus.ACTIVE,
        sortOrder: item.sortOrder,
      };
      if (!existing) {
        await this.repository.createOne({ name: item.name, slug: item.slug, parentId: null, ...details });
        continue;
      }
      const patch: Record<string, unknown> = {};
      if (!existing.nameDe) patch.nameDe = details.nameDe;
      if (!existing.image) patch.image = details.image;
      if (existing.priceCHF == null) patch.priceCHF = details.priceCHF;
      if (existing.professionalCount == null) patch.professionalCount = details.professionalCount;
      if (existing.rating == null) patch.rating = details.rating;
      if (existing.reviewCount == null) patch.reviewCount = details.reviewCount;
      if (existing.featured == null) patch.featured = true;
      if (Object.keys(patch).length > 0) await this.repository.updateOne({ _id: existing._id }, { $set: patch });
    }
    this.logger.log('Homepage categories are ready to be featured.');
  }

  create(dto: CreateCategoryDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<CategoryDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  async findFeatured() {
    const items = await this.repository.findFeatured();
    return { items };
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}