import { IsObject, IsOptional } from 'class-validator';

export class CreateBannerDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}