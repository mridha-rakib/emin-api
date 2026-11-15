import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Shipment, ShipmentSchema } from './schemas/shipment.schema';
import { ShipmentRepository } from './repositories/shipment.repository';
import { ShipmentService } from './services/shipment.service';
import { ShipmentController } from './controllers/shipment.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Shipment.name, schema: ShipmentSchema }])],
  controllers: [ShipmentController],
  providers: [ShipmentRepository, ShipmentService],
  exports: [MongooseModule, ShipmentRepository, ShipmentService],
})
export class ShipmentsModule {}