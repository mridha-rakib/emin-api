import { IsObject, IsOptional } from 'class-validator';

export class CreateCouponDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}