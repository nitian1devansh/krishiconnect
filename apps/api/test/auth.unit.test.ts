import { describe, it, expect } from 'vitest';
import { AuthService } from '../src/services/auth.service';
import { UserRole, VendorStatus, VerificationStatus } from '@krishiconnect/shared';

describe('KrishiConnect Complete Authentication & Authorization Suite', () => {
  const uniqueSuffix = Date.now().toString().slice(-6);
  const farmerEmail = `farmer.test.${uniqueSuffix}@krishiconnect.in`;
  const farmerPhone = `9822${uniqueSuffix}`;
  const vendorEmail = `vendor.test.${uniqueSuffix}@krishiconnect.in`;
  const vendorPhone = `9823${uniqueSuffix}`;

  let farmerUserId = '';
  let farmerRefreshToken = '';
  let resetOtpCode = '';

  it('1. Registers a new Farmer with full profile & address persistence', async () => {
    const res = await AuthService.registerFarmer({
      firstName: 'Kishan',
      lastName: 'Rao',
      email: farmerEmail,
      phone: farmerPhone,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      farmSize: 4.5,
      farmSizeUnit: 'acres',
      village: 'Pimpalgaon',
      city: 'Niphad',
      district: 'Nashik',
      state: 'Maharashtra',
      completeAddress: 'Gat No 42, Canal Road',
      pincode: '422209',
      preferredLanguage: 'en',
      termsAccepted: true,
    });

    expect(res.user).toBeDefined();
    expect(res.user.email).toBe(farmerEmail.toLowerCase());
    expect(res.user.phone).toBe(farmerPhone);
    expect(res.user.role).toBe(UserRole.FARMER);
    expect(res.user.farmerProfile).toBeDefined();
    expect(res.user.farmerProfile.status).toBe(VerificationStatus.APPROVED);
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(res.user.passwordHash).toBeUndefined(); // Password must never leak
    farmerRefreshToken = res.refreshToken;
  });

  it('2. Blocks duplicate email or phone registration for Farmers', async () => {
    await expect(
      AuthService.registerFarmer({
        firstName: 'Dup',
        lastName: 'User',
        email: farmerEmail,
        phone: '9999999999',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        farmSize: 2,
        farmSizeUnit: 'acres',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        preferredLanguage: 'en',
        termsAccepted: true,
      })
    ).rejects.toThrow(/already exists/i);
  });

  it('3. Registers a new Vendor / Shop Owner with PENDING verification status & bank info', async () => {
    const res = await AuthService.registerVendor({
      firstName: 'Mahesh',
      lastName: 'Patel',
      businessName: `Patel Agro Kendra ${uniqueSuffix}`,
      email: vendorEmail,
      phone: vendorPhone,
      password: 'VendorPass@123',
      confirmPassword: 'VendorPass@123',
      businessAddress: 'Shop 5, APMC Market Yard',
      city: 'Anand',
      district: 'Anand',
      state: 'Gujarat',
      pincode: '388001',
      businessType: 'Retailer',
      categories: ['Seeds & Seedlings', 'Fertilizers & Nutrients'],
      establishedSince: '2018',
      gstin: '24AAAAA0000A1Z5',
      bankAccountNumber: '123456789012',
      bankIfsc: 'SBIN0001234',
      bankAccountName: 'Mahesh Patel',
      bankName: 'State Bank of India',
      preferredLanguage: 'en',
      termsAccepted: true,
    });

    expect(res.user).toBeDefined();
    expect(res.user.role).toBe(UserRole.VENDOR);
    expect(res.user.vendorProfile).toBeDefined();
    expect(res.user.vendorProfile.status).toBe(VendorStatus.PENDING);
    expect(res.accessToken).toBeDefined();
  });

  it('4. Allows Login using either Email OR 10-digit Mobile Number', async () => {
    // Login with email
    const emailLogin = await AuthService.login({
      identifier: farmerEmail,
      password: 'Password@123',
      rememberMe: true,
    });
    expect(emailLogin.user.email).toBe(farmerEmail.toLowerCase());
    expect(emailLogin.accessToken).toBeDefined();

    // Login with mobile number
    const phoneLogin = await AuthService.login({
      identifier: farmerPhone,
      password: 'Password@123',
      rememberMe: false,
    });
    expect(phoneLogin.user.phone).toBe(farmerPhone);
    expect(phoneLogin.accessToken).toBeDefined();
  });

  it('5. Rejects invalid password attempts with 401 error', async () => {
    await expect(
      AuthService.login({
        identifier: farmerEmail,
        password: 'WrongPassword!',
        rememberMe: false,
      })
    ).rejects.toThrow(/Password does not match|Invalid credentials/i);
  });

  it('6. Authenticates Super Admin securely', async () => {
    const adminLogin = await AuthService.login({
      identifier: 'admin@krishiconnect.in',
      password: process.env.ADMIN_PASSWORD || 'AdminKrishi#2026',
      rememberMe: false,
    });
    expect(adminLogin.user.role).toBe(UserRole.ADMIN);
    expect(adminLogin.accessToken).toBeDefined();
  });

  it('7. Dispatches Forgot Password code and successfully Resets Password', async () => {
    const forgotRes = await AuthService.forgotPassword({
      identifier: farmerEmail,
    });
    expect(forgotRes.success).toBe(true);
    expect(forgotRes.devCode).toBeDefined();
    resetOtpCode = forgotRes.devCode!;

    const resetRes = await AuthService.resetPassword({
      identifier: farmerEmail,
      token: resetOtpCode,
      password: 'NewSecurePassword#2026',
    });
    expect(resetRes.success).toBe(true);

    // Verify prior refresh token was revoked on password reset
    await expect(AuthService.refreshSession(farmerRefreshToken)).rejects.toThrow(/revoked or expired/i);

    // Verify login works with the NEW password
    const newLogin = await AuthService.login({
      identifier: farmerEmail,
      password: 'NewSecurePassword#2026',
      rememberMe: false,
    });
    expect(newLogin.accessToken).toBeDefined();
    farmerUserId = newLogin.user.id;
    farmerRefreshToken = newLogin.refreshToken;
  });

  it('8. Refreshes session token and revokes on Logout', async () => {
    const refreshRes = await AuthService.refreshSession(farmerRefreshToken);
    expect(refreshRes.accessToken).toBeDefined();

    const logoutRes = await AuthService.logout(farmerUserId, farmerRefreshToken);
    expect(logoutRes.success).toBe(true);

    // Refreshing with revoked token must throw
    await expect(AuthService.refreshSession(farmerRefreshToken)).rejects.toThrow(/revoked or expired/i);
  });

  it('9. Resends verification OTP and marks contact verified upon confirmation', async () => {
    const resendRes = await AuthService.resendVerification({
      identifier: farmerEmail,
      type: 'EMAIL_VERIFICATION',
    });
    expect(resendRes.success).toBe(true);
    expect(resendRes.devCode).toBeDefined();

    const verifyRes = await AuthService.verifyOtp({
      identifier: farmerEmail,
      otp: resendRes.devCode!,
      type: 'EMAIL_VERIFICATION',
    });
    expect(verifyRes.success).toBe(true);

    // Using the same OTP a second time must be rejected
    await expect(
      AuthService.verifyOtp({
        identifier: farmerEmail,
        otp: resendRes.devCode!,
        type: 'EMAIL_VERIFICATION',
      })
    ).rejects.toThrow(/Invalid or expired/i);
  });
});
