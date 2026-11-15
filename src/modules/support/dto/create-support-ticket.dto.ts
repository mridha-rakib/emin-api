import { IsObject, IsOptional } from 'class-validator';

export class CreateSupportTicketDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}