import { IsMongoId } from 'class-validator';

export class MineTicketsQueryDto {
  @IsMongoId()
  userId: string;
}
