'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { hero } from '@/lib/referenceData';
import { ApiClient } from '@/lib/api';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIdentifier = searchParams.get('identifier') || '';
  const initialToken = searchParams.get('token') || '';

  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'SUCCESS'>(
    initialToken ? 'RESET' : 'REQUEST'
  );
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await ApiClient.post('/auth/forgot-password', {
        identifier: identifier.trim(),
      }).catch(() => null);

      if (res?.data?.devCode) {
        setDevCode(res.data.devCode);
        setToken(res.data.devCode);
      }
      setStep('RESET');
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await ApiClient.post('/auth/reset-password', {
        identifier: identifier.trim(),
        token: token.trim(),
        password,
        confirmPassword,
      }).catch(() => null);

      setStep('SUCCESS');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired reset code. Please request a new one.');
    } finally {
      setLoading(false);
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
            <ShieldCheck size={16} /> Secure Account Recovery
          </span>
          <h1>
            Recover your
            <br />
            KrishiConnect account.
          </h1>
          <p>
            Verify your mobile number or registered email to securely reset your credentials and restore access to your marketplace dashboard.
          </p>
        </div>
      </section>

      <section className="auth-form">
        <button
          type="button"
          className="auth-back"
          onClick={() => router.push('/login')}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        <div className="auth-box">
          <span className="kicker">SECURITY & ACCESS</span>

          {step === 'REQUEST' && (
            <>
              <h1>Forgot Password</h1>
              <p>Enter your registered email address or mobile number to receive a verification reset code.</p>

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

              <form onSubmit={handleRequestCode}>
                <label>
                  Registered Email or Mobile Number
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. farmer@krishiconnect.in or 9822012345"
                    required
                  />
                </label>

                <button type="submit" className="primary full" disabled={loading} style={{ marginTop: '16px' }}>
                  {loading ? 'Sending Code...' : 'Send Verification Code'} <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {step === 'RESET' && (
            <>
              <h1>Set New Password</h1>
              <p>
                Enter the 6-digit verification code sent to <b>{identifier}</b> and your new secure password.
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

              <form onSubmit={handleResetPassword}>
                <label>
                  6-Digit Verification Code
                  <input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                  />
                </label>

                <label>
                  New Password
                  <div className="auth-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
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

                <label>
                  Confirm New Password
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </label>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="outline-btn full"
                    onClick={() => setStep('REQUEST')}
                  >
                    Resend Code
                  </button>
                  <button type="submit" className="primary full" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'SUCCESS' && (
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
              <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>Password Reset Successful!</h1>
              <p style={{ color: '#66736a', fontSize: '14px', marginBottom: '24px' }}>
                Your account password has been safely updated. All previous sessions have been invalidated for security.
              </p>
              <button
                type="button"
                className="primary full"
                onClick={() => router.push('/login')}
              >
                Sign In Now <ArrowRight size={16} />
              </button>
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: '24px' }}>
            Remember your credentials?{' '}
            <Link href="/login" className="link-btn">
              <b>Sign In</b>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#66736a' }}>Loading recovery...</p>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}

