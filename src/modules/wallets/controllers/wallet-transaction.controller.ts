import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { CreateWalletTransactionDto } from '../dto/create-wallet-transaction.dto';
import { UpdateWalletTransactionDto } from '../dto/update-wallet-transaction.dto';
import { WalletTransactionService } from '../services/wallet-transaction.service';

@Controller('wallet-transactions')
export class WalletTransactionController {
  constructor(private readonly service: WalletTransactionService) {}

  @Post()
  create(@Body() dto: CreateWalletTransactionDto) {
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
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateWalletTransactionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}