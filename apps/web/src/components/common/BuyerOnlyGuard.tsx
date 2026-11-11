'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface BuyerOnlyGuardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/** Blocks Shop Owner (VENDOR) accounts from buyer/purchasing routes since they sell only. */
export const BuyerOnlyGuard: React.FC<BuyerOnlyGuardProps> = ({
  children,
  title = 'Purchasing Disabled for Shop Owners',
  description = 'Shop owner accounts can only sell agricultural products on KrishiConnect and cannot add items to cart, checkout, or place purchase orders.',
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="container" style={{ padding: '64px 20px' }}>
        <div
          className="account-card"
          style={{ maxWidth: '540px', margin: '0 auto', textAlign: 'center', padding: '42px 28px' }}
        >
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
            Checking account permissions...
          </p>
        </div>
      </main>
    );
  }

  if (user?.role === 'VENDOR') {
    const sellerHref =
      user.vendorProfile?.status === 'APPROVED' ? '/vendor/dashboard' : '/vendor/verification';
    const sellerLabel =
      user.vendorProfile?.status === 'APPROVED'
        ? 'Open Vendor Workspace'
        : 'Check Shop Verification Status';

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
          <h1 style={{ fontSize: '21px', fontWeight: 800, marginBottom: '8px' }}>{title}</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '22px' }}>
            {description}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={sellerHref} className="primary" style={{ textDecoration: 'none' }}>
              <Store size={15} /> {sellerLabel}
            </Link>
            <Link href="/" className="outline-btn" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={15} /> Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};

