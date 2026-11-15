import { IsDecimal, IsNotEmpty, IsString, Matches } from 'class-validator';
export class MoneyDto {
  @IsString()
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,18' })
  @Matches(/^\d+(\.\d+)?$/)
  amount: string;
}