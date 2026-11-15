import { IsObject, IsOptional } from 'class-validator';

export class CreateBidDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}