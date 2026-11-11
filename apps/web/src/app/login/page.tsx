'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/common/Logo';
import { hero } from '@/lib/referenceData';
import { ApiClient } from '@/lib/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const expired = searchParams.get('expired') === '1';
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('farmer@krishiconnect.in');
  const [password, setPassword] = useState('Farmer#12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [roleTab, setRoleTab] = useState<'Farmer' | 'Vendor' | 'Admin'>('Farmer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotDevCode, setForgotDevCode] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        identifier: identifier.trim(),
        password,
        rememberMe,
      };

      const res = await ApiClient.post('/auth/login', payload);

      if (res?.success && res.data?.user && (res.data.accessToken || res.data.token)) {
        login(res.data.accessToken || res.data.token, res.data.user, res.data.refreshToken);
        routeUser(res.data.user);
      } else {
        throw new Error(res?.message || 'Sign in failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please verify your email/phone and password.');
    } finally {
      setLoading(false);
    }
  };

  const routeUser = (u: any) => {
    if (u.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (u.role === 'VENDOR') {
      if (u.vendorProfile?.status === 'APPROVED') {
        router.push('/vendor/dashboard');
      } else {
        router.push('/vendor/verification');
      }
    } else {
      router.push(redirect || '/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.post('/auth/forgot-password', {
        identifier: forgotIdentifier,
      }).catch(() => null);

      setForgotSent(true);
      if (res?.data?.devCode) {
        setForgotDevCode(res.data.devCode);
      }
    } catch {
      setForgotSent(true);
    }
  };

  // Quick preset loader for test accounts
  const loadPreset = (preset: 'admin' | 'vendor_approved' | 'vendor_pending' | 'farmer') => {
    if (preset === 'admin') {
      setRoleTab('Admin');
      setIdentifier('admin@krishiconnect.in');
      setPassword('AdminKrishi#2026');
    } else if (preset === 'vendor_approved') {
      setRoleTab('Vendor');
      setIdentifier('vendor1@krishiconnect.in');
      setPassword('Vendor#12345');
    } else if (preset === 'vendor_pending') {
      setRoleTab('Vendor');
      setIdentifier('vendor3@krishiconnect.in');
      setPassword('Vendor#12345');
    } else if (preset === 'farmer') {
      setRoleTab('Farmer');
      setIdentifier('farmer@krishiconnect.in');
      setPassword('Farmer#12345');
    }
  };

  return (
    <main className="auth">
      <section className="auth-visual">
        <img src={hero} alt="KrishiConnect Fields" />
        <div className="auth-overlay" />
        <Logo />
        <div>
          <span className="hero-tag">
            <ShieldCheck size={16} /> India’s trusted agri marketplace
          </span>
          <h1>
            Growing together,
            <br />
            one harvest at a time.
          </h1>
          <p>
            Secure, verified access for farmers, agricultural suppliers, and marketplace administrators.
          </p>
          <div className="auth-stats">
            <span>
              <b>50K+</b> Farmers
            </span>
            <span>
              <b>500+</b> Shops
            </span>
            <span>
              <b>18K+</b> Pincodes
            </span>
          </div>
        </div>
      </section>

      <section className="auth-form">
        <button
          type="button"
          className="auth-back"
          onClick={() => router.push('/')}
        >
          <ArrowLeft size={16} /> Back to marketplace
        </button>

        <div className="auth-box">
          <span className="kicker">AUTHENTICATION</span>
          <h1>Sign in to your account</h1>
          <p>Enter your verified credentials to access your dashboard.</p>

          {/* Role selector */}
          <div className="role-tabs">
            <button
              type="button"
              className={roleTab === 'Farmer' ? 'active' : ''}
              onClick={() => {
                setRoleTab('Farmer');
                setIdentifier('farmer@krishiconnect.in');
                setPassword('Farmer#12345');
              }}
            >
              <User size={15} /> Farmer
            </button>
            <button
              type="button"
              className={roleTab === 'Vendor' ? 'active' : ''}
              onClick={() => {
                setRoleTab('Vendor');
                setIdentifier('vendor1@krishiconnect.in');
                setPassword('Vendor#12345');
              }}
            >
              <Store size={15} /> Vendor
            </button>
            <button
              type="button"
              className={roleTab === 'Admin' ? 'active' : ''}
              onClick={() => {
                setRoleTab('Admin');
                setIdentifier('admin@krishiconnect.in');
                setPassword('AdminKrishi#2026');
              }}
            >
              <ShieldCheck size={15} /> Super Admin
            </button>
          </div>

          {expired && !error && (
            <div
              style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Clock size={16} /> Your session expired. Please sign in again to continue.
            </div>
          )}

          {error && (
            <div
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label>
              Email or Mobile Number
              <div className="phone-input">
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or 10-digit mobile (e.g. 9822012345)"
                  required
                />
              </div>
            </label>

            <label>
              Password
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="auth-meta">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />{' '}
                Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifier(identifier);
                  setShowForgotModal(true);
                }}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="primary full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign in securely'} <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick One-Click Credentials Tester */}
          <div
            style={{
              marginTop: '20px',
              padding: '14px',
              background: '#f8faf7',
              border: '1px solid #dfe7df',
              borderRadius: '12px',
            }}
          >
            <b style={{ fontSize: '11px', textTransform: 'uppercase', color: '#66736a', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
              ⚡ One-Click Test Accounts
            </b>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
              <button
                type="button"
                className="outline-btn small"
                style={{ fontSize: '11px', padding: '6px 8px', justifyContent: 'center' }}
                onClick={() => loadPreset('farmer')}
              >
                🌾 Farmer Account
              </button>
              <button
                type="button"
                className="outline-btn small"
                style={{ fontSize: '11px', padding: '6px 8px', justifyContent: 'center' }}
                onClick={() => loadPreset('vendor_approved')}
              >
                🏪 Approved Vendor
              </button>
              <button
                type="button"
                className="outline-btn small"
                style={{ fontSize: '11px', padding: '6px 8px', justifyContent: 'center' }}
                onClick={() => loadPreset('vendor_pending')}
              >
                ⏳ Pending Vendor
              </button>
              <button
                type="button"
                className="outline-btn small"
                style={{ fontSize: '11px', padding: '6px 8px', justifyContent: 'center' }}
                onClick={() => loadPreset('admin')}
              >
                🛡️ Super Admin
              </button>
            </div>
          </div>

          <div className="auth-footer" style={{ marginTop: '20px' }}>
            Don’t have an account yet?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => router.push(roleTab === 'Vendor' ? '/register?role=vendor' : '/register?role=farmer')}
            >
              <b>Register as {roleTab === 'Vendor' ? 'Vendor / Shop Owner' : 'Farmer'}</b>
            </button>
          </div>
        </div>
      </section>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyRound size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px' }}>Reset Your Password</h3>
                <small style={{ color: '#66736a' }}>We will send verification instructions</small>
              </div>
            </div>

            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={38} style={{ color: '#2e7d32', margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 6px' }}>Instructions Dispatched</h4>
                <p style={{ fontSize: '13px', color: '#66736a', margin: '0 0 16px' }}>
                  If an account exists for <b>{forgotIdentifier}</b>, password reset instructions have been sent.
                </p>
                {forgotDevCode && (
                  <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#92400e', marginBottom: '16px' }}>
                    <b>Development Mode OTP:</b> <code>{forgotDevCode}</code>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="outline-btn full"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSent(false);
                    }}
                  >
                    Close
                  </button>
                  <Link
                    href={`/forgot-password?identifier=${encodeURIComponent(forgotIdentifier)}`}
                    className="primary full"
                    style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    Enter Reset Code
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p style={{ fontSize: '13px', color: '#66736a', margin: '0 0 14px' }}>
                  Enter your registered email address or 10-digit mobile number and we’ll send you a password reset code.
                </p>
                <label style={{ display: 'block', marginBottom: '16px' }}>
                  Email or Mobile
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. farmer@krishiconnect.in or 9822012345"
                    required
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="outline-btn full"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary full">
                    Send Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#66736a' }}>Loading login...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
