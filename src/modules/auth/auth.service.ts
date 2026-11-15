import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { randomInt, randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { createTransport, Transporter } from 'nodemailer';
import { AccountType, IdentityStatus, UserStatus } from '../../common/enums/domain.enums';
import { maskPhone, normalizeSwissMobile } from '../../common/utils/swiss-phone.util';
import { SmsService } from '../../infrastructure/sms/sms.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ChangePasswordDto, EmailDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateProfileDto, VerifyOtpDto } from './dto/auth.dto';

type JwtPayload = {
  sub: string;
  email: string;
  jti: string;
};

const PHONE_RESEND_COOLDOWN_MS = 60 * 1000;
const PHONE_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly revokedTokenIds = new Set<string>();
  private readonly mailer?: Transporter;

  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
  ) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
      this.mailer = createTransport({
        host,
        port,
        secure: this.config.get<string>('SMTP_SECURE') === 'true' || port === 465,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        auth: this.config.get<string>('SMTP_USER')
          ? {
              user: this.config.get<string>('SMTP_USER'),
              pass: this.config.get<string>('SMTP_PASS'),
            }
          : undefined,
        tls: {
          rejectUnauthorized: this.config.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false',
        },
      });
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const exists = await this.users.exists({ email, deletedAt: { $exists: false } });
    if (exists) {
      throw new BadRequestException('Email is already registered.');
    }

    const otp = this.createOtp();
    const user = await this.users.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      phone: dto.phone,
      accountType: dto.accountType ?? AccountType.CUSTOMER,
      passwordHash: await bcrypt.hash(dto.password, 12),
      status: UserStatus.PENDING,
      emailVerificationOtpHash: await bcrypt.hash(otp, 12),
      emailVerificationOtpExpiresAt: this.otpExpiry(),
    });

    await this.sendOtpEmail(email, 'Verify your Emin account', otp, 'verification');

    return {
      message: 'Registered successfully. Verification code has been sent to your email.',
      accessToken: this.signToken(user),
      user: this.safeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ email: dto.email.toLowerCase().trim(), deletedAt: { $exists: false } }).select('+passwordHash').exec();
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if ([UserStatus.BLOCKED, UserStatus.SUSPENDED, UserStatus.DELETED].includes(user.status)) {
      throw new UnauthorizedException(`User account is ${user.status.toLowerCase()}.`);
    }

    user.lastLoginAt = new Date();
    await user.save();

    return { accessToken: this.signToken(user), user: this.safeUser(user) };
  }

  async logout(authorization?: string) {
    const payload = this.verifyAuthorization(authorization);
    this.revokedTokenIds.add(payload.jti);
    return { message: 'Logged out successfully.' };
  }

  async forgotPassword(dto: EmailDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ email, deletedAt: { $exists: false } }).exec();
    if (user) {
      const otp = this.createOtp();
      user.passwordResetOtpHash = await bcrypt.hash(otp, 12);
      user.passwordResetOtpExpiresAt = this.otpExpiry();
      await user.save();
      await this.sendOtpEmail(email, 'Reset your Emin password', otp, 'password-reset');
    }

    return { message: 'Verification code sent if the account exists.', email };
  }

  async resendVerification(dto: EmailDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ email, deletedAt: { $exists: false } }).select('+emailVerificationOtpHash').exec();
    if (user) {
      const otp = this.createOtp();
      user.emailVerificationOtpHash = await bcrypt.hash(otp, 12);
      user.emailVerificationOtpExpiresAt = this.otpExpiry();
      await user.save();
      await this.sendOtpEmail(email, 'Verify your Emin account', otp, 'verification');
    }

    return { message: 'Verification code has been sent if the account exists.', email };
  }

  async testEmail(dto: EmailDto) {
    const otp = this.createOtp();
    await this.sendOtpEmail(dto.email.toLowerCase().trim(), 'Emin SMTP test', otp, 'test');
    return { message: 'Test email sent.', email: dto.email.toLowerCase().trim() };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.users
      .findOne({ email: dto.email.toLowerCase().trim(), deletedAt: { $exists: false } })
      .select('+emailVerificationOtpHash')
      .exec();
    if (!user || !(await this.isValidOtp(dto.otp, user.emailVerificationOtpHash, user.emailVerificationOtpExpiresAt))) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    user.emailVerifiedAt = new Date();
    user.status = UserStatus.ACTIVE;
    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpExpiresAt = undefined;
    await user.save();

    return { verified: true, email: user.email, user: this.safeUser(user) };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.users
      .findOne({ email: dto.email.toLowerCase().trim(), deletedAt: { $exists: false } })
      .select('+passwordHash +passwordResetOtpHash')
      .exec();
    if (!user || !(await this.isValidOtp(dto.otp, user.passwordResetOtpHash, user.passwordResetOtpExpiresAt))) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    user.passwordHash = await bcrypt.hash(dto.password, 12);
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save();

    return { message: 'Password reset successfully.', email: user.email };
  }

  async changePassword(dto: ChangePasswordDto, authorization?: string) {
    const payload = this.verifyAuthorization(authorization);
    const user = await this.users.findById(payload.sub).select('+passwordHash').exec();
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect.');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await user.save();

    return { message: 'Password changed successfully.' };
  }

  async me(authorization?: string) {
    const payload = this.verifyAuthorization(authorization);
    const user = await this.users.findById(payload.sub).exec();
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found.');
    }

    return this.safeUser(user);
  }

  async updateProfile(dto: UpdateProfileDto, authorization?: string) {
    const payload = this.verifyAuthorization(authorization);
    const user = await this.users.findById(payload.sub).exec();
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found.');
    }

    if (dto.name !== undefined) {
      const [firstName, ...rest] = dto.name.trim().split(/\s+/);
      user.firstName = firstName;
      user.lastName = rest.join(' ') || firstName;
    }
    if (dto.profession !== undefined) user.profession = dto.profession.trim();
    if (dto.bio !== undefined) user.bio = dto.bio.trim();
    if (dto.location !== undefined) user.location = dto.location.trim();

    await user.save();
    return this.safeUser(user);
  }

  async updateAvatar(authorization: string | undefined, avatarUrl: string) {
    const payload = this.verifyAuthorization(authorization);
    const user = await this.users.findById(payload.sub).exec();
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found.');
    }

    const previousAvatar = user.avatar;
    user.avatar = avatarUrl;
    await user.save();
    return { user: this.safeUser(user), previousAvatar };
  }

  private signToken(user: UserDocument) {
    const expiresIn = (this.config.get<string>('JWT_EXPIRES_IN') ?? '7d') as SignOptions['expiresIn'];
    return jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        jti: randomUUID(),
      },
      this.config.get<string>('JWT_SECRET') ?? 'change-me',
      { expiresIn },
    );
  }

  private verifyAuthorization(authorization?: string): JwtPayload {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    try {
      const payload = jwt.verify(token, this.config.get<string>('JWT_SECRET') ?? 'change-me') as JwtPayload;
      if (this.revokedTokenIds.has(payload.jti)) {
        throw new UnauthorizedException('Token has been logged out.');
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
    attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>,
  ) {
    if (!this.mailer) {
      throw new ServiceUnavailableException('Email is not configured.');
    }

    try {
      const companyFrom = this.config.get<string>('SMTP_FROM') || 'Odaboo <hello@odaboo.com>';
      await this.mailer.sendMail({
        from: companyFrom,
        replyTo: 'hello@odaboo.com',
        to,
        subject,
        text,
        html,
        attachments: attachments?.map((file) => ({
          filename: file.filename,
          content: file.content,
          contentType: file.contentType ?? 'application/pdf',
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`Email to ${to} failed: ${message}`);
      throw new ServiceUnavailableException('The confirmation email could not be sent. Please try again.');
    }
  }

  private async sendOtpEmail(to: string, subject: string, otp: string, purpose: 'verification' | 'password-reset' | 'test' = 'verification') {
    if (!this.mailer) {
      throw new BadRequestException('SMTP_HOST is not configured. Add SMTP settings to .env before sending email.');
    }

    const heading =
      purpose === 'password-reset'
        ? 'Password reset request'
        : purpose === 'test'
          ? 'SMTP test code'
          : 'Verify your email address';
    const intro =
      purpose === 'password-reset'
        ? 'We received a request to reset the password for your Emin account.'
        : purpose === 'test'
          ? 'This is a test email from your Emin SMTP configuration.'
          : 'Thank you for creating an Emin account. Please use the verification code below to confirm your email address.';
    const fallback =
      purpose === 'password-reset'
        ? 'If you did not request a password reset, you can safely ignore this email.'
        : purpose === 'test'
          ? 'If you did not request this test, please review your backend configuration.'
          : 'If you did not create an Emin account, you can safely ignore this email.';
    const text = [
      heading,
      '',
      intro,
      '',
      `Your verification code is: ${otp}`,
      '',
      'This code expires in 10 minutes.',
      fallback,
      '',
      'Regards,',
      'The Emin Team',
    ].join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 560px;">
        <h2 style="margin: 0 0 12px; color: #0f172a;">${heading}</h2>
        <p style="margin: 0 0 16px;">${intro}</p>
        <div style="margin: 24px 0; padding: 18px 22px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;">Verification code</p>
          <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otp}</p>
        </div>
        <p style="margin: 0 0 12px;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="margin: 0 0 24px; color: #475569;">${fallback}</p>
        <p style="margin: 0;">Regards,<br /><strong>The Emin Team</strong></p>
      </div>
    `;

    await this.sendEmail(to, subject, text, html);
  }

  private async isValidOtp(otp: string, otpHash?: string, expiresAt?: Date) {
    const normalizedOtp = otp.replace(/\D/g, '').slice(0, 4);
    return Boolean(otpHash && expiresAt && expiresAt.getTime() >= Date.now() && (await bcrypt.compare(normalizedOtp, otpHash)));
  }

  private createOtp() {
    return randomInt(1000, 10000).toString();
  }

  private otpExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  safeUser(user: UserDocument) {
    const json = user.toJSON() as Record<string, unknown>;
    delete json.passwordHash;
    delete json.emailVerificationOtpHash;
    delete json.passwordResetOtpHash;
    delete json.phoneVerificationOtpHash;
    delete json.phoneVerificationPendingPhone;
    delete json.phoneVerificationAttempts;
    json.isAdmin = this.isAdminUser(user);
    json.verification = this.verificationSummary(user);
    return json;
  }

  verificationSummary(user: UserDocument) {
    const email = Boolean(user.emailVerifiedAt);
    const phone = Boolean(user.phoneVerifiedAt);
    const identity = user.identityStatus ?? IdentityStatus.NOT_SUBMITTED;
    return {
      email,
      phone,
      identity,
      identityRejectionReason: identity === IdentityStatus.REJECTED ? user.identityRejectionReason : undefined,
      canBuy: email && phone,
      canSell: email && phone && identity === IdentityStatus.APPROVED,
    };
  }

  isAdminUser(user: Pick<UserDocument, 'email'>) {
    return this.adminEmails().includes(user.email.toLowerCase());
  }

  /** Resolves the signed-in user document or throws 401. */
  async requireUser(authorization?: string) {
    const payload = this.verifyAuthorization(authorization);
    const user = await this.users.findById(payload.sub).exec();
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found.');
    }
    if ([UserStatus.BLOCKED, UserStatus.SUSPENDED, UserStatus.DELETED].includes(user.status)) {
      throw new ForbiddenException(`User account is ${user.status.toLowerCase()}.`);
    }
    return user;
  }

  async requireAdmin(authorization?: string) {
    const user = await this.requireUser(authorization);
    if (!this.isAdminUser(user)) {
      throw new ForbiddenException('Administrator access is required.');
    }
    return user;
  }

  /** Sellers and service providers must have verified email, Swiss mobile and an approved identity check. */
  async requireVerifiedSeller(authorization: string | undefined, action: 'products' | 'services') {
    const user = await this.requireUser(authorization);
    const summary = this.verificationSummary(user);
    if (!summary.canSell) {
      const missing = [
        !summary.email && 'email address',
        !summary.phone && 'Swiss mobile number',
        summary.identity !== IdentityStatus.APPROVED && 'identity (ID document)',
      ].filter(Boolean).join(', ');
      throw new ForbiddenException({
        code: 'VERIFICATION_REQUIRED',
        message: `Only fully verified ${action === 'products' ? 'sellers can publish product listings' : 'service providers can publish service offers'}. Please verify your ${missing}.`,
        verification: summary,
      });
    }
    return user;
  }

  /** Buyers need a verified email and Swiss mobile number; no ID document is required. */
  async requireVerifiedBuyer(authorization?: string) {
    const user = await this.requireUser(authorization);
    const summary = this.verificationSummary(user);
    if (!summary.canBuy) {
      throw new ForbiddenException({
        code: 'VERIFICATION_REQUIRED',
        message: 'Please verify your email address and Swiss mobile number before buying.',
        verification: summary,
      });
    }
    return user;
  }

  async sendPhoneCode(authorization: string | undefined, phoneInput: string) {
    const user = await this.requireUser(authorization);
    const phone = normalizeSwissMobile(phoneInput);
    if (!phone) {
      throw new BadRequestException('Please enter a valid Swiss mobile number (+41 75–79 …).');
    }

    const takenBy = await this.users.exists({ _id: { $ne: user._id }, phone, phoneVerifiedAt: { $exists: true }, deletedAt: { $exists: false } });
    if (takenBy) {
      throw new BadRequestException('This mobile number is already verified on another account.');
    }

    const withSecrets = await this.users.findById(user._id).select('+phoneVerificationOtpHash +phoneVerificationPendingPhone').exec();
    if (!withSecrets) throw new UnauthorizedException('User not found.');

    const sentAt = withSecrets.phoneVerificationSentAt?.getTime() ?? 0;
    const waitSeconds = Math.ceil((sentAt + PHONE_RESEND_COOLDOWN_MS - Date.now()) / 1000);
    if (waitSeconds > 0 && withSecrets.phoneVerificationPendingPhone === phone) {
      throw new HttpException(`Please wait ${waitSeconds} seconds before requesting a new code.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.createOtp();
    const result = await this.sms.sendVerificationCode(phone, code);

    withSecrets.phoneVerificationOtpHash = await bcrypt.hash(code, 12);
    withSecrets.phoneVerificationPendingPhone = phone;
    withSecrets.phoneVerificationOtpExpiresAt = this.otpExpiry();
    withSecrets.phoneVerificationSentAt = new Date();
    withSecrets.phoneVerificationAttempts = 0;
    await withSecrets.save();

    return {
      message: `Verification code sent to ${maskPhone(phone)}.`,
      phone: maskPhone(phone),
      resendAfterSeconds: PHONE_RESEND_COOLDOWN_MS / 1000,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    };
  }

  async verifyPhoneCode(authorization: string | undefined, code: string) {
    const user = await this.requireUser(authorization);
    const withSecrets = await this.users.findById(user._id).select('+phoneVerificationOtpHash +phoneVerificationPendingPhone').exec();
    if (!withSecrets?.phoneVerificationOtpHash || !withSecrets.phoneVerificationPendingPhone) {
      throw new BadRequestException('Please request a new SMS code first.');
    }
    if ((withSecrets.phoneVerificationAttempts ?? 0) >= PHONE_MAX_ATTEMPTS) {
      throw new HttpException('Too many incorrect attempts. Please request a new SMS code.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const valid = await this.isValidOtp(code, withSecrets.phoneVerificationOtpHash, withSecrets.phoneVerificationOtpExpiresAt);
    if (!valid) {
      withSecrets.phoneVerificationAttempts = (withSecrets.phoneVerificationAttempts ?? 0) + 1;
      await withSecrets.save();
      throw new BadRequestException('Invalid or expired SMS code.');
    }

    withSecrets.phone = withSecrets.phoneVerificationPendingPhone;
    withSecrets.phoneVerifiedAt = new Date();
    withSecrets.phoneVerificationOtpHash = undefined;
    withSecrets.phoneVerificationPendingPhone = undefined;
    withSecrets.phoneVerificationOtpExpiresAt = undefined;
    withSecrets.phoneVerificationAttempts = 0;
    await withSecrets.save();

    return { verified: true, user: this.safeUser(withSecrets) };
  }

  async adminLogin(dto: LoginDto) {
    const result = await this.login(dto);
    if (!result.user.isAdmin) {
      throw new ForbiddenException('This account does not have administrator access.');
    }
    return result;
  }

  private adminEmails() {
    return (this.config.get<string>('ADMIN_EMAIL') ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  /** Creates the ADMIN_EMAIL account on first start so the dashboard has an administrator to log in with. */
  async onModuleInit() {
    const email = this.adminEmails()[0];
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;
    try {
      const exists = await this.users.exists({ email });
      if (exists) return;
      await this.users.create({
        firstName: 'Platform',
        lastName: 'Admin',
        email,
        passwordHash: await bcrypt.hash(password, 12),
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      });
      this.logger.log(`Created administrator account ${email}. Change ADMIN_PASSWORD after first login.`);
    } catch (error) {
      this.logger.warn(`Admin bootstrap skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
