import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { OrderDocument } from '../schemas/order.schema';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrderRepository } from '../repositories/order.repository';
import { AuthService } from '../../auth/auth.service';
import { PayoutService } from '../../payments/services/payout.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly auth: AuthService,
    private readonly payouts: PayoutService,
  ) {}

  async create(dto: CreateOrderDto, authorization?: string) {
    const buyer = await this.auth.requireVerifiedBuyer(authorization);
    const payload = { ...(dto.payload ?? (dto as unknown as Partial<OrderDocument>)) } as Partial<OrderDocument>;
    return this.repository.createOne({ ...payload, buyerId: buyer._id } as Partial<OrderDocument>);
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  async update(id: string, dto: UpdateOrderDto) {
    const changes = (dto.payload ?? dto) as { orderStatus?: string };
    const order = await this.repository.updateOne({ _id: id }, { $set: changes });
    const status = String(changes.orderStatus || '').toUpperCase();
    if (!order || (status !== 'DELIVERED' && status !== 'COMPLETED')) return order;
    const payout = await this.payouts.releaseSource('ORDER', order._id.toString());
    return { ...order.toObject(), payout };
  }

  remove(_id: string): never {
    throw new MethodNotAllowedException('Order records cannot be deleted.');
  }
}