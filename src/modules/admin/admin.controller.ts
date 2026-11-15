import { Body, Controller, Get, Headers, Param, Patch, Query } from '@nestjs/common';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('overview')
  overview(@Headers('authorization') authorization?: string): Promise<Record<string, unknown>> {
    return this.service.overview(authorization);
  }

  @Get('earnings')
  earnings(@Headers('authorization') authorization?: string): Promise<Record<string, unknown>> {
    return this.service.earnings(authorization);
  }

  @Get('people')
  people(
    @Headers('authorization') authorization?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<Record<string, unknown>> {
    const kind = type === 'customers' || type === 'providers' ? type : 'all';
    return this.service.people(authorization, kind, search, status);
  }

  @Get('people/:id')
  person(@Param('id', ParseObjectIdPipe) id: string, @Headers('authorization') authorization?: string): Promise<Record<string, unknown>> {
    return this.service.person(authorization, id);
  }

  @Patch('people/:id/status')
  setStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('status') status: string,
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.setStatus(authorization, id, status);
  }

  @Get('admins')
  admins(@Headers('authorization') authorization?: string): Promise<Record<string, unknown>> {
    return this.service.admins(authorization);
  }
}
