import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './schemas/cart.schema';
import { CartRepository } from './repositories/cart.repository';
import { CartService } from './services/cart.service';
import { CartController } from './controllers/cart.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }])],
  controllers: [CartController],
  providers: [CartRepository, CartService],
  exports: [MongooseModule, CartRepository, CartService],
})
export class CartsModule {}