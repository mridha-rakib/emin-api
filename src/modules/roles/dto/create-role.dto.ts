import { IsObject, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}