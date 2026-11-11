'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus, Edit, CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { handleProductImageError, resolveProductImage, VERIFIED_AGRI_PHOTO } from '@/lib/media';
import { VendorAccessGuard } from '@/components/vendor/VendorAccessGuard';

export default function VendorProductsListPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'VENDOR' || user.vendorProfile?.status !== 'APPROVED') return;
    ApiClient.get('/vendor/products')
      .then((res) => {
        if (res.success && res.data) {
          setProducts(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Live</span>
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Admin Review</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      default:
        return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-[11px] font-bold">{status}</span>;
    }
  };

  const handleUpdateStock = async (variantId: string, currentStock: number) => {
    const input = prompt('Enter new stock quantity:', currentStock.toString());
    if (input === null) return;
    const qty = parseInt(input, 10);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid non-negative number.');
      return;
    }

    try {
      const res = await ApiClient.patch(`/vendor/inventory/${variantId}`, { stockQuantity: qty });
      if (res.success) {
        alert('Stock updated successfully.');
        // Refresh products list
        const refreshed = await ApiClient.get('/vendor/products');
        if (refreshed.success) setProducts(refreshed.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  return (
    <VendorAccessGuard requireApproved={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex items-center justify-between">
        <div>
          <Link href="/vendor/dashboard" className="text-xs text-forest-600 hover:text-forest-900 flex items-center space-x-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vendor Portal</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-forest-950">Store Product Listings</h1>
          <p className="text-xs text-forest-600">Manage listing details, inventory stock, and monitor compliance review statuses.</p>
        </div>

        <Link
          href="/vendor/products/new"
          className="flex items-center space-x-1 px-5 py-2.5 rounded-full bg-meadow-400 hover:bg-meadow-500 text-forest-950 font-bold text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-forest-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-forest-200 space-y-4">
          <Package className="w-12 h-12 text-forest-400 mx-auto" />
          <h3 className="font-bold text-forest-950">No products submitted yet</h3>
          <p className="text-xs text-forest-600 max-w-sm mx-auto">
            Add your certified seeds, fertilizers, or farm machinery to sell to farmers across India.
          </p>
          <Link
            href="/vendor/products/new"
            className="inline-block px-6 py-2.5 rounded-full bg-forest-900 text-white text-xs font-bold"
          >
            Submit First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-white border border-forest-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-2xl bg-forest-50 overflow-hidden shrink-0">
                  <img
                    src={resolveProductImage(p.images?.[0]?.url || VERIFIED_AGRI_PHOTO)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={handleProductImageError}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-forest-950">{p.title}</h3>
                    {getStatusBadge(p.status)}
                  </div>
                  <p className="text-xs text-forest-500">
                    Category: {p.category?.name} • Batch: {p.batchNumber || 'N/A'} • Rating: {Number(p.rating).toFixed(1)} ★
                  </p>
                  {p.rejectionReason && (
                    <p className="text-[11px] text-red-600 font-medium">Rejection Reason: {p.rejectionReason}</p>
                  )}
                </div>
              </div>

              {/* Variants and Stock */}
              <div className="space-y-2 text-right">
                <div className="flex flex-wrap gap-2 justify-end">
                  {p.variants?.map((v: any) => (
                    <div
                      key={v.id}
                      className="px-3 py-1.5 rounded-xl bg-[#f4f7ee] border border-forest-200 text-xs text-forest-900 flex items-center space-x-2"
                    >
                      <span className="font-bold">{v.title}: ₹{Number(v.price).toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => handleUpdateStock(v.id, v.inventory?.stockQuantity || 0)}
                        className="px-2 py-0.5 rounded-full bg-forest-900 text-white font-bold text-[10px] hover:bg-forest-800"
                        title="Click to adjust stock"
                      >
                        Stock: {v.inventory?.stockQuantity || 0}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>
    </VendorAccessGuard>
  );
}

