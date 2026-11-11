'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, tx } from '@/context/LanguageContext';
import { products } from '@/lib/referenceData';
import { handleProductImageError, resolveProductImage } from '@/lib/media';
import { BuyerOnlyGuard } from '@/components/common/BuyerOnlyGuard';

export default function CartPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { cart, updateQuantity, removeItem } = useCart();
  const { addToWishlist } = useWishlist();

  const [couponApplied, setCouponApplied] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    if (cart && cart.items) {
      const mapped = cart.items.map((ci) => {
        const ref = products.find((p) => String(p.id) === ci.productId) || products[0];
        return {
          id: ci.id,
          productId: ci.productId,
          variantTitle: ci.variant?.title || 'Standard',
          name: ci.product?.title || ref.name,
          category: (ci.product as any)?.category?.name || ref.category,
          image: resolveProductImage(ci.product?.images?.[0]?.url || ref.image),
          seller: ci.product?.vendor?.businessName || ref.seller,
          price: Number(ci.variant?.price || ref.price),
          mrp: Number(ci.variant?.mrp || ref.mrp),
          quantity: ci.quantity,
        };
      });
      setItems(mapped);
    } else if (!user) {
      setItems([]);
    }
  }, [cart, user]);

  const handleUpdate = async (id: string, qty: number) => {
    try {
      if (qty <= 0) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        await removeItem(id);
      } else {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
        await updateQuantity(id, qty);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return;
      }
      setStatusNote(err?.message || 'Could not update cart quantity.');
      setTimeout(() => setStatusNote(null), 3000);
    }
  };

  const handleMoveToWishlist = async (item: any) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await addToWishlist(item.productId);
      await removeItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setStatusNote(`Moved "${item.name}" to your Wishlist.`);
      setTimeout(() => setStatusNote(null), 3000);
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return;
      }
      setStatusNote(err?.message || 'Could not move item to wishlist.');
      setTimeout(() => setStatusNote(null), 3000);
    }
  };

  const subtotal = items.reduce((a, item) => a + item.price * item.quantity, 0);
  const discount = Math.round(subtotal * 0.08) + (couponApplied ? 150 : 0);
  const tax = Math.round(subtotal * 0.05);
  const total = Math.max(0, subtotal - discount + tax);

  return (
    <BuyerOnlyGuard>
      <main className="container cart-page">
      <div className="page-title">
        <div>
          <h1>{tx(language, 'Your Cart', 'आपकी कार्ट')}</h1>
          <p>
            {items.length}{' '}
            {tx(
              language,
              'items from verified sellers',
              'उत्पाद सत्यापित विक्रेताओं से'
            )}
          </p>
        </div>
        <button
          type="button"
          className="text-link"
          onClick={() => router.push('/products')}
        >
          <ArrowLeft size={16} /> {tx(language, 'Continue shopping', 'खरीदारी जारी रखें')}
        </button>
      </div>

      {statusNote && (
        <div className="account-alert success" style={{ marginBottom: '16px', justifyContent: 'space-between' }}>
          <span>{statusNote}</span>
          <Link href="/account/wishlist" style={{ fontWeight: 700, color: '#065f46', textDecoration: 'underline' }}>
            View Wishlist
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">
          <ShoppingCart size={48} />
          <h2>{tx(language, 'Your cart is waiting', 'आपकी कार्ट खाली है')}</h2>
          <p>
            {tx(
              language,
              'Add quality farm supplies to get started.',
              'शुरू करने के लिए गुणवत्तापूर्ण कृषि उत्पाद जोड़ें।'
            )}
          </p>
          <button
            type="button"
            className="primary"
            onClick={() => router.push('/products')}
          >
            {tx(language, 'Explore products', 'उत्पाद देखें')}
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            <div className="seller-group">
              <div className="seller-heading">
                <Store size={18} />
                <span>
                  Sold by <b>{items[0]?.seller || 'GreenGrow Seeds'}</b>
                  <small>
                    <BadgeCheck size={14} /> Verified shop
                  </small>
                </span>
                <span className="delivery-free">FREE DELIVERY</span>
              </div>

              {items.map((p) => {
                const discountPct = Math.round((1 - p.price / p.mrp) * 100);
                return (
                  <div className="cart-item" key={p.id}>
                    <img src={p.image} alt={p.name} onError={handleProductImageError} />
                    <div className="cart-item-main">
                      <span className="eyebrow">{p.category}</span>
                      <h3>{p.name}</h3>
                      <p>Pack: {p.variantTitle || 'Standard'}</p>
                      <div className="price-row">
                        <b>₹{p.price.toLocaleString('en-IN')}</b>
                        <del>₹{p.mrp.toLocaleString('en-IN')}</del>
                        <span>{discountPct}% off</span>
                      </div>
                      <div className="cart-actions">
                        <div className="qty">
                          <button
                            type="button"
                            onClick={() => handleUpdate(p.id, p.quantity - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <b>{p.quantity}</b>
                          <button
                            type="button"
                            onClick={() => handleUpdate(p.id, p.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button type="button" onClick={() => handleMoveToWishlist(p)}>
                          <Heart size={15} /> Move to wishlist
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdate(p.id, 0)}
                        >
                          <X size={15} /> Remove
                        </button>
                      </div>
                    </div>
                    <p className="arrival">
                      <Truck size={16} /> Delivery by <b>Fri, 21 Jun</b>
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="coupon">
              <Tag size={20} />
              <div>
                <b>Have a coupon?</b>
                <p>
                  {couponApplied
                    ? 'Coupon KRISHI150 applied (-₹150)'
                    : 'Apply promo code to save more'}
                </p>
                {couponOpen && !couponApplied && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #dfe7df',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                      placeholder="Enter KRISHI150"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      type="button"
                      style={{
                        padding: '6px 14px',
                        background: '#2e7d32',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        setCouponApplied(true);
                        setCouponOpen(false);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
              {!couponApplied && (
                <button
                  type="button"
                  onClick={() => setCouponOpen(!couponOpen)}
                >
                  {couponOpen ? 'Cancel' : 'Apply coupon'}
                </button>
              )}
            </div>
          </section>

          {/* Order Summary */}
          <aside className="summary">
            <h3>{tx(language, 'Order Summary', 'ऑर्डर सारांश')}</h3>
            <div>
              <span>{tx(language, 'Subtotal', 'उप-योग')}</span>
              <b>₹{subtotal.toLocaleString('en-IN')}</b>
            </div>
            <div>
              <span>{tx(language, 'Discount', 'छूट')}</span>
              <b className="green-text">− ₹{discount.toLocaleString('en-IN')}</b>
            </div>
            <div>
              <span>{tx(language, 'Delivery', 'डिलीवरी')}</span>
              <b className="green-text">FREE</b>
            </div>
            <div>
              <span>{tx(language, 'Estimated tax', 'अनुमानित कर')}</span>
              <b>₹{tax.toLocaleString('en-IN')}</b>
            </div>
            <div className="total">
              <span>{tx(language, 'Total', 'कुल')}</span>
              <b>₹{total.toLocaleString('en-IN')}</b>
            </div>
            <p className="saving">
              You save ₹{discount.toLocaleString('en-IN')} on this order
            </p>
            <button
              type="button"
              className="primary full"
              onClick={() => router.push('/checkout')}
            >
              {tx(language, 'Proceed to Checkout', 'चेकआउट के लिए आगे बढ़ें')}{' '}
              <ArrowRight size={16} />
            </button>
            <small className="secure">
              <ShieldCheck size={15} /> Safe and secure payments
            </small>
          </aside>
        </div>
      )}
      </main>
    </BuyerOnlyGuard>
  );
}
