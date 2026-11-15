import { IsObject, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}