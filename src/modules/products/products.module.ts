import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { SellerProfile, SellerProfileSchema } from '../sellers/schemas/seller-profile.schema';
import { ProductRepository } from './repositories/product.repository';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Product.name, schema: ProductSchema },
    { name: Category.name, schema: CategorySchema },
    { name: SellerProfile.name, schema: SellerProfileSchema },
  ]), AuthModule],
  controllers: [ProductController],
  providers: [ProductRepository, ProductService],
  exports: [MongooseModule, ProductRepository, ProductService],
})
export class ProductsModule {}
