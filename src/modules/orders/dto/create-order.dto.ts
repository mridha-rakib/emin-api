import { IsObject, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}