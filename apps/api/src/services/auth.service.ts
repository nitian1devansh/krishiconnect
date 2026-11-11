import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  RegisterFarmerInput,
  RegisterVendorInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyOtpInput,
  ResendOtpInput,
  UpdateProfileInput,
  UserRole,
  VendorStatus,
  VerificationStatus,
  AccountStatus,
  TokenType,
} from '@krishiconnect/shared';
import prisma from '../db/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { NotificationService } from './notification.service';

// In-memory / dev fallback store when external Postgres is offline in local dev environment
interface DevUserStore {
  user: any;
  passwordHash: string;
}
const devUsersStore = new Map<string, DevUserStore>();
const devTokensStore = new Map<string, { identifier: string; token: string; type: string; expiresAt: Date; isUsed: boolean; attempts: number }>();
const devRefreshTokensStore = new Map<string, { userId: string; token: string; expiresAt: Date; isRevoked: boolean }>();

export class AuthService {
  /**
   * Helper to check if Prisma DB is reachable
   */
  private static async isDbAvailable(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 1. Register Farmer / Customer
   */
  static async registerFarmer(input: RegisterFarmerInput) {
    const email = input.email.toLowerCase().trim();
    const phone = input.phone.replace(/\D/g, '').trim();

    const dbAvailable = await this.isDbAvailable();

    // Check for existing user
    if (dbAvailable) {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });
      if (existing) {
        throw new AppError('An account with this email or mobile number already exists.', 409);
      }
    } else {
      for (const entry of devUsersStore.values()) {
        if (entry.user.email === email || entry.user.phone === phone) {
          throw new AppError('An account with this email or mobile number already exists.', 409);
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);
    const fullName = input.fullName || `${input.firstName || 'Farmer'} ${input.lastName || ''}`.trim();

    let createdUser: any;

    if (dbAvailable) {
      createdUser = await prisma.user.create({
        data: {
          fullName,
          email,
          phone,
          passwordHash,
          role: UserRole.FARMER,
          status: AccountStatus.ACTIVE,
          preferredLanguage: input.preferredLanguage || 'en',
          avatarUrl: input.avatarUrl,
          isVerified: false,
          cart: { create: {} },
          farmerProfile: {
            create: {
              farmSize: input.farmSize || 1,
              farmSizeUnit: input.farmSizeUnit || 'acres',
              village: input.village,
              city: input.city || 'Nashik',
              district: input.district || 'Nashik',
              state: input.state || 'Maharashtra',
              pincode: input.pincode || '422003',
              status: VerificationStatus.APPROVED,
            },
          },
          addresses: input.completeAddress
            ? {
                create: {
                  name: fullName,
                  phone,
                  street: input.completeAddress,
                  villageOrLocality: input.village,
                  city: input.city || 'Nashik',
                  district: input.district || 'Nashik',
                  state: input.state || 'Maharashtra',
                  pincode: input.pincode || '422003',
                  addressType: 'FARM',
                  isDefault: true,
                },
              }
            : undefined,
        },
        include: {
          farmerProfile: true,
          addresses: true,
        },
      });
    } else {
      // Local dev fallback persistence
      const userId = `farmer_${Date.now()}`;
      createdUser = {
        id: userId,
        fullName,
        email,
        phone,
        role: UserRole.FARMER,
        status: AccountStatus.ACTIVE,
        preferredLanguage: input.preferredLanguage || 'en',
        avatarUrl: input.avatarUrl,
        isVerified: false,
        farmerProfile: {
          id: `fp_${Date.now()}`,
          userId,
          farmSize: input.farmSize || 1,
          farmSizeUnit: input.farmSizeUnit || 'acres',
          village: input.village || '',
          city: input.city || 'Nashik',
          district: input.district || 'Nashik',
          state: input.state || 'Maharashtra',
          pincode: input.pincode || '422003',
          status: VerificationStatus.APPROVED,
        },
        addresses: input.completeAddress
          ? [
              {
                id: `addr_${Date.now()}`,
                name: fullName,
                phone,
                street: input.completeAddress,
                city: input.city || 'Nashik',
                district: input.district || 'Nashik',
                state: input.state || 'Maharashtra',
                pincode: input.pincode || '422003',
                isDefault: true,
              },
            ]
          : [],
        createdAt: new Date(),
      };
      devUsersStore.set(userId, { user: createdUser, passwordHash });
    }

    // Generate tokens & OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (dbAvailable) {
      await prisma.verificationToken.create({
        data: {
          userId: createdUser.id,
          identifier: email,
          token: otpCode,
          type: TokenType.EMAIL_VERIFICATION,
          expiresAt: tokenExpires,
        },
      });
    } else {
      devTokensStore.set(`${email}_EMAIL_VERIFICATION`, {
        identifier: email,
        token: otpCode,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: tokenExpires,
        isUsed: false,
        attempts: 0,
      });
    }

    // Dispatch verification
    const dispatchResult = await NotificationService.sendEmailVerification(email, otpCode, fullName);
    await NotificationService.sendMobileOtp(phone, otpCode);

    const accessToken = this.generateAccessToken(createdUser.id, UserRole.FARMER);
    const refreshToken = await this.generateAndStoreRefreshToken(createdUser.id, dbAvailable);

    const { passwordHash: _, ...safeUser } = createdUser;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
      token: accessToken, // backward compatibility
      verification: {
        required: true,
        method: 'EMAIL_AND_SMS',
        dispatched: dispatchResult.success,
        mode: dispatchResult.mode,
        devCode: dispatchResult.devTokenOrOtp,
      },
    };
  }

  /**
   * 2. Register Vendor / Shop Owner
   */
  static async registerVendor(input: RegisterVendorInput) {
    const email = input.email.toLowerCase().trim();
    const phone = input.phone.replace(/\D/g, '').trim();

    const dbAvailable = await this.isDbAvailable();

    if (dbAvailable) {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });
      if (existing) {
        throw new AppError('An account with this email or mobile number already exists.', 409);
      }
    } else {
      for (const entry of devUsersStore.values()) {
        if (entry.user.email === email || entry.user.phone === phone) {
          throw new AppError('An account with this email or mobile number already exists.', 409);
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);
    const fullName = input.fullName || `${input.firstName || 'Vendor'} ${input.lastName || ''}`.trim();

    const baseSlug = input.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const storeSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const categoriesStr = Array.isArray(input.categories)
      ? input.categories.join(', ')
      : input.categories || 'Seeds, Fertilizers';

    let createdUser: any;

    if (dbAvailable) {
      createdUser = await prisma.user.create({
        data: {
          fullName,
          email,
          phone,
          passwordHash,
          role: UserRole.VENDOR,
          status: AccountStatus.ACTIVE,
          preferredLanguage: input.preferredLanguage || 'en',
          isVerified: false,
          vendorProfile: {
            create: {
              businessName: input.businessName,
              storeSlug,
              description: input.description,
              businessType: input.businessType || 'Retailer',
              categories: categoriesStr,
              establishedSince: input.establishedSince || '2020',
              logoUrl: input.logoUrl,
              businessAddress: input.businessAddress,
              village: input.village,
              city: input.city || 'Nashik',
              district: input.district || 'Nashik',
              state: input.state || 'Maharashtra',
              pincode: input.pincode,
              gstin: input.gstin,
              panNumber: input.panNumber,
              licenseNumber: input.licenseNumber,
              bankAccountNumber: input.bankAccountNumber,
              bankIfsc: input.bankIfsc,
              bankAccountName: input.bankAccountName || fullName,
              bankName: input.bankName,
              status: VendorStatus.PENDING,
              documents: input.gstCertificateUrl || input.verificationDocumentUrl
                ? {
                    create: [
                      ...(input.gstCertificateUrl
                        ? [
                            {
                              documentType: 'GST_CERTIFICATE',
                              documentUrl: input.gstCertificateUrl,
                              fileName: 'gst_certificate.pdf',
                            },
                          ]
                        : []),
                      ...(input.verificationDocumentUrl
                        ? [
                            {
                              documentType: 'BUSINESS_REGISTRATION',
                              documentUrl: input.verificationDocumentUrl,
                              fileName: 'business_license.pdf',
                            },
                          ]
                        : []),
                    ],
                  }
                : undefined,
            },
          },
          addresses: {
            create: {
              name: fullName,
              phone,
              street: input.businessAddress,
              city: input.city || 'Nashik',
              district: input.district || 'Nashik',
              state: input.state || 'Maharashtra',
              pincode: input.pincode,
              addressType: 'WAREHOUSE',
              isDefault: true,
            },
          },
        },
        include: {
          vendorProfile: {
            include: { documents: true },
          },
          addresses: true,
        },
      });
    } else {
      const userId = `vendor_${Date.now()}`;
      createdUser = {
        id: userId,
        fullName,
        email,
        phone,
        role: UserRole.VENDOR,
        status: AccountStatus.ACTIVE,
        preferredLanguage: input.preferredLanguage || 'en',
        isVerified: false,
        vendorProfile: {
          id: `vp_${Date.now()}`,
          userId,
          businessName: input.businessName,
          storeSlug,
          description: input.description,
          businessType: input.businessType || 'Retailer',
          categories: categoriesStr,
          establishedSince: input.establishedSince || '2020',
          logoUrl: input.logoUrl,
          businessAddress: input.businessAddress,
          city: input.city || 'Nashik',
          state: input.state || 'Maharashtra',
          pincode: input.pincode,
          gstin: input.gstin,
          bankAccountNumber: input.bankAccountNumber,
          bankIfsc: input.bankIfsc,
          bankAccountName: input.bankAccountName || fullName,
          bankName: input.bankName,
          status: VendorStatus.PENDING,
          documents: [],
        },
        addresses: [
          {
            id: `addr_${Date.now()}`,
            name: fullName,
            phone,
            street: input.businessAddress,
            city: input.city || 'Nashik',
            district: input.district || 'Nashik',
            state: input.state || 'Maharashtra',
            pincode: input.pincode,
            isDefault: true,
          },
        ],
        createdAt: new Date(),
      };
      devUsersStore.set(userId, { user: createdUser, passwordHash });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    if (dbAvailable) {
      await prisma.verificationToken.create({
        data: {
          userId: createdUser.id,
          identifier: email,
          token: otpCode,
          type: TokenType.EMAIL_VERIFICATION,
          expiresAt: tokenExpires,
        },
      });
    } else {
      devTokensStore.set(`${email}_EMAIL_VERIFICATION`, {
        identifier: email,
        token: otpCode,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: tokenExpires,
        isUsed: false,
        attempts: 0,
      });
    }

    await NotificationService.sendEmailVerification(email, otpCode, fullName);
    await NotificationService.sendMobileOtp(phone, otpCode);

    const accessToken = this.generateAccessToken(createdUser.id, UserRole.VENDOR);
    const refreshToken = await this.generateAndStoreRefreshToken(createdUser.id, dbAvailable);

    const { passwordHash: _, ...safeUser } = createdUser;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
      token: accessToken,
      verification: {
        required: true,
        vendorStatus: VendorStatus.PENDING,
        note: 'Vendor application submitted. Products and selling will be unlocked once approved by Platform Admin.',
      },
    };
  }

  /**
   * 3. Universal Login (Supports Email OR Mobile Number)
   */
  static async login(input: LoginInput) {
    const rawIdentifier = (input.identifier || input.email || input.phone || '').trim();
    if (!rawIdentifier) {
      throw new AppError('Email or mobile number is required.', 400);
    }

    const isEmail = rawIdentifier.includes('@');
    const identifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier.replace(/\D/g, '');

    const dbAvailable = await this.isDbAvailable();
    let user: any;
    let storedHash = '';

    if (dbAvailable) {
      user = await prisma.user.findFirst({
        where: isEmail ? { email: identifier } : { phone: identifier },
        include: {
          vendorProfile: { include: { documents: true } },
          farmerProfile: true,
          addresses: true,
        },
      });
      if (user) {
        storedHash = user.passwordHash;
      }
    } else {
      // Local dev store check + default seed users fallback
      for (const entry of devUsersStore.values()) {
        if (
          (isEmail && entry.user.email === identifier) ||
          (!isEmail && entry.user.phone === identifier)
        ) {
          user = entry.user;
          storedHash = entry.passwordHash;
          break;
        }
      }

      // Predefined default seed accounts fallback in development if not yet registered in memory
      if (!user) {
        if (identifier === 'admin@krishiconnect.in' || identifier === '9876543210') {
          user = {
            id: 'admin_seed_id',
            fullName: config.adminSeed.name,
            email: config.adminSeed.email,
            phone: config.adminSeed.phone,
            role: UserRole.ADMIN,
            status: AccountStatus.ACTIVE,
            isActive: true,
            isVerified: true,
          };
          storedHash = await bcrypt.hash(config.adminSeed.password, 10);
        } else if (identifier === 'farmer@krishiconnect.in' || identifier === '9822012345') {
          user = {
            id: 'farmer_seed_id',
            fullName: 'Rajesh Patil',
            email: 'farmer@krishiconnect.in',
            phone: '9822012345',
            role: UserRole.FARMER,
            status: AccountStatus.ACTIVE,
            isActive: true,
            isVerified: true,
            farmerProfile: {
              id: 'fp_seed_1',
              farmSize: 5,
              farmSizeUnit: 'acres',
              district: 'Nashik',
              state: 'Maharashtra',
              status: VerificationStatus.APPROVED,
            },
          };
          storedHash = await bcrypt.hash('Farmer#12345', 10);
        } else if (identifier === 'vendor1@krishiconnect.in' || identifier === '9823054321') {
          user = {
            id: 'vendor_seed_id',
            fullName: 'Suresh Agrotech',
            email: 'vendor1@krishiconnect.in',
            phone: '9823054321',
            role: UserRole.VENDOR,
            status: AccountStatus.ACTIVE,
            isActive: true,
            isVerified: true,
            vendorProfile: {
              id: 'vp_seed_1',
              businessName: 'Suresh Agrotech & Seeds',
              storeSlug: 'suresh-agrotech-nashik',
              businessType: 'Retailer',
              city: 'Nashik',
              state: 'Maharashtra',
              gstin: '27AABCS1429B1Z8',
              status: VendorStatus.APPROVED,
            },
          };
          storedHash = await bcrypt.hash('Vendor#12345', 10);
        }
      }
    }

    if (!user) {
      throw new AppError('Invalid credentials. No account found with this identifier.', 401);
    }

    if (user.isActive === false || user.status === AccountStatus.SUSPENDED) {
      throw new AppError('This account has been suspended or deactivated. Please contact KrishiConnect support.', 403);
    }

    const isMatch = await bcrypt.compare(input.password, storedHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials. Password does not match.', 401);
    }

    const accessToken = this.generateAccessToken(user.id, user.role as UserRole);
    const refreshToken = await this.generateAndStoreRefreshToken(user.id, dbAvailable);

    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
      token: accessToken,
    };
  }

  /**
   * 4. Secure Token Refresh Session
   */
  static async refreshSession(refreshTokenString: string) {
    if (!refreshTokenString) {
      throw new AppError('Refresh token is required.', 400);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshTokenString, config.refreshTokenSecret);
    } catch {
      throw new AppError('Invalid or expired refresh token. Please sign in again.', 401);
    }

    const dbAvailable = await this.isDbAvailable();

    if (dbAvailable) {
      const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshTokenString },
        include: { user: true },
      });

      if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
        throw new AppError('Refresh token revoked or expired.', 401);
      }

      const newAccessToken = this.generateAccessToken(stored.userId, stored.user.role as UserRole);
      return {
        accessToken: newAccessToken,
        token: newAccessToken,
      };
    } else {
      const stored = devRefreshTokensStore.get(refreshTokenString);
      if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
        throw new AppError('Refresh token revoked or expired.', 401);
      }
      const userEntry = devUsersStore.get(stored.userId);
      const role = userEntry?.user?.role || UserRole.FARMER;
      const newAccessToken = this.generateAccessToken(stored.userId, role);
      return {
        accessToken: newAccessToken,
        token: newAccessToken,
      };
    }
  }

  /**
   * 5. Logout
   */
  static async logout(userId: string, refreshTokenString?: string) {
    const dbAvailable = await this.isDbAvailable();
    if (dbAvailable && refreshTokenString) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshTokenString, userId },
        data: { isRevoked: true },
      }).catch(() => null);
    } else if (refreshTokenString) {
      const stored = devRefreshTokensStore.get(refreshTokenString);
      if (stored) {
        stored.isRevoked = true;
      }
    }
    return { success: true, message: 'Logged out successfully.' };
  }

  /**
   * 6. Forgot Password (Dispatches OTP / Reset Token)
   */
  static async forgotPassword(input: ForgotPasswordInput) {
    const rawIdentifier = input.identifier.trim();
    const isEmail = rawIdentifier.includes('@');
    const identifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier.replace(/\D/g, '');

    const dbAvailable = await this.isDbAvailable();
    let user: any;

    if (dbAvailable) {
      user = await prisma.user.findFirst({
        where: isEmail ? { email: identifier } : { phone: identifier },
      });
    } else {
      for (const entry of devUsersStore.values()) {
        if (
          (isEmail && entry.user.email === identifier) ||
          (!isEmail && entry.user.phone === identifier)
        ) {
          user = entry.user;
          break;
        }
      }
    }

    if (!user) {
      // Security best practice: don't reveal non-existence of account
      return {
        success: true,
        message: 'If an account matches this identifier, password reset instructions have been sent.',
      };
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (dbAvailable) {
      // Invalidate existing tokens
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }).catch(() => null);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetOtp,
          expiresAt,
        },
      });
    } else {
      devTokensStore.set(`${identifier}_PASSWORD_RESET`, {
        identifier,
        token: resetOtp,
        type: TokenType.PASSWORD_RESET,
        expiresAt,
        isUsed: false,
        attempts: 0,
      });
    }

    const dispatchResult = await NotificationService.sendPasswordReset(identifier, resetOtp, user.fullName);

    return {
      success: true,
      message: 'Password reset instructions have been sent.',
      mode: dispatchResult.mode,
      devCode: dispatchResult.devTokenOrOtp,
    };
  }

  /**
   * 7. Reset Password Using Token / OTP
   */
  static async resetPassword(input: ResetPasswordInput) {
    const token = input.token.trim();
    const rawIdentifier = (input.identifier || '').trim();
    const isEmail = rawIdentifier.includes('@');
    const identifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier.replace(/\D/g, '');

    const dbAvailable = await this.isDbAvailable();
    let userId: string | undefined;

    if (dbAvailable) {
      const resetRecord = await prisma.passwordResetToken.findFirst({
        where: {
          token,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!resetRecord) {
        throw new AppError('Invalid, expired, or already used password reset token.', 400);
      }
      userId = resetRecord.userId;

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { passwordHash },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetRecord.id },
          data: { isUsed: true },
        }),
        prisma.refreshToken.updateMany({
          where: { userId },
          data: { isRevoked: true },
        }),
      ]);
    } else {
      let matchingToken: any;
      for (const [key, t] of devTokensStore.entries()) {
        if (t.token === token && t.type === TokenType.PASSWORD_RESET && !t.isUsed) {
          matchingToken = t;
          break;
        }
      }

      if (!matchingToken || matchingToken.expiresAt < new Date()) {
        throw new AppError('Invalid or expired password reset token.', 400);
      }

      matchingToken.isUsed = true;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);

      for (const entry of devUsersStore.values()) {
        if (
          entry.user.email === matchingToken.identifier ||
          entry.user.phone === matchingToken.identifier
        ) {
          entry.passwordHash = passwordHash;
          break;
        }
      }
    }

    return {
      success: true,
      message: 'Password has been successfully reset. You may now log in with your new password.',
    };
  }

  /**
   * 8. Verify OTP / Email Token
   */
  static async verifyOtp(input: VerifyOtpInput) {
    const rawIdentifier = input.identifier.trim();
    const isEmail = rawIdentifier.includes('@');
    const identifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier.replace(/\D/g, '');
    const otp = input.otp.trim();
    const type = input.type || (isEmail ? TokenType.EMAIL_VERIFICATION : TokenType.PHONE_OTP);

    const dbAvailable = await this.isDbAvailable();

    if (dbAvailable) {
      const record = await prisma.verificationToken.findFirst({
        where: {
          identifier,
          token: otp,
          type: type as TokenType,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!record) {
        throw new AppError('Invalid or expired verification code.', 400);
      }

      await prisma.$transaction([
        prisma.verificationToken.update({
          where: { id: record.id },
          data: { isUsed: true },
        }),
        ...(record.userId
          ? [
              prisma.user.update({
                where: { id: record.userId },
                data: { isVerified: true },
              }),
            ]
          : []),
      ]);
    } else {
      const key = `${identifier}_${type}`;
      const record = devTokensStore.get(key);
      if (!record || record.token !== otp || record.isUsed || record.expiresAt < new Date()) {
        throw new AppError('Invalid or expired verification code.', 400);
      }
      record.isUsed = true;
    }

    return {
      success: true,
      message: 'Account successfully verified!',
    };
  }

  /**
   * 9. Resend Verification OTP
   */
  static async resendVerification(input: ResendOtpInput) {
    const rawIdentifier = input.identifier.trim();
    const isEmail = rawIdentifier.includes('@');
    const identifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier.replace(/\D/g, '');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const dbAvailable = await this.isDbAvailable();

    if (dbAvailable) {
      await prisma.verificationToken.create({
        data: {
          identifier,
          token: otpCode,
          type: isEmail ? TokenType.EMAIL_VERIFICATION : TokenType.PHONE_OTP,
          expiresAt,
        },
      });
    } else {
      devTokensStore.set(`${identifier}_${isEmail ? TokenType.EMAIL_VERIFICATION : TokenType.PHONE_OTP}`, {
        identifier,
        token: otpCode,
        type: isEmail ? TokenType.EMAIL_VERIFICATION : TokenType.PHONE_OTP,
        expiresAt,
        isUsed: false,
        attempts: 0,
      });
    }

    const dispatch = isEmail
      ? await NotificationService.sendEmailVerification(identifier, otpCode, 'Valued Member')
      : await NotificationService.sendMobileOtp(identifier, otpCode);

    return {
      success: true,
      message: `A fresh verification code has been dispatched to ${identifier}.`,
      mode: dispatch.mode,
      devCode: dispatch.devTokenOrOtp,
    };
  }

  /**
   * 10. Get Current User Profile
   */
  static async getProfile(userId: string) {
    const dbAvailable = await this.isDbAvailable();

    if (dbAvailable) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          farmerProfile: true,
          vendorProfile: { include: { documents: true } },
          addresses: { orderBy: { isDefault: 'desc' } },
          _count: {
            select: {
              orders: true,
              wishlist: true,
              addresses: true,
              soilTestReports: true,
              reviews: true,
            },
          },
        },
      });
      if (!user) {
        throw new AppError('User profile not found.', 404);
      }
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    } else {
      const entry = devUsersStore.get(userId);
      if (entry) {
        const { passwordHash: _, ...safeUser } = entry.user;
        return safeUser;
      }
      throw new AppError('User profile not found.', 404);
    }
  }

  /**
   * 11. Update Authenticated User Profile
   */
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const dbAvailable = await this.isDbAvailable();

    if (dbAvailable) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { farmerProfile: true, vendorProfile: true },
      });

      if (!existingUser) {
        throw new AppError('User profile not found.', 404);
      }

      if (data.phone && data.phone !== existingUser.phone) {
        const phoneInUse = await prisma.user.findFirst({
          where: { phone: data.phone, id: { not: userId } },
        });
        if (phoneInUse) {
          throw new AppError('Mobile number is already registered with another account.', 409);
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.fullName !== undefined && { fullName: data.fullName.trim() }),
            ...(data.phone !== undefined && { phone: data.phone.trim() }),
            ...(data.preferredLanguage !== undefined && { preferredLanguage: data.preferredLanguage }),
            ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          },
        });

        if (data.farmerProfile && existingUser.farmerProfile) {
          const fp = data.farmerProfile;
          await tx.farmerProfile.update({
            where: { id: existingUser.farmerProfile.id },
            data: {
              ...(fp.farmSize !== undefined && { farmSize: fp.farmSize }),
              ...(fp.farmSizeUnit !== undefined && { farmSizeUnit: fp.farmSizeUnit }),
              ...(fp.village !== undefined && { village: fp.village }),
              ...(fp.city !== undefined && { city: fp.city }),
              ...(fp.district !== undefined && { district: fp.district }),
              ...(fp.state !== undefined && { state: fp.state }),
              ...(fp.pincode !== undefined && { pincode: fp.pincode }),
            },
          });
        }

        if (data.vendorProfile && existingUser.vendorProfile) {
          const vp = data.vendorProfile;
          await tx.vendorProfile.update({
            where: { id: existingUser.vendorProfile.id },
            data: {
              ...(vp.businessName !== undefined && { businessName: vp.businessName.trim() }),
              ...(vp.description !== undefined && { description: vp.description }),
              ...(vp.businessType !== undefined && { businessType: vp.businessType }),
              ...(vp.businessAddress !== undefined && { businessAddress: vp.businessAddress }),
              ...(vp.village !== undefined && { village: vp.village }),
              ...(vp.city !== undefined && { city: vp.city }),
              ...(vp.district !== undefined && { district: vp.district }),
              ...(vp.state !== undefined && { state: vp.state }),
              ...(vp.pincode !== undefined && { pincode: vp.pincode }),
              ...(vp.gstin !== undefined && { gstin: vp.gstin }),
              ...(vp.licenseNumber !== undefined && { licenseNumber: vp.licenseNumber }),
            },
          });
        }
      });

      return this.getProfile(userId);
    } else {
      const entry = devUsersStore.get(userId);
      if (!entry) {
        throw new AppError('User profile not found.', 404);
      }
      entry.user = {
        ...entry.user,
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.preferredLanguage !== undefined && { preferredLanguage: data.preferredLanguage }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.farmerProfile && entry.user.farmerProfile && {
          farmerProfile: { ...entry.user.farmerProfile, ...data.farmerProfile },
        }),
        ...(data.vendorProfile && entry.user.vendorProfile && {
          vendorProfile: { ...entry.user.vendorProfile, ...data.vendorProfile },
        }),
      };
      const { passwordHash: _, ...safeUser } = entry.user;
      return safeUser;
    }
  }

  /**
   * 12. Change Password for Authenticated User
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const dbAvailable = await this.isDbAvailable();

    if (dbAvailable) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found.', 404);
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new AppError('Current password is incorrect.', 400);
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
      return { message: 'Password updated successfully.' };
    } else {
      const entry = devUsersStore.get(userId);
      if (!entry) {
        throw new AppError('User not found.', 404);
      }
      const isValid = await bcrypt.compare(currentPassword, entry.passwordHash);
      if (!isValid) {
        throw new AppError('Current password is incorrect.', 400);
      }
      entry.passwordHash = await bcrypt.hash(newPassword, 10);
      return { message: 'Password updated successfully.' };
    }
  }

  // -------------------------------------------------------------
  // Internal Helpers
  // -------------------------------------------------------------

  private static generateAccessToken(userId: string, role: UserRole): string {
    return jwt.sign({ userId, role }, config.jwtSecret, {
      expiresIn: config.accessTokenExpiry as any,
    });
  }

  private static async generateAndStoreRefreshToken(userId: string, dbAvailable: boolean): Promise<string> {
    const rawToken = jwt.sign(
      { userId, jti: crypto.randomBytes(16).toString('hex') },
      config.refreshTokenSecret,
      { expiresIn: config.refreshTokenExpiry as any }
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (dbAvailable) {
      await prisma.refreshToken.create({
        data: {
          userId,
          token: rawToken,
          expiresAt,
        },
      }).catch(() => null);
    } else {
      devRefreshTokensStore.set(rawToken, {
        userId,
        token: rawToken,
        expiresAt,
        isRevoked: false,
      });
    }

    return rawToken;
  }
}
