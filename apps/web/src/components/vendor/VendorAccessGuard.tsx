'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, ShieldAlert, ShoppingBag, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface VendorAccessGuardProps {
  requireApproved?: boolean;
  children: React.ReactNode;
}

export const VendorAccessGuard: React.FC<VendorAccessGuardProps> = ({
  requireApproved = true,
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="container" style={{ padding: '64px 20px' }}>
        <div
          className="account-card"
          style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', padding: '48px 28px' }}
        >
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
            Checking shop owner permissions...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container" style={{ padding: '64px 20px' }}>
        <div
          className="account-card"
          style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', padding: '42px 28px' }}
        >
          <div
            className="account-card-icon"
            style={{ width: '58px', height: '58px', borderRadius: '50%', margin: '0 auto 14px' }}
          >
            <Store size={26} />
          </div>
          <h1 style={{ fontSize: '21px', fontWeight: 800, marginBottom: '8px' }}>
            Shop Owner Sign In Required
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '22px' }}>
            Only verified Shop Owners can access seller tools and list products on KrishiConnect.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="primary" style={{ textDecoration: 'none' }}>
              Sign In as Shop Owner
            </Link>
            <Link href="/register?role=vendor" className="outline-btn" style={{ textDecoration: 'none' }}>
              Register a Shop
            </Link>
            <Link href="/" className="outline-btn" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={15} /> Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (user.role !== 'VENDOR') {
    return (
      <main className="container" style={{ padding: '64px 20px' }}>
        <div
          className="account-card"
          style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center', padding: '42px 28px' }}
        >
          <div
            className="account-card-icon"
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#b91c1c',
              margin: '0 auto 14px',
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <h1 style={{ fontSize: '21px', fontWeight: 800, marginBottom: '8px' }}>
            Selling is Only Available for Verified Shop Owners
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '22px' }}>
            Your account is registered as <b>{user.role === 'FARMER' ? 'Farmer / Buyer' : user.role}</b>.
            Farmer accounts are for purchasing agricultural inputs and services—only verified Shop Owners
            can sell products on KrishiConnect.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" className="primary" style={{ textDecoration: 'none' }}>
              <ShoppingBag size={15} /> Browse Marketplace
            </Link>
            <Link href="/" className="outline-btn" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={15} /> Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const vendorStatus = user.vendorProfile?.status || 'PENDING';
  if (requireApproved && vendorStatus !== 'APPROVED') {
    return (
      <main className="container" style={{ padding: '64px 20px' }}>
        <div
          className="account-card"
          style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center', padding: '42px 28px' }}
        >
          <div
            className="account-card-icon"
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: vendorStatus === 'REJECTED' ? '#fef2f2' : '#fef3c7',
              color: vendorStatus === 'REJECTED' ? '#b91c1c' : '#b45309',
              margin: '0 auto 14px',
            }}
          >
            {vendorStatus === 'REJECTED' ? <ShieldAlert size={26} /> : <Clock size={26} />}
          </div>
          <span
            className={`account-badge ${vendorStatus === 'REJECTED' ? 'red' : 'amber'}`}
            style={{ marginBottom: '10px' }}
          >
            SHOP VERIFICATION STATUS: {vendorStatus}
          </span>
          <h1 style={{ fontSize: '21px', fontWeight: 800, marginBottom: '8px' }}>
            Shop Verification Required to Sell
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '22px' }}>
            {vendorStatus === 'REJECTED'
              ? user.vendorProfile?.rejectionReason ||
                user.vendorProfile?.verificationRemarks ||
                'Your shop verification was rejected. Please review and resubmit your compliance documents.'
              : 'Your Shop Owner application is awaiting admin verification. Product listing, inventory, and selling remain locked until approved.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/vendor/verification" className="primary" style={{ textDecoration: 'none' }}>
              View Shop Verification Status
            </Link>
            <Link href="/" className="outline-btn" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={15} /> Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};

export default VendorAccessGuard;

