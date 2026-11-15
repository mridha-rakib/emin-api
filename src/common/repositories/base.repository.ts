import { ClientSession, FilterQuery, Model, ProjectionType, QueryOptions, UpdateQuery } from 'mongoose';

export interface PageOptions {
  page?: number;
  limit?: number;
}

export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  createOne(data: Partial<T>, session?: ClientSession) {
    return this.model.create([data], { session }).then((docs) => docs[0]);
  }

  findOne(filter: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>) {
    return this.model.findOne(filter, projection, options).exec();
  }

  findMany(filter: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>) {
    return this.model.find(filter, projection, options).exec();
  }

  async paginate(filter: FilterQuery<T>, options: PageOptions = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, session?: ClientSession) {
    return this.model.findOneAndUpdate(filter, update, { new: true, session }).exec();
  }

  upsertOne(filter: FilterQuery<T>, update: UpdateQuery<T>, session?: ClientSession) {
    return this.model.findOneAndUpdate(filter, update, { new: true, upsert: true, setDefaultsOnInsert: true, session }).exec();
  }

  deleteOne(filter: FilterQuery<T>, session?: ClientSession) {
    return this.model.deleteOne(filter, { session }).exec();
  }
}