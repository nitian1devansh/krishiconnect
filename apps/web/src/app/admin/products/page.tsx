'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShieldCheck, CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { handleProductImageError, resolveProductImage, VERIFIED_AGRI_PHOTO } from '@/lib/media';

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/admin/products/review?status=${statusFilter}` : '/admin/products/review';
      const res = await ApiClient.get(url);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchProducts();
  }, [user, statusFilter]);

  const handleReview = async (productId: string, decision: string) => {
    const defaultRemark = decision === 'APPROVED' ? 'Compliance verified with agricultural norms.' : 'Required dosage or registration details missing.';
    const remarks = prompt(`Enter review remarks for ${decision}:`, defaultRemark);
    if (!remarks) return;

    try {
      const res = await ApiClient.patch(`/admin/products/${productId}/review`, {
        status: decision,
        remarks,
      });

      if (res.success) {
        alert(`Product ${decision} successfully.`);
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.message || 'Review failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/dashboard" className="text-xs text-forest-600 hover:text-forest-900 flex items-center space-x-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Control Center</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-forest-950">Product Review & Approval Queue</h1>
          <p className="text-xs text-forest-600">Ensure newly submitted products remain unpublished until compliance verification.</p>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white border border-forest-200 text-xs font-bold text-forest-900 outline-none"
        >
          <option value="PENDING_REVIEW">Pending Review Only</option>
          <option value="APPROVED">Approved Products</option>
          <option value="REJECTED">Rejected Products</option>
          <option value="">All Statuses</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-forest-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-forest-200 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-forest-950">No products awaiting review</h3>
          <p className="text-xs text-forest-600">The product compliance moderation queue is all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-3xl bg-white border border-forest-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
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
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        p.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <p className="text-xs text-forest-600">
                    Vendor: <span className="font-bold text-forest-900">{p.vendor?.businessName}</span> (License: {p.vendor?.licenseNumber || 'Verified'}) • Category: {p.category?.name}
                  </p>

                  <p className="text-xs text-forest-500">
                    Crops: {p.suitableCrops?.join(', ') || 'General'} • Batch: {p.batchNumber || 'N/A'} • Organic: {p.organicCertified ? 'Yes (NPOP)' : 'Conventional'}
                  </p>
                </div>
              </div>

              {/* Moderation Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                {p.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleReview(p.id, 'APPROVED')}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Approve Listing
                  </button>
                )}

                {p.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleReview(p.id, 'REJECTED')}
                    className="px-4 py-2 rounded-full border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

