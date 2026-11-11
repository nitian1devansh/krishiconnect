'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterVendorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/register?role=vendor');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#66736a' }}>Loading Vendor Registration...</p>
    </div>
  );
}

