import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { NewsletterSubscriber, NewsletterSubscriberDocument } from './schemas/newsletter-subscriber.schema';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);

@Injectable()
export class NewsletterService {
  constructor(
    @InjectModel(NewsletterSubscriber.name) private readonly subscribers: Model<NewsletterSubscriberDocument>,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.subscribers.findOne({ email }).exec();
    if (!existing) await this.subscribers.create({ email });

    const safeEmail = escapeHtml(email);
    await this.auth.sendEmail(
      email,
      'You are subscribed to Odaboo',
      `Thanks for subscribing to Odaboo. Offers and service updates will be sent to ${email}.`,
      `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;max-width:560px"><h2 style="margin:0 0 12px">You are subscribed</h2><p>Thanks for joining Odaboo. Offers and service updates will be sent to <strong>${safeEmail}</strong>.</p><p style="color:#475569">If you did not request this, you can ignore this email.</p></div>`,
    );

    const inbox = (this.config.get<string>('SMTP_USER') ?? '').trim().toLowerCase();
    if (inbox.includes('@') && !inbox.endsWith('.local') && inbox !== email) {
      await this.auth.sendEmail(
        inbox,
        'New Odaboo newsletter subscriber',
        `${email} subscribed to the Odaboo newsletter.`,
        `<p><strong>${safeEmail}</strong> subscribed to the Odaboo newsletter.</p>`,
      );
    }

    return { email, subscribed: true, already: Boolean(existing) };
  }
}
