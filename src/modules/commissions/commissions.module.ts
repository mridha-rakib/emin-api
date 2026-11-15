import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Commission, CommissionSchema } from './schemas/commission.schema';
import { CommissionRepository } from './repositories/commission.repository';
import { CommissionService } from './services/commission.service';
import { CommissionController } from './controllers/commission.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Commission.name, schema: CommissionSchema }])],
  controllers: [CommissionController],
  providers: [CommissionRepository, CommissionService],
  exports: [MongooseModule, CommissionRepository, CommissionService],
})
export class CommissionsModule {}