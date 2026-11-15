import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { CategoryRepository } from './repositories/category.repository';
import { CategoryService } from './services/category.service';
import { CategoryController } from './controllers/category.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])],
  controllers: [CategoryController],
  providers: [CategoryRepository, CategoryService],
  exports: [MongooseModule, CategoryRepository, CategoryService],
})
export class CategoriesModule {}