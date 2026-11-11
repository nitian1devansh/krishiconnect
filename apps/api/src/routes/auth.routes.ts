import { Router } from 'express';
import {
  RegisterFarmerSchema,
  RegisterVendorSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyOtpSchema,
  ResendOtpSchema,
  RefreshTokenSchema,
} from '@krishiconnect/shared';
import { AuthService } from '../services/auth.service';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();

// In-memory rate limiter map for IP/Identifier attempts
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
function rateLimit(windowMs: number, maxRequests: number, message: string) {
  return (req: any, res: any, next: any) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown_ip';
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.firstAttempt > windowMs) {
      rateLimitMap.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterSec: Math.ceil((windowMs - (now - entry.firstAttempt)) / 1000),
      });
    }

    entry.count += 1;
    next();
  };
}

/**
 * 1. Register Farmer / Customer
 */
router.post(
  '/register/farmer',
  rateLimit(60 * 1000, 10, 'Too many registration requests. Please wait a minute.'),
  validateRequest(RegisterFarmerSchema),
  async (req, res, next) => {
    try {
      const result = await AuthService.registerFarmer(req.body);
      res.status(201).json({
        success: true,
        message: 'Farmer account registered successfully. Verification OTP dispatched.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 2. Register Vendor / Shop Owner
 */
router.post(
  '/register/vendor',
  rateLimit(60 * 1000, 10, 'Too many registration requests. Please wait a minute.'),
  validateRequest(RegisterVendorSchema),
  async (req, res, next) => {
    try {
      const result = await AuthService.registerVendor(req.body);
      res.status(201).json({
        success: true,
        message: 'Vendor application registered successfully. Pending admin approval.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 3. Universal Login (Email or Phone)
 */
router.post(
  '/login',
  rateLimit(60 * 1000, 15, 'Too many login attempts. Please try again after 60 seconds.'),
  validateRequest(LoginSchema),
  async (req, res, next) => {
    try {
      const result = await AuthService.login(req.body);

      // Set HTTP-only cookie for refresh token if desired
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      res.json({
        success: true,
        message: 'Login successful.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 4. Refresh Token Session
 */
router.post('/refresh-token', async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await AuthService.refreshSession(refreshToken);
    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. Logout
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await AuthService.logout(req.user!.id, refreshToken);
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. Forgot Password
 */
router.post(
  '/forgot-password',
  rateLimit(15 * 60 * 1000, 5, 'Too many password reset requests. Please wait 15 minutes.'),
  validateRequest(ForgotPasswordSchema),
  async (req, res, next) => {
    try {
      const result = await AuthService.forgotPassword(req.body);
      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 7. Reset Password
 */
router.post(
  '/reset-password',
  rateLimit(15 * 60 * 1000, 5, 'Too many reset attempts.'),
  validateRequest(ResetPasswordSchema),
  async (req, res, next) => {
    try {
      const result = await AuthService.resetPassword(req.body);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 8. Verify OTP / Email Token
 */
router.post(
  '/verify-otp',
  validateRequest(VerifyOtpSchema),
  async (req, res, next) => {
    try {
      const result = await AuthService.verifyOtp(req.body);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 9. Resend OTP
 */
router.post(
  '/resend-otp',
  rateLimit(60 * 1000, 3, 'Please wait 60 seconds before requesting another verification code.'),
  validateRequest(ResendOtpSchema),
  async (req, res, next) => {
    try {
      const result = await AuthService.resendVerification(req.body);
      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * 10. Authenticated User Profile
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const profile = await AuthService.getProfile(req.user!.id);
    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
