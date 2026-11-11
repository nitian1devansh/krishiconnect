'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('KrishiConnect route error:', error);
  }, [error]);

  return (
    <main className="container" style={{ padding: '64px 20px' }}>
      <div
        className="account-card"
        style={{
          maxWidth: '540px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '40px 28px',
        }}
      >
        <div
          className="account-card-icon"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#fef2f2',
            color: '#b91c1c',
            margin: '0 auto 14px',
          }}
        >
          <AlertTriangle size={26} />
        </div>
        <h1 style={{ fontSize: '21px', fontWeight: 800, marginBottom: '8px' }}>
          Something interrupted this view
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '22px' }}>
          We caught a temporary rendering or session error before it could break your browsing. Try reloading this section or returning home.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="primary" onClick={() => reset()}>
            <RefreshCw size={15} /> Try Again
          </button>
          <Link href="/" className="outline-btn" style={{ textDecoration: 'none' }}>
            <Home size={15} /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

