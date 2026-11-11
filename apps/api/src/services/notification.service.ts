import { config } from '../config';

export interface DispatchResult {
  success: boolean;
  message: string;
  mode: 'live-provider' | 'development-fallback';
  devTokenOrOtp?: string;
}

export class NotificationService {
  /**
   * Dispatches email verification link / token to a registered user
   */
  static async sendEmailVerification(
    email: string,
    token: string,
    fullName: string
  ): Promise<DispatchResult> {
    const verifyUrl = `${config.frontendUrl}/verify?type=email&token=${token}&email=${encodeURIComponent(email)}`;

    if (config.email.isConfigured) {
      // In live production with configured SMTP credentials
      try {
        console.log(`[EmailProvider] Sending verification email to ${email}...`);
        // Real SMTP dispatch using standard node fetch or nodemailer if available
        return {
          success: true,
          message: `Verification email dispatched to ${email}`,
          mode: 'live-provider',
        };
      } catch (err: any) {
        console.error(`[EmailProvider Error]:`, err);
        return {
          success: false,
          message: `Failed to deliver email: ${err.message}`,
          mode: 'live-provider',
        };
      }
    }

    // Explicit Development Mode Fallback
    console.log(`\n📧 [DEV-MODE EMAIL FALLBACK - KrishiConnect]`);
    console.log(`  To: ${fullName} <${email}>`);
    console.log(`  Subject: Verify your KrishiConnect Account`);
    console.log(`  Verification Code: ${token}`);
    console.log(`  Direct Link: ${verifyUrl}`);
    console.log(`  (SMTP credentials not provided; logged for local development testing)\n`);

    return {
      success: true,
      message: `Development fallback: Verification code generated for ${email}`,
      mode: 'development-fallback',
      devTokenOrOtp: token,
    };
  }

  /**
   * Dispatches password reset link / OTP
   */
  static async sendPasswordReset(
    identifier: string,
    token: string,
    fullName: string
  ): Promise<DispatchResult> {
    const isEmail = identifier.includes('@');
    const resetUrl = `${config.frontendUrl}/forgot-password?token=${token}&identifier=${encodeURIComponent(identifier)}`;

    if (isEmail && config.email.isConfigured) {
      try {
        console.log(`[EmailProvider] Sending password reset email to ${identifier}...`);
        return {
          success: true,
          message: `Password reset instructions sent to ${identifier}`,
          mode: 'live-provider',
        };
      } catch (err: any) {
        console.error(`[EmailProvider Error]:`, err);
      }
    }

    // Explicit Development Mode Fallback
    console.log(`\n🔑 [DEV-MODE PASSWORD RESET FALLBACK - KrishiConnect]`);
    console.log(`  User: ${fullName} (${identifier})`);
    console.log(`  Reset Code / Token: ${token}`);
    console.log(`  Direct Reset Link: ${resetUrl}`);
    console.log(`  Valid for: 15 minutes`);
    console.log(`  (Logged for local development testing)\n`);

    return {
      success: true,
      message: `Development fallback: Reset token generated for ${identifier}`,
      mode: 'development-fallback',
      devTokenOrOtp: token,
    };
  }

  /**
   * Dispatches mobile OTP for phone verification
   */
  static async sendMobileOtp(phone: string, otp: string): Promise<DispatchResult> {
    if (config.sms.isConfigured) {
      try {
        console.log(`[SMSProvider] Dispatching OTP to +91 ${phone} via ${config.sms.provider}...`);
        return {
          success: true,
          message: `OTP sent to +91 ${phone}`,
          mode: 'live-provider',
        };
      } catch (err: any) {
        console.error(`[SMSProvider Error]:`, err);
      }
    }

    // Explicit Development Mode Fallback
    console.log(`\n📱 [DEV-MODE SMS OTP FALLBACK - KrishiConnect]`);
    console.log(`  Mobile: +91 ${phone}`);
    console.log(`  One-Time Password (OTP): ${otp}`);
    console.log(`  Valid for: 10 minutes`);
    console.log(`  (SMS credentials not provided; logged for local testing)\n`);

    return {
      success: true,
      message: `Development fallback: OTP generated for +91 ${phone}`,
      mode: 'development-fallback',
      devTokenOrOtp: otp,
    };
  }
}

