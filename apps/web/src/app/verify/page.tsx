'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { hero } from '@/lib/referenceData';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get('email') || searchParams.get('phone') || searchParams.get('identifier') || '';
  const initialToken = searchParams.get('token') || '';
  const initialType = (searchParams.get('type') || 'EMAIL_VERIFICATION').toUpperCase();

  const { user, refreshUser } = useAuth();

  const [identifier, setIdentifier] = useState(initialIdentifier || user?.email || user?.phone || '');
  const [otp, setOtp] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-verify if full token supplied in URL
  useEffect(() => {
    if (initialToken && identifier) {
      handleVerify(initialToken);
    }
  }, []);

  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || otp).trim();
    if (!code) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await ApiClient.post('/auth/verify-otp', {
        identifier: identifier.trim(),
        otp: code,
        type: identifier.includes('@') ? 'EMAIL_VERIFICATION' : 'PHONE_OTP',
      });

      setSuccess(true);
      await refreshUser();
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    try {
      const res = await ApiClient.post('/auth/resend-otp', {
        identifier: identifier.trim(),
        type: identifier.includes('@') ? 'EMAIL_VERIFICATION' : 'PHONE_OTP',
      });

      if (res?.data?.devCode) {
        setDevCode(res.data.devCode);
        setOtp(res.data.devCode);
      }
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
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
            <ShieldCheck size={16} /> Official Identity Verification
          </span>
          <h1>
            Verify your
            <br />
            account details.
          </h1>
          <p>
            Ensuring genuine farmers and certified input vendors across India. We protect your agricultural data with end-to-end security.
          </p>
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
          <span className="kicker">ACCOUNT SECURITY</span>

          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
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
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>Account Verified!</h1>
              <p style={{ color: '#66736a', fontSize: '14px', marginBottom: '24px' }}>
                Your contact details for <b>{identifier}</b> have been confirmed. You now have full access to KrishiConnect.
              </p>
              <button
                type="button"
                className="primary full"
                onClick={() => {
                  if (user?.role === 'ADMIN') {
                    router.push('/admin/dashboard');
                  } else if (user?.role === 'VENDOR') {
                    router.push(
                      user.vendorProfile?.status === 'APPROVED'
                        ? '/vendor/dashboard'
                        : '/vendor/verification'
                    );
                  } else {
                    router.push('/');
                  }
                }}
              >
                Proceed to Dashboard <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <h1>Enter Verification Code</h1>
              <p>
                We’ve sent a 6-digit confirmation code to <b>{identifier || 'your account'}</b>.
              </p>

              {devCode && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#92400e',
                    marginBottom: '16px',
                  }}
                >
                  ⚡ <b>Development Fallback Code:</b> <code>{devCode}</code>
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

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
              >
                {!identifier && (
                  <label>
                    Email or Mobile Number
                    <input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. farmer@krishiconnect.in"
                      required
                    />
                  </label>
                )}

                <label>
                  6-Digit Verification Code
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6 digits"
                    style={{
                      fontSize: '20px',
                      letterSpacing: '4px',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                    maxLength={6}
                    required
                  />
                </label>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '16px 0',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#66736a' }}>
                    {canResend ? (
                      'Didn’t receive the code?'
                    ) : (
                      <>
                        <Clock size={13} style={{ display: 'inline', verticalAlign: '-1px' }} /> Resend in {countdown}s
                      </>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend}
                    className="link-btn"
                    style={{ opacity: canResend ? 1 : 0.5, cursor: canResend ? 'pointer' : 'not-allowed' }}
                  >
                    Resend Code
                  </button>
                </div>

                <button type="submit" className="primary full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          <div className="auth-footer" style={{ marginTop: '24px' }}>
            Need help?{' '}
            <Link href="/support" className="link-btn">
              <b>Contact Krishi Support</b>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#66736a' }}>Loading verification...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

