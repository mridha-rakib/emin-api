import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async create(dto: CreateUserDto) {
    return this.repository.createOne(await this.normalizePassword(dto.payload ?? (dto as unknown as Record<string, unknown>)));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.repository.updateOne({ _id: id }, { $set: await this.normalizePassword(dto.payload ?? (dto as unknown as Record<string, unknown>)) });
  }

  remove(id: string) {
    return this.repository.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
  }

  private async normalizePassword(data: Record<string, unknown>) {
    const normalized = { ...data };
    if (typeof normalized.password === 'string') {
      normalized.passwordHash = await bcrypt.hash(normalized.password, 12);
      delete normalized.password;
    }
    return normalized as Partial<UserDocument>;
  }
}
