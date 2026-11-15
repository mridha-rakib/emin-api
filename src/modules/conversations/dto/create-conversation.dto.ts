import { IsObject, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}