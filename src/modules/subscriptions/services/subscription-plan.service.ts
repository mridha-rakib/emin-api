import { Injectable, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RawPayloadDto } from '../../../common/dto/raw-payload.dto';
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository';

const money = (amount: number) => Types.Decimal128.fromString(amount.toFixed(2));

const DISPLAYED_PLANS = [
  {
    name: 'Starter',
    slug: 'starter',
    monthlyPrice: money(0),
    yearlyPrice: money(0),
    currency: 'CHF',
    description: 'Perfect for individuals just getting started.',
    features: ['Create 1 Service Profile', 'Basic Search Visibility', 'Community Access', 'Standard Support'],
    notIncluded: ['Verified Badge', 'Featured Placement', 'Advanced Analytics'],
    popular: false,
    active: true,
  },
  {
    name: 'Professional Pro',
    slug: 'professional-pro',
    monthlyPrice: money(29),
    yearlyPrice: money(290),
    currency: 'CHF',
    description: 'The ideal plan for growing service providers.',
    features: ['Create up to 5 Profiles', 'Priority Search Visibility', "Verified 'Pro' Badge", 'Featured Placement', 'Priority 24/7 Support', 'Client Analytics Dashboard'],
    notIncluded: [],
    popular: true,
    active: true,
  },
  {
    name: 'Enterprise Agency',
    slug: 'enterprise-agency',
    monthlyPrice: money(99),
    yearlyPrice: money(990),
    currency: 'CHF',
    description: 'For agencies and large businesses.',
    features: ['Unlimited Profiles', 'Top Search Placement', 'Dedicated Account Manager', 'Custom Branding', 'API Access', 'Advanced Team Management'],
    notIncluded: [],
    popular: false,
    active: true,
  },
];

@Injectable()
export class SubscriptionPlanService implements OnModuleInit {
  constructor(private readonly repository: SubscriptionPlanRepository) {}

  async onModuleInit() {
    for (const plan of DISPLAYED_PLANS) {
      const existing = await this.repository.findOne({ slug: plan.slug });
      if (!existing) {
        await this.repository.createOne(plan);
      } else if (!existing.features?.length) {
        await this.repository.updateOne(
          { _id: existing._id },
          { $set: { features: plan.features, notIncluded: plan.notIncluded, description: plan.description, popular: plan.popular, currency: 'CHF' } },
        );
      }
    }
  }

  create(dto: RawPayloadDto) {
    return this.repository.createOne(dto.payload ?? {});
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: RawPayloadDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? {} });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }

  
}