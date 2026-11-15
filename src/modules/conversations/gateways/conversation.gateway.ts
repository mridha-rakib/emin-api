import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../services/message.service';

type SendMessagePayload = {
  conversationId?: string;
  senderId?: string;
  text?: string;
};

type CallSignalPayload = {
  type?: string;
  conversationId?: string;
  fromUserId?: string;
  toUserId?: string;
  kind?: string;
  sdp?: unknown;
  candidate?: unknown;
};

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? true,
    credentials: true,
  },
})
export class ConversationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messageService: MessageService) {}

  @SubscribeMessage('joinSupportDesk')
  joinSupportDesk(@ConnectedSocket() client: Socket) {
    client.join('support:desk');
    return { ok: true };
  }

  publishSupport(event: 'supportTicket' | 'supportMessage', userId: string | undefined, payload: unknown) {
    if (!this.server) return;
    this.server.to('support:desk').emit(event, payload);
    if (userId) this.server.to(this.userRoom(userId)).emit(event, payload);
  }

  @SubscribeMessage('joinUser')
  joinUser(@MessageBody() payload: { userId?: string }, @ConnectedSocket() client: Socket) {
    const userId = payload?.userId?.trim();
    if (!userId) return { ok: false, message: 'userId is required' };
    client.join(this.userRoom(userId));
    return { ok: true, userId };
  }

  @SubscribeMessage('callSignal')
  callSignal(@MessageBody() payload: CallSignalPayload) {
    const toUserId = payload?.toUserId?.trim();
    const fromUserId = payload?.fromUserId?.trim();
    const conversationId = payload?.conversationId?.trim();
    const type = payload?.type?.trim();
    if (!toUserId || !fromUserId || !conversationId || !type) {
      return { ok: false, message: 'A call signal needs a sender, recipient, conversation, and type.' };
    }
    this.server.to(this.userRoom(toUserId)).emit('callSignal', {
      type,
      conversationId,
      fromUserId,
      toUserId,
      kind: payload.kind,
      sdp: payload.sdp,
      candidate: payload.candidate,
    });
    return { ok: true };
  }

  @SubscribeMessage('joinConversation')
  joinConversation(
    @MessageBody() payload: { conversationId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.conversationId) return { ok: false, message: 'conversationId is required' };
    client.join(this.roomName(payload.conversationId));
    return { ok: true, conversationId: payload.conversationId };
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(@MessageBody() payload: SendMessagePayload) {
    const conversationId = payload?.conversationId?.trim();
    const senderId = payload?.senderId?.trim();
    const text = payload?.text?.trim();
    if (!conversationId || !senderId || !text) {
      return { ok: false, message: 'conversationId, senderId and text are required' };
    }

    const message = await this.messageService.create({
      payload: {
        conversationId,
        senderId,
        text: text.slice(0, 2000),
        attachments: [],
      },
    });

    this.server.to(this.roomName(conversationId)).emit('messageCreated', message);
    return { ok: true, message };
  }

  private roomName(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }
}
