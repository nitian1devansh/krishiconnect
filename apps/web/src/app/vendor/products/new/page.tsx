'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AddProductSection } from '@/components/vendor/AddProductSection';
import { VendorAccessGuard } from '@/components/vendor/VendorAccessGuard';

export default function AddNewProductPage() {
  const router = useRouter();

  return (
    <VendorAccessGuard requireApproved={true}>
      <div className="min-h-screen bg-[#f7faf7] py-6">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AddProductSection
            onCancel={() => router.push('/vendor/products')}
            cancelHref="/vendor/products"
          />
        </main>
      </div>
    </VendorAccessGuard>
  );
}
