import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { WalletTransactionDocument } from '../schemas/wallet-transaction.schema';
import { CreateWalletTransactionDto } from '../dto/create-wallet-transaction.dto';
import { UpdateWalletTransactionDto } from '../dto/update-wallet-transaction.dto';
import { WalletTransactionRepository } from '../repositories/wallet-transaction.repository';

@Injectable()
export class WalletTransactionService {
  constructor(private readonly repository: WalletTransactionRepository) {}

  create(_dto: CreateWalletTransactionDto): never {
    throw new MethodNotAllowedException('WalletTransaction records are system-managed.');
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(_id: string, _dto: UpdateWalletTransactionDto): never {
    throw new MethodNotAllowedException('WalletTransaction records are append-only.');
  }

  remove(_id: string): never {
    throw new MethodNotAllowedException('WalletTransaction records cannot be deleted.');
  }
}