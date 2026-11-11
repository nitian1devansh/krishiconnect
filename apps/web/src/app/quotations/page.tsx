'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Plus, CheckCircle2, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function BulkQuotationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState('Quintal');
  const [targetPrice, setTargetPrice] = useState('');
  const [location, setLocation] = useState('Anand, Gujarat');
  const [pincode, setPincode] = useState('388310');
  const [neededByDate, setNeededByDate] = useState('2026-11-15');
  const [notes, setNotes] = useState('');

  const fetchRequests = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await ApiClient.get('/quotations/requests/customer');
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ApiClient.get('/catalog/products?limit=20')
      .then((res) => {
        if (res.success && res.data) {
          setProducts(res.data);
          if (res.data[0]) setSelectedProductId(res.data[0].id);
        }
      })
      .catch((err) => console.error(err));

    fetchRequests();
  }, [user]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.post('/quotations/requests', {
        productId: selectedProductId,
        quantity: Number(quantity),
        unit,
        targetPricePerUnit: targetPrice ? Number(targetPrice) : undefined,
        deliveryLocation: location,
        deliveryPincode: pincode,
        neededByDate,
        additionalNotes: notes,
      });

      if (res.success) {
        alert('Bulk RFQ submitted successfully! Suppliers will submit quotations.');
        setShowForm(false);
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit quote request');
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      const res = await ApiClient.patch(`/quotations/quotes/${quoteId}/accept`);
      if (res.success) {
        alert('Quotation accepted! You can now proceed to checkout.');
        fetchRequests();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept quote');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="pill-badge text-forest-800 border-forest-300">FPO & WHOLESALE</span>
          <h1 className="text-3xl font-extrabold text-forest-950 mt-1">Bulk Quotations & Tenders</h1>
          <p className="text-xs text-forest-600">Submit volume procurement requests for farmer collectives, FPOs, and large farm estates.</p>
        </div>

        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-forest-900 hover:bg-forest-950 text-white font-bold text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Cancel Request' : 'Create Bulk RFQ'}</span>
          </button>
        )}
      </div>

      {/* RFQ Form */}
      {showForm && (
        <div className="p-8 rounded-4xl bg-white border border-forest-200 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-forest-950 border-b border-forest-100 pb-2">
            Submit New Request for Quotation (RFQ)
          </h2>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-forest-900 block mb-1">Target Agricultural Input</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-forest-200 text-xs text-forest-900 outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-forest-900 block mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-forest-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-forest-900 block mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-forest-200 text-xs"
                  >
                    <option>Quintal</option>
                    <option>Bags</option>
                    <option>Ton</option>
                    <option>Litres</option>
                    <option>Units / Pieces</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-forest-900 block mb-1">Target Price / Unit (Optional ₹)</label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g. 1750"
                  className="w-full px-3 py-2.5 rounded-xl border border-forest-200 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-forest-900 block mb-1">Delivery Destination / District</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-forest-200 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-forest-900 block mb-1">Delivery PIN Code</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-forest-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-forest-900 block mb-1">Needed by Date</label>
                <input
                  type="date"
                  required
                  value={neededByDate}
                  onChange={(e) => setNeededByDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-forest-200 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-forest-900 block mb-1">Logistics / Payment Terms Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Requires farm-gate offloading, 50% advance on dispatch..."
                  className="w-full px-3 py-2.5 rounded-xl border border-forest-200 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-forest-900 text-white font-bold text-xs uppercase tracking-wider"
            >
              Broadcast RFQ to Suppliers
            </button>
          </form>
        </div>
      )}

      {/* Customer RFQ List */}
      <div className="space-y-4">
        <h2 className="font-bold text-base text-forest-950">Your Submitted Quotation Requests</h2>

        {!user ? (
          <div className="p-8 bg-white rounded-3xl border border-forest-200 text-center text-xs text-forest-600">
            Please log in to manage your wholesale quotation requests.
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-forest-200 text-center text-xs text-forest-600">
            No quotation requests submitted yet. Click "Create Bulk RFQ" to receive supplier pricing.
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((req) => (
              <div key={req.id} className="p-6 rounded-3xl bg-white border border-forest-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-forest-100">
                  <div>
                    <h3 className="font-bold text-sm text-forest-950">{req.product?.title}</h3>
                    <p className="text-xs text-forest-500">
                      Quantity: <span className="font-bold text-forest-900">{req.quantity} {req.unit}</span> • Deliver to: {req.deliveryLocation} ({req.deliveryPincode})
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-forest-100 text-forest-900 text-[11px] font-bold">
                    Status: {req.status}
                  </span>
                </div>

                {/* Submitted Vendor Quotes */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-forest-600">
                    Received Vendor Quotations ({req.vendorQuotations?.length || 0})
                  </p>

                  {req.vendorQuotations?.length === 0 ? (
                    <p className="text-xs text-forest-400 italic">Suppliers are preparing competitive bids...</p>
                  ) : (
                    req.vendorQuotations.map((vq: any) => (
                      <div key={vq.id} className="p-3 bg-[#f8faf2] rounded-2xl border border-forest-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-forest-950">{vq.vendor?.businessName}</p>
                          <p className="text-forest-600">
                            Quoted: <span className="font-bold text-forest-900">₹{Number(vq.quotedPricePerUnit).toLocaleString('en-IN')} / {req.unit}</span> • Shipping: ₹{Number(vq.shippingCostTotal).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-forest-400">Terms: {vq.paymentTerms} • Valid until {new Date(vq.validUntil).toLocaleDateString()}</p>
                        </div>

                        {vq.status === 'ACCEPTED' ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Accepted ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcceptQuote(vq.id)}
                            className="px-4 py-1.5 rounded-full bg-meadow-400 hover:bg-meadow-500 text-forest-950 font-bold text-xs"
                          >
                            Accept Quote
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

