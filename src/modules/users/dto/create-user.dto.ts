import { IsObject, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}