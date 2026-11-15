import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { WalletDocument } from '../schemas/wallet.schema';
import { CreateWalletDto } from '../dto/create-wallet.dto';
import { UpdateWalletDto } from '../dto/update-wallet.dto';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class WalletService {
  constructor(private readonly repository: WalletRepository) {}

  create(dto: CreateWalletDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<WalletDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateWalletDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}