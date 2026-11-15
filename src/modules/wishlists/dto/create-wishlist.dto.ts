import { IsObject, IsOptional } from 'class-validator';

export class CreateWishlistDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}