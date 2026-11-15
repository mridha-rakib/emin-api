import { IsObject, IsOptional } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}