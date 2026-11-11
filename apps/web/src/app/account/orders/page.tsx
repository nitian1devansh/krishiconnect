'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ClipboardCheck,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { AccountShell } from '@/components/account/AccountShell';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, tx } from '@/context/LanguageContext';
import { ApiClient } from '@/lib/api';
import { handleProductImageError, VERIFIED_AGRI_PHOTO } from '@/lib/media';
import { BuyerOnlyGuard } from '@/components/common/BuyerOnlyGuard';

const FALLBACK_IMG = VERIFIED_AGRI_PHOTO;

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const { user, token } = useAuth();
  const { language } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!token || !user || user.role === 'VENDOR') return;
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.get('/orders/customer');
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        if (res.data.length > 0 && isSuccess) {
          setExpandedOrderId(res.data[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token, user?.role]);

  const statusTone = (status?: string) => {
    if (!status) return 'slate';
    if (status === 'DELIVERED' || status === 'CONFIRMED' || status === 'PAID') return 'green';
    if (status === 'CANCELLED' || status === 'RETURNED') return 'red';
    return 'amber';
  };

  const timelineSteps = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const getStepIndex = (status: string) => {
    if (status === 'DELIVERED') return 3;
    if (status === 'SHIPPED') return 2;
    if (status === 'PROCESSING') return 1;
    if (status === 'CONFIRMED' || status === 'PAID') return 0;
    return -1;
  };

  return (
    <AccountShell sectionTitle="My Orders" sectionTitleHi="मेरे ऑर्डर">
      {isSuccess && (
        <div className="success-banner" style={{ marginBottom: '2px' }}>
          <span>
            <ClipboardCheck size={26} />
          </span>
          <div>
            <h1>{tx(language, 'Order placed successfully', 'ऑर्डर सफलतापूर्वक दर्ज हो गया')}</h1>
            <p>
              Thank you, <b>{user?.fullName || 'Customer'}</b>.{' '}
              {orders[0]?.orderNumber
                ? `Your order #${orders[0].orderNumber} has been saved in your account.`
                : 'Your order details have been confirmed.'}
            </p>
          </div>
          <button type="button" onClick={() => router.push('/products')}>
            Continue shopping
          </button>
        </div>
      )}

      <div className="account-card">
        <div className="account-card-head">
          <div className="account-card-head-title">
            <div className="account-card-icon">
              <Package size={19} />
            </div>
            <div>
              <h1>
                {tx(language, 'Order History', 'ऑर्डर इतिहास')} ({orders.length})
              </h1>
              <p>
                {tx(
                  language,
                  'Track live order status and vendor dispatches from the database.',
                  'डेटाबेस से लाइव ऑर्डर स्थिति और विक्रेता डिस्पैच ट्रैक करें।'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="outline-btn small"
            onClick={loadOrders}
            disabled={loading}
            style={{ height: '36px', padding: '0 12px', fontSize: '12px' }}
          >
            <RefreshCw size={13} /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="account-alert error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
            Loading your orders from database...
          </div>
        ) : orders.length === 0 ? (
          <div className="account-empty">
            <ShoppingBag size={42} />
            <h3>{tx(language, 'No orders placed yet', 'अभी तक कोई ऑर्डर नहीं किया गया है')}</h3>
            <p>
              {tx(
                language,
                'Once you complete a purchase on KrishiConnect, your order tracking timeline and invoices will appear here.',
                'जब आप कृषि कनेक्ट पर खरीदारी करेंगे, तो आपके ऑर्डर और ट्रैकिंग विवरण यहाँ दिखाई देंगे।'
              )}
            </p>
            <button type="button" className="primary" onClick={() => router.push('/products')}>
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div className="order-list-real">
            {orders.map((ord) => {
              const isOpen = expandedOrderId === ord.id;
              const stepIdx = getStepIndex(ord.status);
              const vendorName = ord.vendorOrders?.[0]?.vendor?.businessName;

              return (
                <article className="order-item-card" key={ord.id}>
                  <div className="order-item-head">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <b style={{ fontSize: '15px', color: 'var(--ink)' }}>Order #{ord.orderNumber}</b>
                        <span className={`account-badge ${statusTone(ord.status)}`}>{ord.status}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                        Placed on{' '}
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {vendorName ? ` · Seller: ${vendorName}` : ''}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <b style={{ fontSize: '17px', color: 'var(--ink)' }}>
                        ₹{Number(ord.netAmount ?? ord.totalAmount ?? 0).toLocaleString('en-IN')}
                      </b>
                      <div style={{ marginTop: '6px' }}>
                        <button
                          type="button"
                          className="outline-btn small"
                          style={{ height: '30px', padding: '0 10px', fontSize: '11px' }}
                          onClick={() => setExpandedOrderId(isOpen ? null : ord.id)}
                        >
                          {isOpen ? 'Hide Details' : 'Track & Details'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {ord.items && ord.items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {ord.items.map((it: any) => (
                        <div className="ordered-product" key={it.id}>
                          <img
                            src={it.product?.images?.[0]?.url || FALLBACK_IMG}
                            alt={it.product?.title || 'Ordered product'}
                            onError={handleProductImageError}
                          />
                          <div>
                            <b style={{ fontSize: '13px', display: 'block' }}>
                              {it.product?.title || 'Agricultural Product'}
                            </b>
                            <p style={{ fontSize: '11.5px' }}>
                              {it.variantTitle ? `${it.variantTitle} · ` : ''}Qty: {it.quantity}
                            </p>
                          </div>
                          <strong style={{ fontSize: '14px' }}>
                            ₹{Number(it.totalPrice ?? it.unitPrice ?? 0).toLocaleString('en-IN')}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {isOpen && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #eef2ee' }}>
                      {stepIdx >= 0 && (
                        <div className="timeline" style={{ margin: '18px 0 22px' }}>
                          {['Confirmed', 'Processing', 'Shipped', 'Delivered'].map((label, idx) => (
                            <div
                              key={label}
                              className={idx < stepIdx ? 'done' : idx === stepIdx ? 'current' : ''}
                            >
                              <span>{idx <= stepIdx ? '✓' : idx + 1}</span>
                              <b>{label}</b>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="account-detail-grid">
                        {ord.address && (
                          <div className="account-detail-item">
                            <small>
                              <MapPin size={11} style={{ display: 'inline' }} /> Delivery Address
                            </small>
                            <b>
                              {ord.address.name} — {ord.address.street}, {ord.address.city},{' '}
                              {ord.address.state} - {ord.address.pincode}
                            </b>
                          </div>
                        )}
                        <div className="account-detail-item">
                          <small>
                            <Store size={11} style={{ display: 'inline' }} /> Payment Status
                          </small>
                          <b>{ord.paymentStatus || 'PENDING'}</b>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AccountShell>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading orders...</div>}>
      <BuyerOnlyGuard
        title="Customer Orders Disabled for Shop Owners"
        description="Shop owner accounts manage incoming customer sales in Vendor Orders and cannot place purchase orders."
      >
        <OrdersContent />
      </BuyerOnlyGuard>
    </Suspense>
  );
}
