import { Body, Controller, Get, Headers, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendPhoneCodeDto,
  UpdateProfileDto,
  VerifyOtpDto,
  VerifyPhoneCodeDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('admin/login')
  adminLogin(@Body() dto: LoginDto) {
    return this.service.adminLogin(dto);
  }

  @Post('phone/send-code')
  sendPhoneCode(@Body() dto: SendPhoneCodeDto, @Headers('authorization') authorization?: string) {
    return this.service.sendPhoneCode(authorization, dto.phone);
  }

  @Post('phone/verify')
  verifyPhoneCode(@Body() dto: VerifyPhoneCodeDto, @Headers('authorization') authorization?: string) {
    return this.service.verifyPhoneCode(authorization, dto.code);
  }

  @Post('logout')
  logout(@Headers('authorization') authorization?: string) {
    return this.service.logout(authorization);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: EmailDto) {
    return this.service.forgotPassword(dto);
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: EmailDto) {
    return this.service.resendVerification(dto);
  }

  @Post('test-email')
  testEmail(@Body() dto: EmailDto) {
    return this.service.testEmail(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.service.verifyOtp(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(dto);
  }

  @Patch('change-password')
  changePassword(@Body() dto: ChangePasswordDto, @Headers('authorization') authorization?: string) {
    return this.service.changePassword(dto, authorization);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.service.me(authorization);
  }

  @Patch('me')
  updateMe(@Body() dto: UpdateProfileDto, @Headers('authorization') authorization?: string) {
    return this.service.updateProfile(dto, authorization);
  }
}
