import { Controller, Get } from '@nestjs/common';

@Controller()
export class ReportsController {
  @Get('dashboard/summary')
  dashboardSummary() {
    return { users: 0, providers: 0, bookings: 0, revenue: '0' };
  }

  @Get('reports/summary')
  reportsSummary() {
    return { sales: [], users: [], products: [], bookings: [] };
  }

  @Get('earnings/summary')
  earningsSummary() {
    return { totalRevenue: '0', commission: '0', payouts: '0', chart: [] };
  }
}