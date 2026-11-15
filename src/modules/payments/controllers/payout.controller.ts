import { Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { PayoutService } from '../services/payout.service';

@Controller('payout-methods')
export class PayoutMethodController {
  constructor(private readonly payouts: PayoutService) {}

  @Get('me')
  mine(@Headers('authorization') authorization?: string) {
    return this.payouts.mine(authorization);
  }

  @Post('setup')
  setup(@Headers('authorization') authorization: string | undefined, @Req() request: Request) {
    return this.payouts.beginSetup(authorization, request.ip);
  }

  @Get('confirm')
  confirm(@Headers('authorization') authorization: string | undefined, @Query('session_id') sessionId: string) {
    return this.payouts.confirmSetup(authorization, sessionId);
  }
}

@Controller('payouts')
export class HeldPayoutController {
  constructor(private readonly payouts: PayoutService) {}

  @Post(':id/release')
  release(@Param('id', ParseObjectIdPipe) id: string, @Headers('authorization') authorization?: string) {
    return this.payouts.releaseById(authorization, id);
  }
}

@Controller('admin/payouts')
export class AdminPayoutController {
  constructor(private readonly payouts: PayoutService) {}

  @Get()
  list(@Headers('authorization') authorization?: string) {
    return this.payouts.adminList(authorization);
  }
}
