import { z } from 'zod';

// ==========================================
// 1. ENUMS & CONSTANTS
// ==========================================

export enum UserRole {
  FARMER = 'FARMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_OTP = 'PHONE_OTP',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export enum VerificationStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MORE_INFORMATION_REQUIRED = 'MORE_INFORMATION_REQUIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum VendorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MORE_INFORMATION_REQUIRED = 'MORE_INFORMATION_REQUIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',
  REFUND_PENDING = 'REFUND_PENDING',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NETBANKING = 'NETBANKING',
  COD = 'COD',
}

export enum QuotationStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED_FAVOR_CUSTOMER = 'RESOLVED_FAVOR_CUSTOMER',
  RESOLVED_FAVOR_VENDOR = 'RESOLVED_FAVOR_VENDOR',
  DISMISSED = 'DISMISSED',
}

// ==========================================
// 2. AUTHENTICATION & USER SCHEMAS
// ==========================================

export const RegisterFarmerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number'),
  farmSize: z.coerce.number().positive('Farm size must be greater than 0').optional().default(1),
  farmSizeUnit: z.enum(['acres', 'hectares', 'bigha']).default('acres'),
  village: z.string().optional(),
  city: z.string().optional(),
  district: z.string().min(2, 'District is required').optional().default('Nashik'),
  state: z.string().min(2, 'State is required').optional().default('Maharashtra'),
  completeAddress: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit Indian PIN code').optional().default('422003'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6).optional(),
  preferredLanguage: z.enum(['en', 'hi']).default('en'),
  avatarUrl: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
});

export type RegisterFarmerInput = z.infer<typeof RegisterFarmerSchema>;

export const RegisterVendorSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().min(2, 'Owner full name must be at least 2 characters').optional(),
  businessName: z.string().min(2, 'Shop / Business name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6).optional(),
  businessAddress: z.string().min(5, 'Shop address is required'),
  village: z.string().optional(),
  city: z.string().min(2, 'City is required').optional().default('Nashik'),
  district: z.string().min(2, 'District is required').optional().default('Nashik'),
  state: z.string().min(2, 'State is required').optional().default('Maharashtra'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit Indian PIN code'),
  businessType: z.string().optional().default('Retailer'),
  categories: z.union([z.array(z.string()), z.string()]).optional(),
  establishedSince: z.string().optional().default('2020'),
  licenseNumber: z.string().optional(),
  gstin: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  gstCertificateUrl: z.string().optional(),
  identityDocUrl: z.string().optional(),
  businessRegDocUrl: z.string().optional(),
  verificationDocumentUrl: z.string().optional(),
  panNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
  preferredLanguage: z.enum(['en', 'hi']).default('en'),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
});

export type RegisterVendorInput = z.infer<typeof RegisterVendorSchema>;

export const FarmerVerificationDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'MORE_INFORMATION_REQUIRED', 'SUSPENDED']),
  remarks: z.string().min(3, 'A reason / remarks is required for this action'),
});

export type FarmerVerificationDecisionInput = z.infer<typeof FarmerVerificationDecisionSchema>;

export const SoilTestReportSchema = z.object({
  sampleName: z.string().min(2, 'Sample name or field identifier is required'),
  soilType: z.string().min(2, 'Soil type is required'),
  phLevel: z.coerce.number().min(0).max(14, 'pH must be between 0 and 14'),
  nitrogenLevel: z.coerce.number().min(0, 'Nitrogen level must be non-negative'),
  phosphorusLevel: z.coerce.number().min(0, 'Phosphorus level must be non-negative'),
  potassiumLevel: z.coerce.number().min(0, 'Potassium level must be non-negative'),
  organicCarbon: z.coerce.number().min(0).optional(),
  reportFileUrl: z.string().optional(),
  recommendations: z.string().optional(),
});

export type SoilTestReportInput = z.infer<typeof SoilTestReportSchema>;

