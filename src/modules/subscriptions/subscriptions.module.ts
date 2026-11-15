import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SubscriptionPlan, SubscriptionPlanSchema } from './schemas/subscription-plan.schema';
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository';
import { SubscriptionPlanService } from './services/subscription-plan.service';
import { SubscriptionPlanController } from './controllers/subscription-plan.controller';
import { UserSubscription, UserSubscriptionSchema } from './schemas/user-subscription.schema';
import { UserSubscriptionRepository } from './repositories/user-subscription.repository';
import { UserSubscriptionService } from './services/user-subscription.service';
import { UserSubscriptionController } from './controllers/user-subscription.controller';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { InvoiceRepository } from './repositories/invoice.repository';
import { InvoiceService } from './services/invoice.service';
import { InvoiceController } from './controllers/invoice.controller';

@Module({
  imports: [AuthModule, MongooseModule.forFeature([{ name: SubscriptionPlan.name, schema: SubscriptionPlanSchema }, { name: UserSubscription.name, schema: UserSubscriptionSchema }, { name: Invoice.name, schema: InvoiceSchema }, { name: User.name, schema: UserSchema }])],
  controllers: [SubscriptionPlanController, UserSubscriptionController, InvoiceController],
  providers: [SubscriptionPlanRepository, SubscriptionPlanService, UserSubscriptionRepository, UserSubscriptionService, InvoiceRepository, InvoiceService],
  exports: [MongooseModule, SubscriptionPlanRepository, SubscriptionPlanService, UserSubscriptionRepository, UserSubscriptionService, InvoiceRepository, InvoiceService],
})
export class SubscriptionsModule {}