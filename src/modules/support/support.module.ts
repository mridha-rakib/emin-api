import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { SupportTicket, SupportTicketSchema } from './schemas/support-ticket.schema';
import { SupportTicketRepository } from './repositories/support-ticket.repository';
import { SupportTicketService } from './services/support-ticket.service';
import { SupportTicketController } from './controllers/support-ticket.controller';

@Module({
  imports: [
    AuthModule,
    ConversationsModule,
    MongooseModule.forFeature([{ name: SupportTicket.name, schema: SupportTicketSchema }]),
  ],
  controllers: [SupportTicketController],
  providers: [SupportTicketRepository, SupportTicketService],
  exports: [MongooseModule, SupportTicketRepository, SupportTicketService],
})
export class SupportModule {}