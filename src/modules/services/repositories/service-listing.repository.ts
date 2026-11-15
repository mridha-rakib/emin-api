import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { ServiceListing, ServiceListingDocument } from '../schemas/service-listing.schema';

@Injectable()
export class ServiceListingRepository extends BaseRepository<ServiceListingDocument> {
  constructor(@InjectModel(ServiceListing.name) private readonly serviceListingModel: Model<ServiceListingDocument>) {
    super(serviceListingModel);
  }

  findFeatured() {
    return this.serviceListingModel.find({ featured: true, status: 'ACTIVE' }).sort({ createdAt: 1 }).limit(8).exec();
  }
}
