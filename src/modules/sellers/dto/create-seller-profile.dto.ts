import { IsObject, IsOptional } from 'class-validator';

export class CreateSellerProfileDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}