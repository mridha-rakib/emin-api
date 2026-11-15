import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ReviewDocument } from '../schemas/review.schema';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewRepository } from '../repositories/review.repository';

@Injectable()
export class ReviewService {
  constructor(private readonly repository: ReviewRepository) {}

  create(dto: CreateReviewDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<ReviewDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateReviewDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }
}