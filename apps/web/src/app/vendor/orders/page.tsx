'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle2, ArrowLeft, Clock } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { VendorAccessGuard } from '@/components/vendor/VendorAccessGuard';

export default function VendorOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/orders/vendor');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'VENDOR' && user.vendorProfile?.status === 'APPROVED') {
      fetchOrders();
    }
  }, [user]);

  const handleUpdateStatus = async (vendorOrderId: string, nextStatus: string) => {
    let trackingNumber: string | undefined;
    let carrierName: string | undefined;

    if (nextStatus === 'SHIPPED') {
      const track = prompt('Enter Shipment / Docket Tracking Number:');
      if (!track) return;
      trackingNumber = track;
      carrierName = prompt('Enter Carrier / Transport Name:', 'VRL Agri Logistics') || 'Regional Transporter';
    }

    try {
      const res = await ApiClient.patch(`/orders/vendor/${vendorOrderId}/status`, {
        status: nextStatus,
        trackingNumber,
        carrierName,
      });

      if (res.success) {
        alert(`Order status updated to ${nextStatus}`);
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  return (
    <VendorAccessGuard requireApproved={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <Link href="/vendor/dashboard" className="text-xs text-forest-600 hover:text-forest-900 flex items-center space-x-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Vendor Portal</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-forest-950">Store Order Fulfillment</h1>
        <p className="text-xs text-forest-600">Pack, dispatch, and track farm orders assigned to your supplier profile.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-forest-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-forest-200 space-y-3">
          <Package className="w-12 h-12 text-forest-400 mx-auto" />
          <h3 className="font-bold text-forest-950">No orders received yet</h3>
          <p className="text-xs text-forest-600 max-w-sm mx-auto">
            When farmers purchase your items, customer shipping instructions and items will appear here for packing.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((vo) => (
            <div
              key={vo.id}
              className="p-6 rounded-3xl bg-white border border-forest-200 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-forest-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-forest-950">Fulfillment #{vo.id.slice(-8)}</span>
                    <span className="px-3 py-1 rounded-full bg-forest-100 text-forest-900 text-[11px] font-bold">
                      {vo.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-500 mt-1">
                    Customer: <span className="font-bold text-forest-900">{vo.order?.user?.fullName}</span> (📞 {vo.order?.user?.phone})
                  </p>
                  <p className="text-[11px] text-forest-500">
                    Ship to: {vo.order?.address?.street}, {vo.order?.address?.city}, {vo.order?.address?.state} - {vo.order?.address?.pincode}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-forest-950">
                    ₹{Number(vo.payoutAmount).toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-forest-500">
                    Gross: ₹{Number(vo.subtotalAmount).toLocaleString('en-IN')} • Fee (5%): ₹{Number(vo.commissionAmt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {vo.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs text-forest-800">
                    <span>{item.quantity}x {item.productTitle} ({item.variantTitle})</span>
                    <span className="font-bold">₹{Number(item.totalPrice).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Shipment Info & Actions */}
              <div className="pt-4 border-t border-forest-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-forest-600">
                  {vo.shipment?.trackingNumber ? (
                    <p>
                      Dispatched via <span className="font-bold text-forest-900">{vo.shipment.carrierName}</span> • Tracking: <span className="font-mono font-bold text-forest-900">{vo.shipment.trackingNumber}</span>
                    </p>
                  ) : (
                    <p className="italic text-forest-400">Awaiting dispatch and carrier tracking assignment.</p>
                  )}
                </div>

                {/* Fulfillment State Machine Buttons */}
                <div className="flex items-center space-x-2">
                  {vo.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(vo.id, 'PROCESSING')}
                      className="px-4 py-2 rounded-full bg-forest-900 hover:bg-forest-950 text-white font-bold text-xs"
                    >
                      Mark Packed / Processing
                    </button>
                  )}

                  {vo.status === 'PROCESSING' && (
                    <button
                      onClick={() => handleUpdateStatus(vo.id, 'SHIPPED')}
                      className="px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
                    >
                      Dispatch & Enter Tracking
                    </button>
                  )}

                  {vo.status === 'SHIPPED' && (
                    <button
                      onClick={() => handleUpdateStatus(vo.id, 'DELIVERED')}
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Confirm Delivery
                    </button>
                  )}

                  {vo.status === 'DELIVERED' && (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Fulfillment Complete</span>
                    </span>
                  )}
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

