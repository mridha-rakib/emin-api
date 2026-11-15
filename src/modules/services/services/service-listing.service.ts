import { ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { S3StorageService } from '../../../infrastructure/storage/s3-storage.service';
import { AuthService } from '../../auth/auth.service';
import { ServiceListingRepository } from '../repositories/service-listing.repository';

const OWNER_FIELDS = ['providerId', 'providerUserId', 'providerEmail'];

type HomepageService = {
  title: string;
  category: string;
  role: string;
  providerName?: string;
  providers: number;
  price: string;
  image: string;
  featured: boolean;
};

const HOMEPAGE_SERVICES: HomepageService[] = [
  { title: 'Maler & Gipser (Painter & Plasterer)', category: 'Trades & Crafts', role: 'Painter / Plasterer', providerName: 'Painter & Plasterer', providers: 116, price: '45.00', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop', featured: true },
  { title: 'Sanitär & Rohrreinigung (Plumbing)', category: 'Trades & Crafts', role: 'Plumbing', providerName: 'Plumber', providers: 85, price: '55.00', image: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?q=80&w=800&auto=format&fit=crop', featured: true },
  { title: 'Fenster- & Gebäudereinigung (Cleaning)', category: 'Trades & Crafts', role: 'Cleaning', providerName: 'Cleaner', providers: 200, price: '35.00', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop', featured: true },
  { title: 'Automechaniker & Service (Auto Mechanic)', category: 'Trades & Crafts', role: 'Auto Mechanic / Car Care', providerName: 'Auto Mechanic', providers: 45, price: '60.00', image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=800&auto=format&fit=crop', featured: true },
  { title: 'Schreiner & Möbelmontage (Carpenter & Assembly)', category: 'Trades & Crafts', role: 'Carpenter / Joiner / Kitchen Fitter', providers: 68, price: '50.00', image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop', featured: false },
  { title: 'Gartenbau & Pflege (Gardening)', category: 'Trades & Crafts', role: 'Gardening / Landscape Maintenance', providers: 92, price: '40.00', image: 'https://images.unsplash.com/photo-1557429287-b2e26467fc2b?q=80&w=800&auto=format&fit=crop', featured: false },
  { title: 'Fahrlehrer (Driving Instructor)', category: 'Education & Tutoring', role: 'Driving Instructor', providers: 28, price: '75.00', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800&auto=format&fit=crop', featured: false },
  { title: 'Sprachunterricht (Language Lessons)', category: 'Education & Tutoring', role: 'Language Lessons', providers: 42, price: '45.00', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop', featured: false },
  { title: 'Hochzeitsfotograf (Wedding Photographer)', category: 'Design, Photography & Film', role: 'Wedding Photography', providers: 64, price: '90.00', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop', featured: false },
  { title: 'Umzug & Möbeltransport (Moving & Disposal)', category: 'Transport & Moving', role: 'Moving, Disposal, Furniture Assembly', providers: 110, price: '65.00', image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=800&auto=format&fit=crop', featured: false },
  { title: 'Personal Trainer & Fitness Coach', category: 'Sports, Leisure & Care', role: 'Personal Trainer / Coach', providers: 32, price: '50.00', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop', featured: false },
  { title: 'Coiffeur & Hairstyling (Hairdresser)', category: 'Beauty, Styling & Health', role: 'Hairdresser', providers: 54, price: '40.00', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop', featured: false },
];

@Injectable()
export class ServiceListingService implements OnModuleInit {
  private readonly logger = new Logger(ServiceListingService.name);

  constructor(
    private readonly repository: ServiceListingRepository,
    private readonly storage: S3StorageService,
    private readonly auth: AuthService,
  ) {}

  async create(dto: RawPayloadDto, authorization?: string) {
    const provider = await this.auth.requireVerifiedSeller(authorization, 'services');
    const payload = { ...(dto.payload ?? {}) };
    OWNER_FIELDS.forEach((field) => delete payload[field]);
    return this.repository.createOne({
      ...payload,
      providerUserId: provider._id,
      providerEmail: provider.email,
      providerName: [provider.firstName, provider.lastName].filter(Boolean).join(' ') || (payload.providerName as string | undefined),
    });
  }

  async onModuleInit() {
    for (const item of HOMEPAGE_SERVICES) {
      const existing = await this.repository.findOne({ title: item.title });
      if (existing) continue;
      await this.repository.createOne({
        title: item.title,
        category: item.category,
        role: item.role,
        ...(item.providerName ? { providerName: item.providerName } : {}),
        price: Types.Decimal128.fromString(item.price),
        currency: 'CHF',
        images: [item.image],
        status: 'ACTIVE',
        featured: item.featured,
        tags: [item.role],
        metadata: { providers: item.providers },
      });
    }
    this.logger.log('Homepage services are ready to be featured.');
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

  async update(id: string, dto: RawPayloadDto, authorization?: string) {
    await this.assertOwner(id, authorization);
    const changes = { ...(dto.payload ?? {}) };
    OWNER_FIELDS.forEach((field) => delete changes[field]);
    return this.repository.updateOne({ _id: id }, { $set: changes });
  }

  async remove(id: string, authorization?: string) {
    const existing = await this.assertOwner(id, authorization);
    const result = await this.repository.deleteOne({ _id: id });
    (existing.images ?? []).forEach((url) => void this.storage.deleteByUrl(url));
    return result;
  }

  private async assertOwner(id: string, authorization?: string) {
    const user = await this.auth.requireUser(authorization);
    const service = await this.repository.findOne({ _id: id });
    if (!service) throw new NotFoundException('Service not found.');
    const isOwner = service.providerUserId?.toString() === user._id.toString();
    if (!isOwner && !this.auth.isAdminUser(user)) {
      throw new ForbiddenException('You can only change your own services.');
    }
    return service;
  }
}
