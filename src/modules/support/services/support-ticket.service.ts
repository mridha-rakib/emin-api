import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TicketPriority, TicketStatus } from '../../../common/enums/domain.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuthService } from '../../auth/auth.service';
import { ConversationGateway } from '../../conversations/gateways/conversation.gateway';
import { SupportTicketDocument } from '../schemas/support-ticket.schema';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { MineTicketsQueryDto } from '../dto/mine-tickets-query.dto';
import { OpenHelpTicketDto } from '../dto/open-help-ticket.dto';
import { ReplySupportMessageDto } from '../dto/reply-support-message.dto';
import { UpdateSupportTicketDto } from '../dto/update-support-ticket.dto';
import { SupportTicketRepository } from '../repositories/support-ticket.repository';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char);

@Injectable()
export class SupportTicketService {
  constructor(
    private readonly repository: SupportTicketRepository,
    private readonly authService: AuthService,
    private readonly gateway: ConversationGateway,
  ) {}

  create(dto: CreateSupportTicketDto) {
    return this.repository.createOne(dto.payload ?? (dto as unknown as Partial<SupportTicketDocument>));
  }

  findAll(query: PaginationQueryDto) {
    return this.repository.paginate({}, query);
  }

  findMine(userId: MineTicketsQueryDto['userId']) {
    return this.repository.findByUser(userId);
  }

  findOne(id: string) {
    return this.repository.findOne({ _id: id });
  }

  update(id: string, dto: UpdateSupportTicketDto) {
    return this.repository.updateOne({ _id: id }, { $set: dto.payload ?? dto });
  }

  remove(id: string) {
    return this.repository.deleteOne({ _id: id });
  }

  async openHelp(dto: OpenHelpTicketDto) {
    const userId = dto.userId?.trim();
    const email = dto.email?.trim().toLowerCase();
    if (!userId && !email) {
      throw new BadRequestException('Sign in, or enter an email address so support can reply.');
    }
    if (userId && !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Sign in again before sending a help message.');
    }

    const senderName = dto.name?.trim() || email || 'Customer';
    const ticket = await this.repository.createOne({
      ticketNumber: `SUP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
      ...(userId ? { userId: new Types.ObjectId(userId) } : {}),
      ...(!userId && email ? { guestEmail: email } : {}),
      subject: dto.subject.trim(),
      category: dto.category?.trim() || 'Help Center',
      priority: TicketPriority.NORMAL,
      status: TicketStatus.OPEN,
      messages: [
        {
          ...(userId ? { senderId: new Types.ObjectId(userId) } : {}),
          senderRole: userId ? 'user' : 'guest',
          senderName,
          message: dto.message.trim(),
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const plain = ticket.toObject();
    this.gateway.publishSupport('supportTicket', plain.userId ? String(plain.userId) : undefined, plain);
    return ticket;
  }

  async reply(id: string, dto: ReplySupportMessageDto) {
    const existing = await this.repository.findOne({ _id: id });
    if (!existing) throw new NotFoundException('Support ticket not found.');

    const ownerId = existing.userId ? String(existing.userId) : '';
    if (dto.senderRole === 'user' && (!ownerId || dto.senderId !== ownerId)) {
      throw new BadRequestException('This conversation belongs to another account.');
    }

    const senderName = dto.senderName?.trim() || (dto.senderRole === 'admin' ? 'Odaboo Support' : 'Customer');
    const status = dto.senderRole === 'admin' ? TicketStatus.WAITING_FOR_CUSTOMER : TicketStatus.IN_PROGRESS;
    const updated = await this.repository.appendMessage(
      id,
      {
        ...(dto.senderId && Types.ObjectId.isValid(dto.senderId) ? { senderId: dto.senderId } : {}),
        senderRole: dto.senderRole,
        senderName,
        message: dto.message.trim(),
        attachments: [],
        createdAt: new Date(),
      },
      status,
    );
    if (!updated) throw new NotFoundException('Support ticket not found.');

    const plain = updated.toObject();
    const last = plain.messages[plain.messages.length - 1];
    this.gateway.publishSupport('supportMessage', plain.userId ? String(plain.userId) : undefined, {
      ticketId: String(plain._id),
      userId: plain.userId ? String(plain.userId) : undefined,
      subject: plain.subject,
      status: plain.status,
      message: last,
    });

    const guestEmail = !plain.userId ? plain.guestEmail : undefined;
    let emailSent = false;
    if (dto.senderRole === 'admin' && guestEmail) {
      emailSent = await this.emailGuest(guestEmail, plain.ticketNumber, plain.subject, senderName, dto.message.trim());
    }

    return { ticket: updated, emailSent };
  }

  private async emailGuest(to: string, ticketNumber: string, subject: string, senderName: string, message: string) {
    const text = `${senderName} replied to your help request ${ticketNumber}:\n\n${message}`;
    const html = `<p><strong>${escapeHtml(senderName)}</strong> replied to your help request ${escapeHtml(ticketNumber)}.</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`;
    try {
      await this.authService.sendEmail(to, `Re: ${subject}`, text, html);
      return true;
    } catch {
      return false;
    }
  }
}
