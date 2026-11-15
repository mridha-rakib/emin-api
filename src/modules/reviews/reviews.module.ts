import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewRepository } from './repositories/review.repository';
import { ReviewService } from './services/review.service';
import { ReviewController } from './controllers/review.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }])],
  controllers: [ReviewController],
  providers: [ReviewRepository, ReviewService],
  exports: [MongooseModule, ReviewRepository, ReviewService],
})
export class ReviewsModule {}