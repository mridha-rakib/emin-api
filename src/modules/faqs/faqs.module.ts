import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from './schemas/faq.schema';
import { FaqRepository } from './repositories/faq.repository';
import { FaqService } from './services/faq.service';
import { FaqController } from './controllers/faq.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Faq.name, schema: FaqSchema }])],
  controllers: [FaqController],
  providers: [FaqRepository, FaqService],
  exports: [MongooseModule, FaqRepository, FaqService],
})
export class FaqsModule {}