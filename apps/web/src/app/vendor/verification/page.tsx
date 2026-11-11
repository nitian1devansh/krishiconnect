'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Upload, FileText, CheckCircle2, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { VendorAccessGuard } from '@/components/vendor/VendorAccessGuard';

export default function VendorVerificationPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Upload Form
  const [docType, setDocType] = useState('GST_CERTIFICATE');
  const [docUrl, setDocUrl] = useState('');
  const [fileName, setFileName] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/vendor/profile');
      if (res.success) setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'VENDOR') {
      fetchProfile();
    }
  }, [user]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUrl || !fileName) return;

    try {
      const res = await ApiClient.post('/vendor/documents', {
        documentType: docType,
        documentUrl: docUrl,
        fileName,
      });

      if (res.success) {
        alert('Document uploaded successfully. Admin will verify it.');
        setDocUrl('');
        setFileName('');
        fetchProfile();
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  return (
    <VendorAccessGuard requireApproved={false}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <Link href="/vendor/dashboard" className="text-xs text-forest-600 hover:text-forest-900 flex items-center space-x-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Vendor Dashboard</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-forest-950">Vendor Verification & Legal Compliance</h1>
        <p className="text-xs text-forest-600">Provide required business details, contact information, address, and applicable licenses or registration documents.</p>
      </div>

      {/* Verification Status Card */}
      <div className="p-6 rounded-3xl bg-white border border-forest-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-forest-100 pb-3">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-forest-800" />
            <div>
              <h2 className="font-bold text-sm text-forest-950">Verification Status</h2>
              <p className="text-xs text-forest-500">Required before products can become publicly visible in the marketplace.</p>
            </div>
          </div>

          <div>
            {profile?.status === 'APPROVED' ? (
              <span className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Vendor</span>
              </span>
            ) : profile?.status === 'REJECTED' ? (
              <span className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                <XCircle className="w-4 h-4" />
                <span>Verification Rejected</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                <Clock className="w-4 h-4" />
                <span>Under Review (PENDING)</span>
              </span>
            )}
          </div>
        </div>

        {profile?.verificationRemarks && (
          <div className="p-4 bg-forest-50 rounded-2xl text-xs space-y-1">
            <span className="font-bold text-forest-900">Administrator Review Remarks:</span>
            <p className="text-forest-700">{profile.verificationRemarks}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
          <div className="bg-[#f9fbf5] p-3 rounded-xl">
            <span className="text-[10px] text-forest-500 block font-bold">Business Name</span>
            <span className="font-bold text-forest-900">{profile?.businessName}</span>
          </div>
          <div className="bg-[#f9fbf5] p-3 rounded-xl">
            <span className="text-[10px] text-forest-500 block font-bold">GSTIN</span>
            <span className="font-bold text-forest-900">{profile?.gstin || 'Not Provided'}</span>
          </div>
          <div className="bg-[#f9fbf5] p-3 rounded-xl">
            <span className="text-[10px] text-forest-500 block font-bold">Seed/Pesticide License</span>
            <span className="font-bold text-forest-900">{profile?.licenseNumber || 'Not Provided'}</span>
          </div>
          <div className="bg-[#f9fbf5] p-3 rounded-xl">
            <span className="text-[10px] text-forest-500 block font-bold">Commission Rate</span>
            <span className="font-bold text-forest-900">{profile?.commissionRate || 5.0}%</span>
          </div>
        </div>
      </div>

      {/* Upload Document Form */}
      <div className="p-6 rounded-3xl bg-white border border-forest-200 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-forest-950 border-b border-forest-100 pb-3 flex items-center space-x-2">
          <Upload className="w-4 h-4 text-forest-800" />
          <span>Upload Registration & License Documents</span>
        </h2>

        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-forest-900 block mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-forest-200 text-xs text-forest-900 outline-none"
              >
                <option value="GST_CERTIFICATE">GST Registration Certificate</option>
                <option value="SEED_LICENSE">State Seed Dealer License</option>
                <option value="PESTICIDE_LICENSE">Insecticides Act License</option>
                <option value="PAN_CARD">Company PAN Card</option>
                <option value="BANK_PROOF">Bank Passbook / Cancelled Cheque</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-forest-900 block mb-1">File Name</label>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. state_seed_license.pdf"
                className="w-full px-3 py-2 rounded-xl border border-forest-200 text-xs text-forest-900 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-forest-900 block mb-1">Document URL / Storage Path</label>
              <input
                type="text"
                required
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="/uploads/seed_license.pdf"
                className="w-full px-3 py-2 rounded-xl border border-forest-200 text-xs text-forest-900 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-forest-900 hover:bg-forest-950 text-white font-bold text-xs uppercase tracking-wider"
          >
            Submit Document
          </button>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="p-6 rounded-3xl bg-white border border-forest-200 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-forest-950 border-b border-forest-100 pb-3">
          Submitted Verification Documents ({profile?.documents?.length || 0})
        </h2>

        {profile?.documents && profile.documents.length > 0 ? (
          <div className="divide-y divide-forest-50">
            {profile.documents.map((doc: any) => (
              <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-forest-700" />
                  <div>
                    <p className="font-bold text-forest-950">{doc.fileName}</p>
                    <p className="text-[10px] text-forest-500">{doc.documentType} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  {doc.isVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Verified ✓
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Pending Audit
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-forest-500 italic">No verification documents submitted yet.</p>
        )}
      </div>

      </div>
    </VendorAccessGuard>
  );
}

