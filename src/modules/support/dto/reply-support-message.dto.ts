import { IsIn, IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReplySupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @IsIn(['user', 'admin'])
  senderRole: 'user' | 'admin';

  @IsOptional()
  @IsMongoId()
  senderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  senderName?: string;
}
