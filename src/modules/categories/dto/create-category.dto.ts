import { IsObject, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}