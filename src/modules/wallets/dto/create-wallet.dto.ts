import { IsObject, IsOptional } from 'class-validator';

export class CreateWalletDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}