import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PageStatus } from '../../../common/enums/domain.enums';
import { PageDocument } from '../schemas/page.schema';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { PageRepository } from '../repositories/page.repository';

@Injectable()
export class PageService {
  constructor(private readonly repository: PageRepository) {}

  create(dto: CreatePageDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<PageDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  async findPublishedBySlug(slug: string) {
    const page = await this.repository.findOne({ slug, status: PageStatus.PUBLISHED });
    if (!page) throw new NotFoundException('Page not found.');
    return page;
  }

  update(id: string, dto: UpdatePageDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}