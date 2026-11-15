import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsResult {
  delivered: boolean;
  /** Only set outside production when no SMS provider is configured, so the flow can be tested locally. */
  devCode?: string;
}

/**
 * Sends SMS through Twilio's REST API when TWILIO_* credentials are configured.
 * Without credentials, development logs the message instead and production refuses to send.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly accountSid?: string;
  private readonly authToken?: string;
  private readonly from?: string;
  private readonly messagingServiceSid?: string;
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    this.accountSid = config.get<string>('TWILIO_ACCOUNT_SID')?.trim() || undefined;
    this.authToken = config.get<string>('TWILIO_AUTH_TOKEN')?.trim() || undefined;
    this.from = config.get<string>('TWILIO_FROM')?.trim() || undefined;
    this.messagingServiceSid = config.get<string>('TWILIO_MESSAGING_SERVICE_SID')?.trim() || undefined;
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
  }

  get isConfigured() {
    return Boolean(this.accountSid && this.authToken && (this.from || this.messagingServiceSid));
  }

  async sendVerificationCode(to: string, code: string): Promise<SmsResult> {
    const body = `Your Odaboo verification code is ${code}. It expires in 10 minutes. Never share this code.`;

    if (!this.isConfigured) {
      if (this.isProduction) {
        throw new ServiceUnavailableException('SMS delivery is not configured. Please contact support.');
      }
      this.logger.warn(`[DEV SMS] No SMS provider configured. Code for ${to}: ${code}`);
      return { delivered: false, devCode: code };
    }

    const params = new URLSearchParams({ To: to, Body: body });
    if (this.messagingServiceSid) params.set('MessagingServiceSid', this.messagingServiceSid);
    else params.set('From', this.from!);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.error(`Twilio SMS failed (${response.status}): ${detail.slice(0, 300)}`);
      throw new ServiceUnavailableException('The SMS could not be sent. Please try again in a moment.');
    }

    return { delivered: true };
  }
}
