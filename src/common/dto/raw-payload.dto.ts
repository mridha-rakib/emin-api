import { IsObject, IsOptional } from 'class-validator';

export class RawPayloadDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}