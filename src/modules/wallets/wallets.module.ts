import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { WalletRepository } from './repositories/wallet.repository';
import { WalletService } from './services/wallet.service';
import { WalletController } from './controllers/wallet.controller';
import { WalletTransaction, WalletTransactionSchema } from './schemas/wallet-transaction.schema';
import { WalletTransactionRepository } from './repositories/wallet-transaction.repository';
import { WalletTransactionService } from './services/wallet-transaction.service';
import { WalletTransactionController } from './controllers/wallet-transaction.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }, { name: WalletTransaction.name, schema: WalletTransactionSchema }])],
  controllers: [WalletController, WalletTransactionController],
  providers: [WalletRepository, WalletService, WalletTransactionRepository, WalletTransactionService],
  exports: [MongooseModule, WalletRepository, WalletService, WalletTransactionRepository, WalletTransactionService],
})
export class WalletsModule {}