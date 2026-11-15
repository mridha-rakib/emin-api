import { Body, Controller, Get, Headers, Post, Query, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { CheckoutDto } from '../dto/checkout.dto';
import { StripeCheckoutService } from '../services/stripe-checkout.service';

@Controller('payments')
export class StripeCheckoutController {
  constructor(private readonly checkout: StripeCheckoutService) {}

  @Post('checkout')
  create(@Body() dto: CheckoutDto, @Headers('authorization') authorization?: string) {
    return this.checkout.create(authorization, dto);
  }

  @Get('checkout/confirm')
  confirm(@Query('session_id') sessionId: string) {
    return this.checkout.confirm(sessionId);
  }

  @Post('stripe/webhook')
  webhook(@Req() request: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string) {
    return this.checkout.handleWebhook(request.rawBody, signature);
  }
}
