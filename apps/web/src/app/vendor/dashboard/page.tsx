'use client';

import React, { Suspense } from 'react';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { VendorAccessGuard } from '@/components/vendor/VendorAccessGuard';

export default function VendorDashboardPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading vendor workspace...</div>}>
      <VendorAccessGuard requireApproved={false}>
        <DashboardView type="vendor" />
      </VendorAccessGuard>
    </Suspense>
  );
}
