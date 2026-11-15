import { IsObject, IsOptional } from 'class-validator';

export class CreateAuctionDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}