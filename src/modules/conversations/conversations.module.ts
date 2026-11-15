import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ConversationRepository } from './repositories/conversation.repository';
import { ConversationService } from './services/conversation.service';
import { ConversationController } from './controllers/conversation.controller';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessageRepository } from './repositories/message.repository';
import { MessageService } from './services/message.service';
import { MessageController } from './controllers/message.controller';
import { ConversationGateway } from './gateways/conversation.gateway';

@Module({
  imports: [MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }, { name: Message.name, schema: MessageSchema }])],
  controllers: [ConversationController, MessageController],
  providers: [ConversationRepository, ConversationService, MessageRepository, MessageService, ConversationGateway],
  exports: [MongooseModule, ConversationRepository, ConversationService, MessageRepository, MessageService, ConversationGateway],
})
export class ConversationsModule {}
