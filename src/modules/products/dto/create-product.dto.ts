import { IsObject, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}