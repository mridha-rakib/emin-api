import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { MineTicketsQueryDto } from '../dto/mine-tickets-query.dto';
import { OpenHelpTicketDto } from '../dto/open-help-ticket.dto';
import { ReplySupportMessageDto } from '../dto/reply-support-message.dto';
import { UpdateSupportTicketDto } from '../dto/update-support-ticket.dto';
import { SupportTicketService } from '../services/support-ticket.service';

@Controller('support-tickets')
export class SupportTicketController {
  constructor(private readonly service: SupportTicketService) {}

  @Post('help')
  openHelp(@Body() dto: OpenHelpTicketDto) {
    return this.service.openHelp(dto);
  }

  @Get('mine')
  findMine(@Query() query: MineTicketsQueryDto) {
    return this.service.findMine(query.userId);
  }

  @Post(':id/messages')
  reply(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: ReplySupportMessageDto) {
    return this.service.reply(id, dto);
  }

  @Post()
  create(@Body() dto: CreateSupportTicketDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateSupportTicketDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}