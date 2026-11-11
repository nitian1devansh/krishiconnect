'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Store,
  UploadCloud,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/common/Logo';
import { hero } from '@/lib/referenceData';
import { ApiClient } from '@/lib/api';

const PRODUCT_CATEGORIES = [
  'Seeds & Seedlings',
  'Fertilizers & Nutrients',
  'Crop Protection',
  'Farm Machinery',
  'Irrigation Systems',
  'Organic Inputs',
];

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Bihar',
  'Chhattisgarh',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role')?.toLowerCase() === 'vendor' ? 'Vendor' : 'Farmer';
  const { login, user } = useAuth();

  const [role, setRole] = useState<'Farmer' | 'Vendor'>(initialRole);
  const [submittedStatus, setSubmittedStatus] = useState<
    'NONE' | 'FARMER_REGISTERED' | 'PENDING_VERIFICATION' | 'REJECTED'
  >('NONE');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Keep role tab synced if URL query changes (e.g., /register/farmer vs /register/vendor)
  useEffect(() => {
    const r = searchParams.get('role')?.toLowerCase();
    if (r === 'vendor') setRole('Vendor');
    else if (r === 'farmer') setRole('Farmer');
  }, [searchParams]);

  // Farmer Form State
  const [farmerData, setFarmerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    farmSize: 5,
    farmSizeUnit: 'acres',
    village: '',
    city: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    completeAddress: '',
    pincode: '422003',
    preferredLanguage: 'en' as 'en' | 'hi',
    avatarUrl: '',
    password: '',
    confirmPassword: '',
    termsAccepted: true,
  });

  // Vendor Form State
  const [vendorData, setVendorData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    gstin: '',
    licenseNumber: '',
    businessAddress: '',
    village: '',
    district: 'Nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    pincode: '422003',
    establishedSince: '2019',
    businessType: 'Retailer',
    categories: ['Seeds & Seedlings', 'Fertilizers & Nutrients'] as string[],
    description: '',
    logoName: '',
    gstDocName: '',
    verificationDocName: '',
    identityDocName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankAccountName: '',
    bankName: '',
    termsAccepted: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if current logged-in user is pending or rejected
  useEffect(() => {
    if (user?.role === 'VENDOR' && user.vendorProfile) {
      if (user.vendorProfile.status === 'PENDING') {
        setSubmittedStatus('PENDING_VERIFICATION');
      } else if (user.vendorProfile.status === 'REJECTED') {
        setSubmittedStatus('REJECTED');
        setRejectionReason(
          user.vendorProfile.rejectionReason ||
            user.vendorProfile.verificationRemarks ||
            'Business license verification failed.'
        );
      }
    }
  }, [user]);

  const validatePhone = (phone: string) => /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));

  const toggleCategory = (cat: string) => {
    setVendorData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleFilePick = (
    field: 'gstDocName' | 'verificationDocName' | 'identityDocName' | 'logoName',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setVendorData((prev) => ({ ...prev, [field]: file.name }));
    }
  };

  const handleFarmerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(farmerData.phone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!/^\d{6}$/.test(farmerData.pincode)) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (farmerData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (farmerData.password !== farmerData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (!farmerData.termsAccepted) {
      setError('You must accept the KrishiConnect Terms and Conditions.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: `${farmerData.firstName} ${farmerData.lastName}`.trim(),
        firstName: farmerData.firstName,
        lastName: farmerData.lastName,
        email: farmerData.email.toLowerCase(),
        phone: farmerData.phone.replace(/\D/g, ''),
        password: farmerData.password,
        confirmPassword: farmerData.confirmPassword,
        farmSize: Number(farmerData.farmSize),
        farmSizeUnit: farmerData.farmSizeUnit,
        village: farmerData.village,
        city: farmerData.city,
        district: farmerData.district,
        state: farmerData.state,
        completeAddress: farmerData.completeAddress,
        pincode: farmerData.pincode,
        preferredLanguage: farmerData.preferredLanguage,
        avatarUrl: farmerData.avatarUrl || undefined,
        termsAccepted: farmerData.termsAccepted,
      };

      const res = await ApiClient.post('/auth/register/farmer', payload);
      const token = res?.data?.accessToken || res?.data?.token;
      const registeredUser = res?.data?.user;

      if (!res?.success || !registeredUser || !token) {
        throw new Error(res?.message || 'Registration failed. Please verify your information.');
      }

      if (res?.data?.verification?.devCode) {
        setDevOtpCode(res.data.verification.devCode);
      }
      login(token, registeredUser, res?.data?.refreshToken);
      setSubmittedStatus('FARMER_REGISTERED');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(vendorData.phone)) {
      setError('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!/^\d{6}$/.test(vendorData.pincode)) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (vendorData.categories.length === 0) {
      setError('Please select at least one agricultural product category.');
      return;
    }

    if (vendorData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (vendorData.password !== vendorData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (!vendorData.termsAccepted) {
      setError('You must accept the KrishiConnect Seller Agreement.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: `${vendorData.firstName} ${vendorData.lastName}`.trim(),
        firstName: vendorData.firstName,
        lastName: vendorData.lastName,
        businessName: vendorData.shopName,
        email: vendorData.email.toLowerCase(),
        phone: vendorData.phone.replace(/\D/g, ''),
        password: vendorData.password,
        confirmPassword: vendorData.confirmPassword,
        businessAddress: vendorData.businessAddress,
        village: vendorData.village,
        district: vendorData.district,
        city: vendorData.city,
        state: vendorData.state,
        pincode: vendorData.pincode,
        establishedSince: vendorData.establishedSince,
        businessType: vendorData.businessType,
        categories: vendorData.categories,
        licenseNumber: vendorData.licenseNumber,
        gstin: vendorData.gstin,
        description: vendorData.description,
        gstCertificateUrl: vendorData.gstDocName ? `/uploads/${vendorData.gstDocName}` : undefined,
        verificationDocumentUrl: vendorData.verificationDocName
          ? `/uploads/${vendorData.verificationDocName}`
          : undefined,
        bankAccountNumber: vendorData.bankAccountNumber,
        bankIfsc: vendorData.bankIfsc,
        bankAccountName:
          vendorData.bankAccountName || `${vendorData.firstName} ${vendorData.lastName}`.trim(),
        bankName: vendorData.bankName,
        termsAccepted: vendorData.termsAccepted,
      };

      const res = await ApiClient.post('/auth/register/vendor', payload);
      const token = res?.data?.accessToken || res?.data?.token;
      const registeredUser = res?.data?.user;

      if (!res?.success || !registeredUser || !token) {
        throw new Error(res?.message || 'Registration failed. Please check your information.');
      }

      if (res?.data?.verification?.devCode) {
        setDevOtpCode(res.data.verification.devCode);
      }
      login(token, registeredUser, res?.data?.refreshToken);
      setSubmittedStatus('PENDING_VERIFICATION');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = () => {
    setSubmittedStatus('NONE');
    setRejectionReason('');
  };

  // Shared Left Visual Brand Hero
  const VisualPanel = ({ tag, titleLine1, titleLine2, description }: { tag: string; titleLine1: string; titleLine2: string; description: string }) => (
    <section className="auth-visual">
      <img src={hero} alt="KrishiConnect Agriculture" />
      <div className="auth-overlay" />
      <Logo onClick={() => router.push('/')} />
      <div>
        <span className="hero-tag">
          <ShieldCheck size={16} /> {tag}
        </span>
        <h1>
          {titleLine1}
          <br />
          {titleLine2}
        </h1>
        <p>{description}</p>
        <div className="auth-stats">
          <span>
            <b>50K+</b> Verified Farmers
          </span>
          <span>
            <b>500+</b> Agri Shops
          </span>
          <span>
            <b>18K+</b> Pincodes Served
          </span>
        </div>
      </div>
    </section>
  );

  // -------------------------------------------------------------
  // VIEW 0: FARMER REGISTRATION COMPLETE (NO VERIFICATION REQUIRED)
  // -------------------------------------------------------------
  if (submittedStatus === 'FARMER_REGISTERED') {
    return (
      <main className="auth">
        <VisualPanel
          tag="India’s trusted agri marketplace"
          titleLine1="Welcome to"
          titleLine2="KrishiConnect."
          description="Your farmer buyer account is active immediately—browse seeds, fertilizers, soil testing, and trusted agri shops."
        />

        <section className="auth-form">
          <button type="button" className="auth-back" onClick={() => router.push('/')}>
            <ArrowLeft /> Back to marketplace
          </button>

          <div className="auth-box auth-box-wide" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#e8f5e9',
                color: '#2e7d32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Check size={30} />
            </div>

            <span className="status-pill approved" style={{ display: 'inline-block' }}>
              ACCOUNT ACTIVE
            </span>

            <h1 style={{ marginTop: '14px' }}>Welcome to KrishiConnect!</h1>

            <p>
              Your farmer account has been created and is ready to use immediately—no verification wait required.
            </p>

            {devOtpCode && (
              <div
                style={{
                  background: 'var(--light)',
                  border: '1px solid #c8e6c9',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '13px',
                  color: 'var(--dark)',
                  marginBottom: '18px',
                }}
              >
                🔑 <b>Optional Email Confirmation Code (Dev Mode):</b> <code>{devOtpCode}</code>{' '}
                <Link
                  href={`/verify?email=${encodeURIComponent(user?.email || farmerData.email)}`}
                  className="link-btn"
                  style={{ marginLeft: '6px' }}
                >
                  Confirm Email →
                </Link>
              </div>
            )}

            <div className="auth-form-section" style={{ textAlign: 'left' }}>
              <div className="auth-section-head" style={{ marginBottom: '10px' }}>
                <span className="auth-section-badge">
                  <BadgeCheck size={14} />
                </span>
                <div>
                  <b>Account Summary</b>
                  <small>Your registered farmer profile</small>
                </div>
              </div>

              <div className="auth-grid-2" style={{ fontSize: '12px', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Farmer Name</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginTop: '2px' }}>
                    {user?.fullName || `${farmerData.firstName} ${farmerData.lastName}`}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Registered Mobile</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginTop: '2px' }}>
                    +91 {user?.phone || farmerData.phone}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Farm Size</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginTop: '2px' }}>
                    {user?.farmerProfile?.farmSize || farmerData.farmSize}{' '}
                    {user?.farmerProfile?.farmSizeUnit || farmerData.farmSizeUnit}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Location</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginTop: '2px' }}>
                    {user?.farmerProfile?.district || farmerData.district},{' '}
                    {user?.farmerProfile?.state || farmerData.state}
                  </strong>
                </div>
              </div>
            </div>

            <div className="auth-grid-2">
              <button
                type="button"
                className="primary full"
                onClick={() => router.push('/')}
              >
                Start Shopping
              </button>
              <Link
                href={`/verify?email=${encodeURIComponent(user?.email || farmerData.email)}`}
                className="outline-btn full"
                style={{ textDecoration: 'none' }}
              >
                <BadgeCheck size={16} /> Confirm Email (OTP)
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: SHOP OWNER PENDING VERIFICATION SCREEN
  // -------------------------------------------------------------
  if (submittedStatus === 'PENDING_VERIFICATION' && (role === 'Vendor' || user?.role === 'VENDOR')) {
    return (
      <main className="auth">
        <VisualPanel
          tag="India’s trusted agri marketplace"
          titleLine1="Shop Verification"
          titleLine2="In Progress."
          description="To protect Indian farmers and ensure 100% genuine agricultural inputs, every shop owner application undergoes verification."
        />

        <section className="auth-form">
          <button type="button" className="auth-back" onClick={() => router.push('/')}>
            <ArrowLeft /> Back to marketplace
          </button>

          <div className="auth-box auth-box-wide" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fef3c7',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Clock size={30} />
            </div>

            <span className="status-pill pending" style={{ display: 'inline-block' }}>
              SHOP APPLICATION UNDER REVIEW
            </span>

            <h1 style={{ marginTop: '14px' }}>Shop Verification Pending</h1>

            <p>
              Thank you for registering your agri shop with KrishiConnect. Admin approval is required before you can list products or sell on the marketplace.
            </p>

            {devOtpCode && (
              <div
                style={{
                  background: 'var(--light)',
                  border: '1px solid #c8e6c9',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '13px',
                  color: 'var(--dark)',
                  marginBottom: '18px',
                }}
              >
                🔑 <b>OTP Verification Code (Dev Mode):</b> <code>{devOtpCode}</code>{' '}
                <Link
                  href={`/verify?email=${encodeURIComponent(user?.email || vendorData.email)}`}
                  className="link-btn"
                  style={{ marginLeft: '6px' }}
                >
                  Verify Contact →
                </Link>
              </div>
            )}

            <div className="auth-form-section" style={{ textAlign: 'left' }}>
              <div className="auth-section-head" style={{ marginBottom: '10px' }}>
                <span className="auth-section-badge">
                  <BadgeCheck size={14} />
                </span>
                <div>
                  <b>Shop Application Summary</b>
                  <small>Submitted business verification information</small>
                </div>
              </div>

              <div className="auth-grid-2" style={{ fontSize: '12px', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Applicant Name</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginTop: '2px' }}>
                    {user?.fullName || `${vendorData.firstName} ${vendorData.lastName}`}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Registered Mobile</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginTop: '2px' }}>
                    +91 {user?.phone || vendorData.phone}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Shop Name</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginTop: '2px' }}>
                    {user?.vendorProfile?.businessName || vendorData.shopName}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>GSTIN / Trade License</span>
                  <strong style={{ display: 'block', color: 'var(--ink)', marginTop: '2px' }}>
                    {user?.vendorProfile?.gstin ||
                      vendorData.gstin ||
                      vendorData.licenseNumber ||
                      'Pending Document Check'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="auth-grid-2">
              <button
                type="button"
                className="outline-btn full"
                onClick={() => router.push('/vendor/verification')}
              >
                View Verification Status
              </button>
              <Link
                href={`/verify?email=${encodeURIComponent(user?.email || vendorData.email)}`}
                className="primary full"
                style={{ textDecoration: 'none' }}
              >
                <BadgeCheck size={16} /> Verify Email / OTP
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: REJECTED STATUS & RESUBMISSION SCREEN
  // -------------------------------------------------------------
  if (submittedStatus === 'REJECTED') {
    return (
      <main className="auth">
        <VisualPanel
          tag="Attention Required"
          titleLine1="Application Needs"
          titleLine2="Correction."
          description="Our verification team reviewed your profile and requested updates before full activation."
        />

        <section className="auth-form">
          <button type="button" className="auth-back" onClick={() => router.push('/')}>
            <ArrowLeft /> Back to marketplace
          </button>

          <div className="auth-box auth-box-wide" style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <ShieldAlert size={30} />
            </div>

            <span className="status-pill rejected" style={{ display: 'inline-block' }}>
              VERIFICATION NOT APPROVED
            </span>

            <h1 style={{ marginTop: '14px' }}>Action Needed on Application</h1>

            <div
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '11px',
                padding: '16px',
                textAlign: 'left',
                margin: '16px 0 22px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#be123c',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Admin Remarks:
              </span>
              <p style={{ color: '#881337', fontSize: '13px', fontWeight: 600, margin: '6px 0 0' }}>
                “{rejectionReason || 'Please provide valid agricultural registration proof and ensure your contact phone is reachable.'}”
              </p>
            </div>

            <button type="button" className="primary full" onClick={handleResubmit}>
              <RefreshCw size={16} /> Update & Resubmit Application
            </button>
          </div>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: STRUCTURED REGISTRATION FORMS (FARMER & SHOP OWNER)
  // -------------------------------------------------------------
  return (
    <main className="auth">
      <VisualPanel
        tag="India’s trusted agri marketplace"
        titleLine1="Growing together,"
        titleLine2="one harvest at a time."
        description="Join thousands of farmers and verified agricultural suppliers building a transparent farm-input ecosystem across India."
      />

      <section className="auth-form">
        <button type="button" className="auth-back" onClick={() => router.push('/')}>
          <ArrowLeft /> Back to marketplace
        </button>

        <div className="auth-box auth-box-wide">
          <span className="kicker">WELCOME TO KRISHICONNECT</span>
          <h1>{role === 'Farmer' ? 'Create farmer account' : 'Register your agri shop'}</h1>
          <p>
            {role === 'Farmer'
              ? 'Get verified doorstep delivery for certified seeds, soil labs, fertilizers, and crop advisory.'
              : 'Reach 50,000+ active farmers directly. Quick verification for genuine agri-input dealers.'}
          </p>

          {/* App-Native Role Switcher */}
          <div className="role-tabs">
            <button
              type="button"
              className={role === 'Farmer' ? 'active' : ''}
              onClick={() => {
                setRole('Farmer');
                setError('');
              }}
            >
              <User /> Farmer
            </button>
            <button
              type="button"
              className={role === 'Vendor' ? 'active' : ''}
              onClick={() => {
                setRole('Vendor');
                setError('');
              }}
            >
              <Store /> Shop Owner / Vendor
            </button>
          </div>

          {error && (
            <div
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#991b1b',
                padding: '11px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {/* ===================================================== */}
          {/* A. FARMER REGISTRATION FORM */}
          {/* ===================================================== */}
          {role === 'Farmer' && (
            <form onSubmit={handleFarmerSubmit}>
              {/* Section 1: Personal Details */}
              <div className="auth-form-section">
                <div className="auth-section-head">
                  <span className="auth-section-badge">1</span>
                  <div>
                    <b>Personal & Contact Details</b>
                    <small>Used for order updates and advisor calls</small>
                  </div>
                </div>

                <div className="auth-grid-2">
                  <label>
                    First Name *
                    <input
                      value={farmerData.firstName}
                      onChange={(e) => setFarmerData({ ...farmerData, firstName: e.target.value })}
                      placeholder="e.g. Ramesh"
                      required
                    />
                  </label>
                  <label>
                    Last Name *
                    <input
                      value={farmerData.lastName}
                      onChange={(e) => setFarmerData({ ...farmerData, lastName: e.target.value })}
                      placeholder="e.g. Patil"
                      required
                    />
                  </label>
                </div>

                <div className="auth-grid-2">
                  <label>
                    Email Address *
                    <input
                      type="email"
                      value={farmerData.email}
                      onChange={(e) => setFarmerData({ ...farmerData, email: e.target.value })}
                      placeholder="ramesh.patil@example.com"
                      required
                    />
                  </label>
                  <label>
                    Mobile Number *
                    <div className="phone-input">
                      <span>+91</span>
                      <input
                        value={farmerData.phone}
                        onChange={(e) =>
                          setFarmerData({
                            ...farmerData,
                            phone: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        placeholder="98765 43210"
                        maxLength={10}
                        required
                      />
                    </div>
                  </label>
                </div>

                <label style={{ marginBottom: 0 }}>
                  Preferred App & Advisory Language
                  <select
                    value={farmerData.preferredLanguage}
                    onChange={(e) =>
                      setFarmerData({
                        ...farmerData,
                        preferredLanguage: e.target.value as 'en' | 'hi',
                      })
                    }
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </label>
              </div>

              {/* Section 2: Farm Profile & Address */}
              <div className="auth-form-section">
                <div className="auth-section-head">
                  <span className="auth-section-badge">2</span>
                  <div>
                    <b>Farm Size & Delivery Location</b>
                    <small>Ensures accurate regional advisory & logistics</small>
                  </div>
                </div>

                <div className="auth-grid-2">
                  <label>
                    Total Farm Size *
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={farmerData.farmSize}
                      onChange={(e) =>
                        setFarmerData({
                          ...farmerData,
                          farmSize: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="e.g. 5"
                      required
                    />
                  </label>
                  <label>
                    Land Area Unit *
                    <select
                      value={farmerData.farmSizeUnit}
                      onChange={(e) =>
                        setFarmerData({ ...farmerData, farmSizeUnit: e.target.value })
                      }
                    >
                      <option value="acres">Acres</option>
                      <option value="hectares">Hectares</option>
                      <option value="bigha">Bigha</option>
                    </select>
                  </label>
                </div>

                <label>
                  Complete Farm / Street Address *
                  <input
                    value={farmerData.completeAddress}
                    onChange={(e) =>
                      setFarmerData({ ...farmerData, completeAddress: e.target.value })
                    }
                    placeholder="Plot No / Gat No / Canal Road Landmark"
                    required
                  />
                </label>

                <div className="auth-grid-2">
                  <label>
                    Village / Locality *
                    <input
                      value={farmerData.village}
                      onChange={(e) => setFarmerData({ ...farmerData, village: e.target.value })}
                      placeholder="e.g. Pimpalgaon"
                      required
                    />
                  </label>
                  <label>
                    City / Tehsil *
                    <input
                      value={farmerData.city}
                      onChange={(e) => setFarmerData({ ...farmerData, city: e.target.value })}
                      placeholder="e.g. Niphad"
                      required
                    />
                  </label>
                </div>

                <div className="auth-grid-3" style={{ marginBottom: 0 }}>
                  <label style={{ marginBottom: 0 }}>
                    District *
                    <input
                      value={farmerData.district}
                      onChange={(e) =>
                        setFarmerData({ ...farmerData, district: e.target.value })
                      }
                      placeholder="e.g. Nashik"
                      required
                    />
                  </label>
                  <label style={{ marginBottom: 0 }}>
                    State *
                    <select
                      value={farmerData.state}
                      onChange={(e) => setFarmerData({ ...farmerData, state: e.target.value })}
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ marginBottom: 0 }}>
                    PIN Code *
                    <input
                      value={farmerData.pincode}
                      onChange={(e) =>
                        setFarmerData({
                          ...farmerData,
                          pincode: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      placeholder="422003"
                      maxLength={6}
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Section 3: Account Security */}
              <div className="auth-form-section">
                <div className="auth-section-head">
                  <span className="auth-section-badge">3</span>
                  <div>
                    <b>Account Security</b>
                    <small>Choose a strong password for your account</small>
                  </div>
                </div>

                <div className="auth-grid-2">
                  <label style={{ marginBottom: 0 }}>
                    Password *
                    <div className="auth-input-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={farmerData.password}
                        onChange={(e) =>
                          setFarmerData({ ...farmerData, password: e.target.value })
                        }
                        placeholder="Min 6 characters"
                        required
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                  <label style={{ marginBottom: 0 }}>
                    Confirm Password *
                    <div className="auth-input-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={farmerData.confirmPassword}
                        onChange={(e) =>
                          setFarmerData({ ...farmerData, confirmPassword: e.target.value })
                        }
                        placeholder="Re-enter password"
                        required
                      />
                    </div>
                  </label>
                </div>
              </div>

              <label className="auth-checkbox-row">
                <input
                  type="checkbox"
                  checked={farmerData.termsAccepted}
                  onChange={(e) =>
                    setFarmerData({ ...farmerData, termsAccepted: e.target.checked })
                  }
                />
                <span>
                  I accept the <u style={{ color: 'var(--green)' }}>Terms & Conditions</u> and
                  Privacy Policy, and confirm my farming profile details are accurate.
                </span>
              </label>

              <button type="submit" className="primary full" disabled={loading}>
                {loading ? 'Creating Farmer Account...' : 'Create Farmer Account'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ===================================================== */}
          {/* B. SHOP OWNER / VENDOR REGISTRATION FORM */}
          {/* ===================================================== */}
          {role === 'Vendor' && (
            <form onSubmit={handleVendorSubmit}>
              {/* Section 1: Owner Contact Details */}
              <div className="auth-form-section">
                <div className="auth-section-head">
                  <span className="auth-section-badge">1</span>
                  <div>
                    <b>Shop Owner Personal Details</b>
                    <small>Primary authorized representative</small>
                  </div>
                </div>

                <div className="auth-grid-2">
                  <label>
                    Owner First Name *
                    <input
                      value={vendorData.firstName}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, firstName: e.target.value })
                      }
                      placeholder="e.g. Suresh"
                      required
                    />
                  </label>
                  <label>
                    Owner Last Name *
                    <input
                      value={vendorData.lastName}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, lastName: e.target.value })
                      }
                      placeholder="e.g. Deshmukh"
                      required
                    />
                  </label>
                </div>

                <div className="auth-grid-2" style={{ marginBottom: 0 }}>
                  <label style={{ marginBottom: 0 }}>
                    Business Email Address *
                    <input
                      type="email"
                      value={vendorData.email}
                      onChange={(e) => setVendorData({ ...vendorData, email: e.target.value })}
                      placeholder="sales@greengrow.in"
                      required
                    />
                  </label>
                  <label style={{ marginBottom: 0 }}>
                    Mobile Number *
                    <div className="phone-input">
                      <span>+91</span>
                      <input
                        value={vendorData.phone}
                        onChange={(e) =>
                          setVendorData({
                            ...vendorData,
                            phone: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        placeholder="98765 43210"
                        maxLength={10}
                        required
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Section 2: Shop & Business Details */}
              <div className="auth-form-section">
                <div className="auth-section-head">
                  <span className="auth-section-badge">2</span>
                  <div>
                    <b>Business Profile & Categories</b>
                    <small>Information shown on your verified seller storefront</small>
                  </div>
                </div>

                <div className="auth-grid-2">
                  <label>
                    Shop / Business Name *
                    <input
                      value={vendorData.shopName}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, shopName: e.target.value })
                      }
                      placeholder="e.g. GreenGrow Seeds & Agro Kendra"
                      required
                    />
                  </label>
                  <label>
                    GSTIN (Optional)
                    <input
                      value={vendorData.gstin}
                      onChange={(e) =>
                        setVendorData({
                          ...vendorData,
                          gstin: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. 27AABCS1429B1Z8"
                      maxLength={15}
                    />
                  </label>
                </div>

                <div className="auth-grid-3">
                  <label>
                    Business Type *
                    <select
                      value={vendorData.businessType}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, businessType: e.target.value })
                      }
                    >
                      <option>Retailer</option>
                      <option>Wholesaler</option>
                      <option>Distributor</option>
                      <option>Manufacturer</option>
                      <option>Agri Cooperative</option>
                    </select>
                  </label>
                  <label>
                    Agri Trade License No.
                    <input
                      value={vendorData.licenseNumber}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, licenseNumber: e.target.value })
                      }
                      placeholder="Seed / Fertilizer Lic."
                    />
                  </label>
                  <label>
                    Established Year *
                    <input
                      value={vendorData.establishedSince}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, establishedSince: e.target.value })
                      }
                      placeholder="e.g. 2018"
                      required
                    />
                  </label>
                </div>

                <label>
                  Shop Overview / Specialty Description
                  <textarea
                    rows={2}
                    value={vendorData.description}
                    onChange={(e) =>
                      setVendorData({ ...vendorData, description: e.target.value })
                    }
                    placeholder="Briefly highlight key brands supplied and districts served..."
                  />
                </label>

                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                    Agricultural Product Categories *
                  </span>
                  <div className="auth-cat-grid">
                    {PRODUCT_CATEGORIES.map((cat) => {
                      const active = vendorData.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`auth-cat-pill ${active ? 'active' : ''}`}
                        >
                          {active && <Check size={12} />} {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 3: Shop Physical Address */}
              <div className="auth-form-section">
                <div className="auth-section-head">
                  <span className="auth-section-badge">3</span>
                  <div>
                    <b>Storefront Physical Location</b>
                    <small>Warehouse & dispatch hub address</small>
                  </div>
                </div>

                <label>
                  Complete Shop Address *
                  <input
                    value={vendorData.businessAddress}
                    onChange={(e) =>
                      setVendorData({ ...vendorData, businessAddress: e.target.value })
                    }
                    placeholder="Shop No. 12, Krishi Mandi Commercial Complex"
                    required
                  />
                </label>

                <div className="auth-grid-2">
                  <label>
                    Village / Market Area
                    <input
                      value={vendorData.village}
                      onChange={(e) => setVendorData({ ...vendorData, village: e.target.value })}
                      placeholder="e.g. APMC Yard Sector 2"
                    />
                  </label>
                  <label>
                    City / Town *
                    <input
                      value={vendorData.city}
                      onChange={(e) => setVendorData({ ...vendorData, city: e.target.value })}
                      placeholder="Nashik"
                      required
                    />
                  </label>
                </div>

                <div className="auth-grid-3" style={{ marginBottom: 0 }}>
                  <label style={{ marginBottom: 0 }}>
                    District *
                    <input
                      value={vendorData.district}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, district: e.target.value })
                      }
                      placeholder="Nashik"
                      required
                    />
                  </label>
                  <label style={{ marginBottom: 0 }}>
                    State *
                    <select
                      value={vendorData.state}
                      onChange={(e) => setVendorData({ ...vendorData, state: e.target.value })}
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ marginBottom: 0 }}>
                    PIN Code *
                    <input
                      value={vendorData.pincode}
                      onChange={(e) =>
                        setVendorData({
                          ...vendorData,
                          pincode: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      placeholder="422003"
                      maxLength={6}
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Section 4: Bank Payout & Document Uploads */}
              <div className="auth-form-section">
                <div className="auth-section-head">
                  <span className="auth-section-badge">4</span>
                  <div>
                    <b>Bank Payouts & Verification Documents</b>
                    <small>Required for automated escrow settlements & seller KYB</small>
                  </div>
                </div>

                <div className="auth-grid-2">
                  <label>
                    Bank Name
                    <input
                      value={vendorData.bankName}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, bankName: e.target.value })
                      }
                      placeholder="e.g. State Bank of India"
                    />
                  </label>
                  <label>
                    Account Holder Name
                    <input
                      value={vendorData.bankAccountName}
                      onChange={(e) =>
                        setVendorData({ ...vendorData, bankAccountName: e.target.value })
                      }
                      placeholder="Name on bank passbook"
                    />
                  </label>
                </div>

                <div className="auth-grid-2">
                  <label>
                    Bank Account Number
                    <input
                      value={vendorData.bankAccountNumber}
                      onChange={(e) =>
                        setVendorData({
                          ...vendorData,
                          bankAccountNumber: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      placeholder="e.g. 30458192045"
                    />
                  </label>
                  <label>
                    IFSC Code
                    <input
                      value={vendorData.bankIfsc}
                      onChange={(e) =>
                        setVendorData({
                          ...vendorData,
                          bankIfsc: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                    />
                  </label>
                </div>

                {/* File upload inputs */}
                <div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Upload Verification Files (PDF / JPG / PNG)
                  </span>

                  <div className="auth-upload-row">
                    <span>
                      <FileText size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px', color: 'var(--green)' }} />
                      GST Certificate (Optional)
                    </span>
                    <label className="auth-upload-btn" style={{ margin: 0, cursor: 'pointer' }}>
                      <UploadCloud size={13} />
                      <span>{vendorData.gstDocName || 'Choose File'}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFilePick('gstDocName', e)}
                      />
                    </label>
                  </div>

                  <div className="auth-upload-row">
                    <span>
                      <FileText size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px', color: 'var(--green)' }} />
                      Business License / Seed Permit
                    </span>
                    <label className="auth-upload-btn" style={{ margin: 0, cursor: 'pointer' }}>
                      <UploadCloud size={13} />
                      <span>{vendorData.verificationDocName || 'Choose File'}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFilePick('verificationDocName', e)}
                      />
                    </label>
                  </div>

                  <div className="auth-upload-row">
                    <span>
                      <FileText size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px', color: 'var(--green)' }} />
                      Owner Identity Proof (PAN / Aadhaar)
                    </span>
                    <label className="auth-upload-btn" style={{ margin: 0, cursor: 'pointer' }}>
                      <UploadCloud size={13} />
                      <span>{vendorData.identityDocName || 'Choose File'}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFilePick('identityDocName', e)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 5: Account Security */}
              <div className="auth-form-section">
                <div className="auth-section-head">
                  <span className="auth-section-badge">5</span>
                  <div>
                    <b>Account Security</b>
                    <small>Set login credentials for your Seller Workspace</small>
                  </div>
                </div>

                <div className="auth-grid-2">
                  <label style={{ marginBottom: 0 }}>
                    Account Password *
                    <div className="auth-input-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={vendorData.password}
                        onChange={(e) =>
                          setVendorData({ ...vendorData, password: e.target.value })
                        }
                        placeholder="Min 6 characters"
                        required
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                  <label style={{ marginBottom: 0 }}>
                    Confirm Password *
                    <div className="auth-input-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={vendorData.confirmPassword}
                        onChange={(e) =>
                          setVendorData({ ...vendorData, confirmPassword: e.target.value })
                        }
                        placeholder="Re-enter password"
                        required
                      />
                    </div>
                  </label>
                </div>
              </div>

              <label className="auth-checkbox-row">
                <input
                  type="checkbox"
                  checked={vendorData.termsAccepted}
                  onChange={(e) =>
                    setVendorData({ ...vendorData, termsAccepted: e.target.checked })
                  }
                />
                <span>
                  I accept the <u style={{ color: 'var(--green)' }}>KrishiConnect Seller Agreement</u>{' '}
                  and understand my shop will be activated upon Super Admin verification.
                </span>
              </label>

              <button type="submit" className="primary full" disabled={loading}>
                {loading ? 'Submitting Shop Application...' : 'Submit Shop Application'}{' '}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <p className="switch-auth">
            Already registered on KrishiConnect?{' '}
            <button type="button" onClick={() => router.push('/login')}>
              Sign in securely
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8faf7',
          }}
        >
          <p style={{ color: '#66736a', fontSize: '14px' }}>Loading registration...</p>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
