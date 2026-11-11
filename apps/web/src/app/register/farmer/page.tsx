'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterFarmerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/register?role=farmer');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#66736a' }}>Loading Farmer Registration...</p>
    </div>
  );
}

