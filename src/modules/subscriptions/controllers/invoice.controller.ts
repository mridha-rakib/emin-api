import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { InvoiceService } from '../services/invoice.service';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Post()
  create(@Body() dto: RawPayloadDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  
  @Get(':id/pdf')
  async download(@Param('id', ParseObjectIdPipe) id: string) {
    const file = await this.service.download(id);
    return new StreamableFile(file.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${file.filename}"`,
    });
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