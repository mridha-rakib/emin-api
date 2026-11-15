import { IsObject, IsOptional } from 'class-validator';

export class CreateAutoBidDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}