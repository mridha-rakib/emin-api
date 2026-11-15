import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { ServiceListingService } from '../services/service-listing.service';

@Controller('services')
export class ServiceListingController {
  constructor(private readonly service: ServiceListingService) {}

  @Post()
  create(@Body() dto: RawPayloadDto, @Headers('authorization') authorization?: string) {
    return this.service.create(dto, authorization);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('featured')
  findFeatured() {
    return this.service.findFeatured();
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: RawPayloadDto, @Headers('authorization') authorization?: string) {
    return this.service.update(id, dto, authorization);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string, @Headers('authorization') authorization?: string) {
    return this.service.remove(id, authorization);
  }
}
