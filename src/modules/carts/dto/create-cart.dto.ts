import { IsObject, IsOptional } from 'class-validator';

export class CreateCartDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}