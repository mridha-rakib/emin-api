import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class CheckoutShippingDto {
  @IsString() @MaxLength(120) fullName: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsString() @MaxLength(40) phone: string;
  @IsString() @MaxLength(180) addressLine1: string;
  @IsString() @MaxLength(80) city: string;
  @IsString() @MaxLength(20) postalCode: string;
  @IsOptional() @IsString() @MaxLength(80) country?: string;
}

export class CheckoutBookingDto {
  @IsString() @MaxLength(120) customerName: string;
  @IsOptional() @IsString() @MaxLength(40) customerPhone?: string;
  @IsString() date: string;
  @IsString() @MaxLength(40) time: string;
  @IsString() @MaxLength(180) location: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class CheckoutDto {
  @IsIn(['SUBSCRIPTION', 'MARKETPLACE', 'SERVICE'])
  purpose: 'SUBSCRIPTION' | 'MARKETPLACE' | 'SERVICE';

  @IsOptional() @IsString() planId?: string;
  @IsOptional() @IsIn(['monthly', 'yearly']) billingCycle?: 'monthly' | 'yearly';
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() serviceId?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) amount?: number;
  @IsOptional() @ValidateNested() @Type(() => CheckoutShippingDto) shipping?: CheckoutShippingDto;
  @IsOptional() @ValidateNested() @Type(() => CheckoutBookingDto) booking?: CheckoutBookingDto;
}
