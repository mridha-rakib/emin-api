import { IsObject, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}