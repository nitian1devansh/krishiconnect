'use client';

import React, { Suspense } from 'react';
import { SoilTestingModule } from '@/components/soil/SoilTestingModule';

export default function SoilTestingPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading Soil Testing Laboratory...</div>}>
      <SoilTestingModule />
    </Suspense>
  );
}

