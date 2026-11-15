import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { WishlistRepository } from './repositories/wishlist.repository';
import { WishlistService } from './services/wishlist.service';
import { WishlistController } from './controllers/wishlist.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Wishlist.name, schema: WishlistSchema }])],
  controllers: [WishlistController],
  providers: [WishlistRepository, WishlistService],
  exports: [MongooseModule, WishlistRepository, WishlistService],
})
export class WishlistsModule {}