import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiNegotiationLog, AiNegotiationLogSchema } from './schemas/ai-negotiation-log.schema';
import { AiNegotiationLogRepository } from './repositories/ai-negotiation-log.repository';
import { AiNegotiationLogService } from './services/ai-negotiation-log.service';
import { AiNegotiationLogController } from './controllers/ai-negotiation-log.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: AiNegotiationLog.name, schema: AiNegotiationLogSchema }])],
  controllers: [AiNegotiationLogController],
  providers: [AiNegotiationLogRepository, AiNegotiationLogService],
  exports: [MongooseModule, AiNegotiationLogRepository, AiNegotiationLogService],
})
export class AiModule {}