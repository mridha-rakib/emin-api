import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { NewsletterSubscriber, NewsletterSubscriberSchema } from './schemas/newsletter-subscriber.schema';

@Module({
  imports: [AuthModule, MongooseModule.forFeature([{ name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema }])],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
