import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdminIdentityVerificationController, IdentityVerificationController } from './identity-verification.controller';
import { IdentityVerificationService } from './identity-verification.service';
import { IdentityVerification, IdentityVerificationSchema } from './schemas/identity-verification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IdentityVerification.name, schema: IdentityVerificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [IdentityVerificationController, AdminIdentityVerificationController],
  providers: [IdentityVerificationService],
})
export class IdentityVerificationModule {}
