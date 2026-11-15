import { IsObject, IsOptional } from 'class-validator';

export class CreatePageDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}