export const LoginSchema = z.object({
  identifier: z.string().min(1, 'Email or mobile number is required').optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
}).refine(data => data.identifier || data.email || data.phone, {
  message: 'Please provide either an email or phone number to sign in',
  path: ['identifier'],
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  identifier: z.string().min(3, 'Email or mobile number is required'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  identifier: z.string().optional(),
  token: z.string().min(4, 'Verification code or reset token is required'),
  password: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6).optional(),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const VerifyOtpSchema = z.object({
  identifier: z.string().min(3, 'Email or phone number is required'),
  otp: z.string().min(4, 'Valid OTP is required'),
  type: z.enum(['EMAIL_VERIFICATION', 'PHONE_OTP', 'PASSWORD_RESET']).default('PHONE_OTP'),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const ResendOtpSchema = z.object({
  identifier: z.string().min(3, 'Email or phone number is required'),
  type: z.enum(['EMAIL_VERIFICATION', 'PHONE_OTP']).default('PHONE_OTP'),
});

export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number').optional(),
  preferredLanguage: z.enum(['en', 'hi']).optional(),
  avatarUrl: z.string().optional().nullable(),
  farmerProfile: z
    .object({
      farmSize: z.coerce.number().positive('Farm size must be greater than 0').optional(),
      farmSizeUnit: z.enum(['acres', 'hectares', 'bigha']).optional(),
      village: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      district: z.string().min(2).optional(),
      state: z.string().min(2).optional(),
      pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit PIN code').optional().nullable(),
    })
    .optional(),
  vendorProfile: z
    .object({
      businessName: z.string().min(2).optional(),
      description: z.string().optional().nullable(),
      businessType: z.string().optional().nullable(),
      businessAddress: z.string().min(5).optional(),
      village: z.string().optional().nullable(),
      city: z.string().min(2).optional(),
      district: z.string().optional().nullable(),
      state: z.string().min(2).optional(),
      pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit PIN code').optional(),
      gstin: z.string().optional().nullable(),
      licenseNumber: z.string().optional().nullable(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6).optional(),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ==========================================
// 3. ADDRESS SCHEMAS
// ==========================================

export const AddressSchema = z.object({
  name: z.string().min(2, 'Recipient name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit phone number is required'),
  street: z.string().min(5, 'Street address is required'),
  villageOrLocality: z.string().optional(),
  city: z.string().min(2, 'City / Tehsil is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code is required'),
  isDefault: z.boolean().default(false),
  addressType: z.enum(['HOME', 'FARM', 'WAREHOUSE']).default('FARM'),
});

export type AddressInput = z.infer<typeof AddressSchema>;

// ==========================================
// 4. PRODUCT & CATALOG SCHEMAS
// ==========================================

export const ProductVariantSchema = z.object({
  title: z.string().min(1, 'Variant title is required (e.g., 1 Kg, 5 Litres, Pack of 10)'),
  sku: z.string().min(2, 'SKU is required'),
  price: z.number().positive('Price must be greater than 0'),
  mrp: z.number().positive('MRP must be greater than 0'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  weightKg: z.number().positive().optional(),
});

export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;

const ImageUrlOrUploadSchema = z
  .string()
  .trim()
  .min(1, 'Product image is required')
  .refine(
    (val) => {
      if (val.startsWith('/uploads/') || val.startsWith('/images/')) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Enter a valid http/https image URL or upload an image file' }
  );

export const ProductCreateSchema = z.object({
  title: z.string().min(3, 'Product title must be at least 3 characters'),
  titleHi: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  descriptionHi: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandName: z.string().optional(),
  images: z.array(ImageUrlOrUploadSchema).min(1, 'At least one product image is required'),
  suitableCrops: z.array(z.string()).default([]),
  dosageInstructions: z.string().optional(),
  activeIngredients: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  organicCertified: z.boolean().default(false),
  cibRegistrationNo: z.string().optional(),
  hsnCode: z.string().optional(),
  variants: z.array(ProductVariantSchema).min(1, 'At least one variant/pack size is required'),
});

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

export const ProductReviewDecisionSchema = z.object({
  status: z.enum([ProductStatus.APPROVED, ProductStatus.REJECTED, ProductStatus.CHANGES_REQUESTED]),
  remarks: z.string().min(3, 'Remarks or rejection reasons are required'),
});

export type ProductReviewDecisionInput = z.infer<typeof ProductReviewDecisionSchema>;

export const VendorVerificationDecisionSchema = z.object({
  status: z.enum([VendorStatus.APPROVED, VendorStatus.REJECTED, VendorStatus.MORE_INFORMATION_REQUIRED]),
  remarks: z.string().min(3, 'Remarks or notes are required'),
});

export type VendorVerificationDecisionInput = z.infer<typeof VendorVerificationDecisionSchema>;

// ==========================================
// 5. CART & CHECKOUT SCHEMAS
// ==========================================

export const AddToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;

export const CheckoutRequestSchema = z.object({
  addressId: z.string().min(1, 'Delivery address is required'),
  paymentMethod: z.enum([PaymentMethod.UPI, PaymentMethod.CARD, PaymentMethod.NETBANKING, PaymentMethod.COD]),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export type CheckoutRequestInput = z.infer<typeof CheckoutRequestSchema>;

export const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

// ==========================================
// 6. ORDER FULFILLMENT & TRACKING
// ==========================================

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ]),
  trackingNumber: z.string().optional(),
  carrierName: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ==========================================
// 7. REVIEW & RATINGS
// ==========================================

export const CreateReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  headline: z.string().min(2, 'Headline is required').max(100),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
  cropType: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ==========================================
// 8. BULK QUOTATION SCHEMAS
// ==========================================

export const CreateQuotationRequestSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required (e.g., Quintal, Kg, Bags, Litres)'),
  targetPricePerUnit: z.number().positive().optional(),
  deliveryLocation: z.string().min(3, 'Delivery location/district is required'),
  deliveryPincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
  neededByDate: z.string().min(4, 'Target date is required'),
  additionalNotes: z.string().optional(),
});

export type CreateQuotationRequestInput = z.infer<typeof CreateQuotationRequestSchema>;

export const SubmitVendorQuotationSchema = z.object({
  quotedPricePerUnit: z.number().positive('Quoted unit price must be positive'),
  shippingCostTotal: z.number().min(0, 'Shipping cost cannot be negative'),
  validUntil: z.string().min(4, 'Validity date is required'),
  paymentTerms: z.string().min(2, 'Payment terms required (e.g. 100% advance, 50-50, COD)'),
  vendorNotes: z.string().optional(),
});

export type SubmitVendorQuotationInput = z.infer<typeof SubmitVendorQuotationSchema>;

// ==========================================
// 9. MESSAGING & CALLING
// ==========================================

export const SendMessageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  productId: z.string().optional(),
  orderId: z.string().optional(),
  content: z.string().min(1, 'Message cannot be empty'),
  attachmentUrl: z.string().url().optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const InitiateCallSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  subject: z.string().default('Agricultural Consultation & Order Support'),
});

export type InitiateCallInput = z.infer<typeof InitiateCallSchema>;

// ==========================================
// 10. SUPPORT & DISPUTES
// ==========================================

export const CreateSupportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject is required'),
  category: z.string().min(2, 'Category is required'),
  priority: z.enum([TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT]).default(TicketPriority.MEDIUM),
  description: z.string().min(10, 'Detailed description is required'),
  orderId: z.string().optional(),
});

export type CreateSupportTicketInput = z.infer<typeof CreateSupportTicketSchema>;

