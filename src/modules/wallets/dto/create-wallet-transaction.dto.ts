import { IsObject, IsOptional } from 'class-validator';

export class CreateWalletTransactionDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}