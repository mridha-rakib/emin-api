import { IsObject, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}