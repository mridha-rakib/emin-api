import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { PlatformCustomizationService } from '../services/platform-customization.service';

@Controller('platform-customization')
export class PlatformCustomizationController {
  constructor(private readonly service: PlatformCustomizationService) {}

  @Post()
  create(@Body() dto: RawPayloadDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('default')
  findDefault() {
    return this.service.findDefault();
  }

  @Patch('default')
  upsertDefault(@Body() dto: RawPayloadDto) {
    return this.service.upsertDefault(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: RawPayloadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}