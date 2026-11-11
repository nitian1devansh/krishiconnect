'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { Logo } from '@/components/common/Logo';
import { BuyerOnlyGuard } from '@/components/common/BuyerOnlyGuard';

function CheckoutContent() {
  const router = useRouter();
  const { language } = useLanguage();
  const { cart } = useCart();

  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState('home');
  const [payment, setPayment] = useState('UPI');
  const [upiOption, setUpiOption] = useState('app');
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const subtotal = 1048;
  const discount = Math.round(subtotal * 0.08);
  const tax = Math.round(subtotal * 0.05);
  const total = Math.round(subtotal * 0.97);

  const handlePlaceOrder = () => {
    setStep(3);
    router.push('/account/orders?success=true');
  };

  return (
    <main className="checkout-page">
      <div className="checkout-top">
        <Logo />
        <div className="steps">
          {['Address', 'Payment', 'Confirmation'].map((s, i) => (
            <span className={step >= i + 1 ? 'active' : ''} key={s}>
              <b>{i + 1}</b>
              {s}
            </span>
          ))}
        </div>
        <span>
          <ShieldCheck size={16} /> 100% secure
        </span>
      </div>

      <div className="container checkout-layout">
        <section>
          {/* Step 1: Delivery Address */}
          <div className="checkout-card">
            <div className="checkout-card-title">
              <span>1</span>
              <div>
                <h2>Delivery address</h2>
                <p>Choose where you want your order delivered</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAddress(!showAddAddress)}
              >
                + Add new address
              </button>
            </div>

            {showAddAddress && (
              <div
                style={{
                  background: '#f8faf7',
                  border: '1px solid #dfe7df',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <b style={{ display: 'block', marginBottom: '10px' }}>Add New Farm Address</b>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    placeholder="Full name"
                    style={{ padding: '8px 12px', border: '1px solid #dfe7df', borderRadius: '6px' }}
                  />
                  <input
                    placeholder="Mobile number"
                    style={{ padding: '8px 12px', border: '1px solid #dfe7df', borderRadius: '6px' }}
                  />
                  <input
                    placeholder="Village / Town / Street"
                    style={{
                      gridColumn: 'span 2',
                      padding: '8px 12px',
                      border: '1px solid #dfe7df',
                      borderRadius: '6px',
                    }}
                  />
                  <input
                    placeholder="PIN Code"
                    maxLength={6}
                    style={{ padding: '8px 12px', border: '1px solid #dfe7df', borderRadius: '6px' }}
                  />
                  <input
                    placeholder="State"
                    defaultValue="Maharashtra"
                    style={{ padding: '8px 12px', border: '1px solid #dfe7df', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="primary"
                    style={{ padding: '6px 16px', fontSize: '13px' }}
                    onClick={() => setShowAddAddress(false)}
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    className="outline-btn"
                    style={{ padding: '6px 16px', fontSize: '13px' }}
                    onClick={() => setShowAddAddress(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <label
              className={`address ${selectedAddress === 'home' ? 'selected' : ''}`}
              onClick={() => setSelectedAddress('home')}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddress === 'home'}
                onChange={() => setSelectedAddress('home')}
              />
              <div>
                <b>
                  Rajesh Kumar <span>HOME</span>
                </b>
                <p>
                  42, Shanti Nagar, Near Krishi Mandi
                  <br />
                  Nashik, Maharashtra – 422003
                </p>
                <strong>+91 98765 43210</strong>
              </div>
              <button type="button">Edit</button>
            </label>

            <label
              className={`address ${selectedAddress === 'farm' ? 'selected' : ''}`}
              onClick={() => setSelectedAddress('farm')}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddress === 'farm'}
                onChange={() => setSelectedAddress('farm')}
              />
              <div>
                <b>
                  Rajesh Kumar <span>FARM</span>
                </b>
                <p>
                  Plot 18, Pimpalgaon Road
                  <br />
                  Niphad, Maharashtra – 422303
                </p>
              </div>
            </label>
          </div>

          {/* Step 2: Payment Method */}
          <div className="checkout-card">
            <div className="checkout-card-title">
              <span>2</span>
              <div>
                <h2>Payment method</h2>
                <p>All transactions are secure and encrypted</p>
              </div>
            </div>

            <div className="payment-tabs">
              {['UPI', 'Card', 'Net Banking', 'Wallet', 'Cash on Delivery'].map((x) => (
                <button
                  type="button"
                  className={payment === x ? 'active' : ''}
                  onClick={() => setPayment(x)}
                  key={x}
                >
                  {x === 'Card' ? (
                    <CreditCard size={16} />
                  ) : x === 'UPI' ? (
                    <Zap size={16} />
                  ) : (
                    <Wallet size={16} />
                  )}
                  {x}
                </button>
              ))}
            </div>

            <div className="payment-box">
              {payment === 'UPI' ? (
                <>
                  <b>Pay with UPI</b>
                  <label>
                    <input
                      type="radio"
                      name="upi"
                      checked={upiOption === 'app'}
                      onChange={() => setUpiOption('app')}
                    />{' '}
                    Google Pay / PhonePe / Paytm
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="upi"
                      checked={upiOption === 'id'}
                      onChange={() => setUpiOption('id')}
                    />{' '}
                    Enter UPI ID
                  </label>
                  {upiOption === 'id' && (
                    <div className="upi-input">
                      <input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@bank"
                      />
                      <button
                        type="button"
                        onClick={() => setUpiVerified(Boolean(upiId.includes('@')))}
                      >
                        {upiVerified ? 'Verified ✓' : 'Verify'}
                      </button>
                    </div>
                  )}
                </>
              ) : payment === 'Card' ? (
                <>
                  <b>Credit or debit card</b>
                  <input className="wide-input" placeholder="Card number" maxLength={19} />
                  <div className="split-input">
                    <input placeholder="MM / YY" maxLength={5} />
                    <input placeholder="CVV" maxLength={4} type="password" />
                  </div>
                </>
              ) : (
                <>
                  <b>{payment}</b>
                  <p>Select your preferred {payment.toLowerCase()} option at the next step.</p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <aside className="summary">
          <h3>Order Summary</h3>
          <div>
            <span>Subtotal</span>
            <b>₹{subtotal.toLocaleString()}</b>
          </div>
          <div>
            <span>Discount</span>
            <b className="green-text">− ₹{discount}</b>
          </div>
          <div>
            <span>Delivery</span>
            <b className="green-text">FREE</b>
          </div>
          <div>
            <span>Estimated tax</span>
            <b>₹{tax}</b>
          </div>
          <div className="total">
            <span>Total</span>
            <b>₹{total.toLocaleString()}</b>
          </div>
          <p className="saving">You save ₹{discount} on this order</p>
          <button
            type="button"
            className="primary full"
            onClick={handlePlaceOrder}
          >
            Place Order Securely <ArrowRight size={16} />
          </button>
          <small className="secure">
            <ShieldCheck size={15} /> Safe and secure payments
          </small>
        </aside>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading checkout...</div>}>
      <BuyerOnlyGuard>
        <CheckoutContent />
      </BuyerOnlyGuard>
    </Suspense>
  );
}
