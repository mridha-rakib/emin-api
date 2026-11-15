import { IsObject, IsOptional } from 'class-validator';

export class CreateCommissionDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}