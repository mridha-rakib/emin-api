import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditLogDocument } from '../schemas/audit-log.schema';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { UpdateAuditLogDto } from '../dto/update-audit-log.dto';
import { AuditLogRepository } from '../repositories/audit-log.repository';

@Injectable()
export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  create(_dto: CreateAuditLogDto): never {
    throw new MethodNotAllowedException('AuditLog records are system-managed.');
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(_id: string, _dto: UpdateAuditLogDto): never {
    throw new MethodNotAllowedException('AuditLog records are append-only.');
  }

  remove(_id: string): never {
    throw new MethodNotAllowedException('AuditLog records cannot be deleted.');
  }
}