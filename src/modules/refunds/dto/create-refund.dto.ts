import { IsObject, IsOptional } from 'class-validator';

export class CreateRefundDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}