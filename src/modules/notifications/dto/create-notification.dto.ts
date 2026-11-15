import { IsObject, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}