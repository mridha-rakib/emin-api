import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ServiceListing, ServiceListingSchema } from '../services/schemas/service-listing.schema';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriptionPlan, SubscriptionPlanSchema } from '../subscriptions/schemas/subscription-plan.schema';
import { UserSubscription, UserSubscriptionSchema } from '../subscriptions/schemas/user-subscription.schema';
import { PaymentController } from './controllers/payment.controller';
import { StripeCheckoutController } from './controllers/stripe-checkout.controller';
import { PaymentRepository } from './repositories/payment.repository';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { StripeCheckout, StripeCheckoutSchema } from './schemas/stripe-checkout.schema';
import { PayoutMethod, PayoutMethodSchema } from './schemas/payout-method.schema';
import { HeldPayout, HeldPayoutSchema } from './schemas/held-payout.schema';
import { PaymentService } from './services/payment.service';
import { StripeCheckoutService } from './services/stripe-checkout.service';
import { PayoutService } from './services/payout.service';
import { AdminPayoutController, HeldPayoutController, PayoutMethodController } from './controllers/payout.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: StripeCheckout.name, schema: StripeCheckoutSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ServiceListing.name, schema: ServiceListingSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: PayoutMethod.name, schema: PayoutMethodSchema },
      { name: HeldPayout.name, schema: HeldPayoutSchema },
    ]),
  ],
  controllers: [StripeCheckoutController, PaymentController, PayoutMethodController, HeldPayoutController, AdminPayoutController],
  providers: [PaymentRepository, PaymentService, StripeCheckoutService, PayoutService],
  exports: [MongooseModule, PaymentRepository, PaymentService, PayoutService],
})
export class PaymentsModule {}