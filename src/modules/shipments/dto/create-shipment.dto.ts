import { IsObject, IsOptional } from 'class-validator';

export class CreateShipmentDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}