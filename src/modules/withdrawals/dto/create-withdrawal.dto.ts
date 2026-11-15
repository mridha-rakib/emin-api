import { IsObject, IsOptional } from 'class-validator';

export class CreateWithdrawalDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}