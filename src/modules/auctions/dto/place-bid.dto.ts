import { IsMongoId, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
export class PlaceBidDto {
  @IsOptional()
  @IsMongoId() auctionId: string;
  @IsMongoId() bidderId: string;
  @IsString() @IsNotEmpty() @Matches(/^\d+(\.\d+)?$/) amount: string;
}
