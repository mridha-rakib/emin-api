import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { ParseObjectIdPipe } from '../../../common/pipes/parse-object-id.pipe';
import { FeedPostService } from '../services/feed-post.service';

@Controller('feed-posts')
export class FeedPostController {
  constructor(private readonly service: FeedPostService) {}

  @Post()
  create(@Body() dto: RawPayloadDto, @Headers('authorization') authorization?: string) {
    return this.service.create(dto, authorization);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Post(':id/reactions')
  toggleReaction(@Param('id', ParseObjectIdPipe) id: string, @Headers('authorization') authorization?: string) {
    return this.service.toggleReaction(id, authorization);
  }

  @Post(':id/comments')
  addComment(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: RawPayloadDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.addComment(id, dto, authorization);
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
