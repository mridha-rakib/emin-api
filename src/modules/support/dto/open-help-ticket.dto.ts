import { IsEmail, IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OpenHelpTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;
}
