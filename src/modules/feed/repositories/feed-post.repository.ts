import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { BaseRepository, PageOptions } from '../../../common/repositories/base.repository';
import { FeedPost, FeedPostDocument } from '../schemas/feed-post.schema';

const AUTHOR_FIELDS = 'firstName lastName avatar profession';

@Injectable()
export class FeedPostRepository extends BaseRepository<FeedPostDocument> {
  constructor(@InjectModel(FeedPost.name) model: Model<FeedPostDocument>) {
    super(model);
  }

  async paginateWithAuthors(filter: FilterQuery<FeedPostDocument>, options: PageOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', AUTHOR_FIELDS).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  findByIdWithAuthor(id: string) {
    return this.model.findById(id).populate('userId', AUTHOR_FIELDS).exec();
  }

  /** Atomically adds or removes the actor and derives the counter from the set, so it can never drift or go negative. */
  toggleLike(id: string, actor: string) {
    const likedBy = { $ifNull: ['$likedBy', []] };
    return this.model.updateOne({ _id: id }, [
      {
        $set: {
          likedBy: {
            $cond: [
              { $in: [actor, likedBy] },
              { $setDifference: [likedBy, [actor]] },
              { $concatArrays: [likedBy, [actor]] },
            ],
          },
        },
      },
      { $set: { likes: { $size: '$likedBy' } } },
    ]).exec();
  }

  recountAll() {
    return this.model.updateMany({}, [
      {
        $set: {
          likes: { $size: { $ifNull: ['$likedBy', []] } },
          comments: { $size: { $ifNull: ['$commentItems', []] } },
        },
      },
    ]).exec();
  }
}
