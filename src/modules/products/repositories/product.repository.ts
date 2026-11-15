import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductRepository extends BaseRepository<ProductDocument> {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<ProductDocument>) {
    super(productModel);
  }
}