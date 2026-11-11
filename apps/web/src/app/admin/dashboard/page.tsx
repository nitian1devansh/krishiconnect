'use client';

import React, { Suspense } from 'react';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading admin console...</div>}>
      <DashboardView type="admin" />
    </Suspense>
  );
}
