import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Category, CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CategoryRepository extends BaseRepository<CategoryDocument> {
  constructor(@InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>) {
    super(categoryModel);
  }

  findFeatured() {
    return this.categoryModel
      .find({ featured: true, status: 'ACTIVE', parentId: null })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }
}