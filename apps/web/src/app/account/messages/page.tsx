'use client';

import React, { Suspense } from 'react';
import { AccountShell } from '@/components/account/AccountShell';
import { MessagingCenter } from '@/components/dashboard/MessagingCenter';

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading messages...</div>}>
      <AccountShell sectionTitle="Messages & Chat" sectionTitleHi="संदेश और चैट">
        <div className="account-card" style={{ padding: '14px' }}>
          <MessagingCenter isAdmin={false} />
        </div>
      </AccountShell>
    </Suspense>
  );
}
