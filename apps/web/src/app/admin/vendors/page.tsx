'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, ShieldCheck, CheckCircle2, XCircle, Clock, ArrowLeft, FileText } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminVendorsPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/admin/vendors?status=${statusFilter}` : '/admin/vendors';
      const res = await ApiClient.get(url);
      if (res.success && res.data) {
        setVendors(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchVendors();
  }, [user, statusFilter]);

  const handleReview = async (vendorId: string, decision: string) => {
    const defaultRemark = decision === 'APPROVED' ? 'State licenses and GST credentials verified.' : 'Missing required documentation.';
    const remarks = prompt(`Enter review remarks for ${decision}:`, defaultRemark);
    if (!remarks) return;

    try {
      const res = await ApiClient.patch(`/admin/vendors/${vendorId}/review`, {
        status: decision,
        remarks,
      });

      if (res.success) {
        alert(`Vendor ${decision} successfully.`);
        fetchVendors();
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
          <h1 className="text-3xl font-extrabold text-forest-950">Vendor Verifications Queue</h1>
          <p className="text-xs text-forest-600">Review business profiles, licenses, and record compliance decisions.</p>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white border border-forest-200 text-xs font-bold text-forest-900 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Only</option>
          <option value="APPROVED">Approved Only</option>
          <option value="REJECTED">Rejected Only</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-forest-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="p-6 rounded-3xl bg-white border border-forest-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-forest-950">{v.businessName}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      v.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                <p className="text-xs text-forest-600">
                  Contact: <span className="font-bold text-forest-900">{v.user?.fullName}</span> • Email: {v.user?.email} • Phone: {v.user?.phone}
                </p>

                <p className="text-xs text-forest-500">
                  Address: {v.businessAddress}, {v.city}, {v.state} - {v.pincode} • GSTIN: {v.gstin || 'N/A'} • License: {v.licenseNumber || 'N/A'}
                </p>

                {v.documents && v.documents.length > 0 && (
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[10px] text-forest-400 font-bold uppercase">Documents:</span>
                    {v.documents.map((d: any) => (
                      <span key={d.id} className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-forest-50 border border-forest-200 text-[10px] text-forest-800">
                        <FileText className="w-3 h-3 text-forest-600" />
                        <span>{d.fileName}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                {v.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleReview(v.id, 'APPROVED')}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Approve Vendor
                  </button>
                )}

                {v.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleReview(v.id, 'REJECTED')}
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

