import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root or current working dir
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || process.env.WEB_BASE_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || process.env.API_BASE_URL || 'http://localhost:4000',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://krishiconnect:krishiconnect@localhost:5432/krishiconnect?schema=public',

  // Authentication & Tokens
  jwtSecret: process.env.JWT_SECRET || 'krishi_connect_super_jwt_secret_dev_32char_minimum',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'krishi_connect_super_refresh_jwt_secret_dev_32char',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'krishi_cookie_session_secret_change_in_prod',

  // Email Notification Configuration
  email: {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
    user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
    password: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'KrishiConnect <no-reply@krishiconnect.in>',
    isConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && !process.env.EMAIL_PASSWORD.includes('placeholder')),
  },

  // SMS & OTP Provider Configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'mock', // mock, msg91, fast2sms
    msg91AuthKey: process.env.MSG91_AUTH_KEY || '',
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID || '',
    fast2SmsApiKey: process.env.FAST2SMS_API_KEY || '',
    isConfigured: (process.env.SMS_PROVIDER === 'msg91' && !!process.env.MSG91_AUTH_KEY && !process.env.MSG91_AUTH_KEY.includes('placeholder')) ||
                  (process.env.SMS_PROVIDER === 'fast2sms' && !!process.env.FAST2SMS_API_KEY),
  },

  payment: {
    sandboxMode: process.env.PAYMENT_SANDBOX_MODE === 'true' || true,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret',
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_placeholder',
  },

  voice: {
    provider: process.env.VOICE_PROVIDER || 'mock',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioCallerNumber: process.env.TWILIO_CALLER_NUMBER,
  },

  upload: {
    localFallback: process.env.UPLOAD_LOCAL_FALLBACK === 'true' || true,
    uploadDir: path.resolve(process.cwd(), 'uploads'),
  },

  adminSeed: {
    name: process.env.ADMIN_NAME || 'Krishi Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@krishiconnect.in',
    phone: process.env.ADMIN_PHONE || '9876543210',
    password: process.env.ADMIN_PASSWORD || 'AdminKrishi#2026',
  }
};

export function validateEnv() {
  const warnings: string[] = [];

  if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
    throw new Error('CRITICAL CONFIG ERROR: JWT_SECRET environment variable is required in production.');
  }

  if (!config.email.isConfigured) {
    warnings.push('Email provider (EMAIL_USER / EMAIL_PASSWORD) not configured. Using local development console fallback for email verification and password resets.');
  }

  if (!config.sms.isConfigured) {
    warnings.push(`SMS provider set to "${config.sms.provider}". Using local development console fallback for mobile OTP dispatch.`);
  }

  if (warnings.length > 0 && config.nodeEnv !== 'test') {
    console.log('\n⚙️ [KrishiConnect Auth Configuration Status]');
    warnings.forEach(w => console.log(`  ℹ️  ${w}`));
    console.log('  ➜ Real credentials can be provided in .env (see .env.example for details).\n');
  }
}
