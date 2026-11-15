import { IsObject, IsOptional } from 'class-validator';

export class CreateSettingDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}