'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  Check,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { products, productImages, RefProduct } from '@/lib/referenceData';
import { ApiClient } from '@/lib/api';
import { handleProductImageError, resolveProductImage } from '@/lib/media';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState('');
  const [checked, setChecked] = useState(false);
  const [selectedPack, setSelectedPack] = useState('Standard');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [variants, setVariants] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('Product details');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Default product from reference
  const matchedRef = products.find((x) => x.slug === slug || String(x.id) === slug) || products[0];
  const [p, setProduct] = useState<RefProduct>(matchedRef);
  const liked = user ? isWishlisted(p.id) : false;

  useEffect(() => {
    if (!slug) return;
    ApiClient.get(`/catalog/products/${slug}`)
      .then((res) => {
        if (res.success && res.data) {
          const item = res.data;
          const dbVariants = item.variants || [];
          const firstVar = dbVariants[0];
          setVariants(dbVariants);
          if (firstVar) {
            setSelectedVariantId(firstVar.id);
            setSelectedPack(firstVar.title);
          }
          if (item.images && item.images.length > 0) {
            setGalleryImages(item.images.map((img: any) => resolveProductImage(img.url)));
          }
          setProduct({
            id: item.id,
            variantId: firstVar?.id,
            slug: item.slug,
            name: language === 'hi' && item.titleHi ? item.titleHi : item.title,
            category: item.category?.name || 'Farm Inputs',
            price: Number(firstVar?.price || 449),
            mrp: Number(firstVar?.mrp || 599),
            rating: Number(item.rating || 4.8),
            reviews: item.reviewCount || 24,
            image: resolveProductImage(item.images?.[0]?.url || matchedRef.image),
            seller: item.vendor?.businessName || matchedRef.seller,
          });
        }
      })
      .catch(() => {
        // Fallback to matched reference when offline
      });
  }, [slug, language, matchedRef]);

  const images = galleryImages.length > 0 ? galleryImages : [p.image, ...productImages.slice(1, 4)];
  const activeVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const displayPrice = activeVariant ? Number(activeVariant.price) : p.price;
  const displayMrp = activeVariant ? Number(activeVariant.mrp || displayPrice * 1.2) : p.mrp;
  const discount = displayMrp > displayPrice ? Math.round((1 - displayPrice / displayMrp) * 100) : 0;
  const savings = Math.max(0, displayMrp - displayPrice);

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (wishBusy) return;
    setWishBusy(true);
    setActionError(null);
    try {
      await toggleWishlist(String(p.id));
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return;
      }
      setActionError(err?.message || 'Could not update wishlist.');
    } finally {
      setWishBusy(false);
    }
  };

  const handleAddToCart = async (): Promise<boolean> => {
    if (!user) {
      router.push('/login');
      return false;
    }
    const targetVariantId = selectedVariantId || p.variantId;
    if (!targetVariantId) {
      setActionError('Please choose an available pack from a live product listing.');
      return false;
    }
    if (cartBusy) return false;
    setCartBusy(true);
    setActionError(null);
    try {
      await addToCart(String(p.id), targetVariantId, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      return true;
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return false;
      }
      setActionError(err?.message || 'Could not add this product to cart.');
      return false;
    } finally {
      setCartBusy(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const ok = await handleAddToCart();
    if (ok) {
      router.push('/checkout');
    }
  };

  return (
    <main className="container product-page">
      <div className="breadcrumbs">
        <Link href="/" style={{ cursor: 'pointer' }}>
          Home
        </Link>{' '}
        <ChevronRight />{' '}
        <Link href="/products" style={{ cursor: 'pointer' }}>
          Seeds
        </Link>{' '}
        <ChevronRight /> {p.category}
      </div>

      <div className="product-detail">
        {/* Gallery */}
        <div className="gallery">
          <div className="thumbs">
            {images.map((x, i) => (
              <button
                type="button"
                className={selectedImageIndex === i ? 'active' : ''}
                key={x + i}
                onClick={() => setSelectedImageIndex(i)}
              >
                <img src={x} alt={`Thumbnail ${i + 1}`} onError={handleProductImageError} />
              </button>
            ))}
          </div>
          <div className="main-image">
            <img src={images[selectedImageIndex]} alt={p.name} onError={handleProductImageError} />
            <span className="discount">{discount}% OFF</span>
            {user?.role !== 'VENDOR' && (
              <button
                type="button"
                className={`wish ${liked ? 'liked' : ''}`}
                onClick={handleToggleWishlist}
                disabled={wishBusy}
                aria-label={liked ? 'Remove from Wishlist' : 'Add to Wishlist'}
                title={liked ? 'Saved in Wishlist' : 'Add to Wishlist'}
              >
                <Heart fill={liked ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <span className="eyebrow">{p.category.toUpperCase()}</span>
          <h1>{p.name}</h1>
          <div className="rating">
            <span>
              <Star size={14} fill="currentColor" /> {p.rating}
            </span>
            <u>{p.reviews} reviews</u>
          </div>
          <p className="seller-line">
            Sold by <b>{p.seller}</b> <BadgeCheck size={16} /> <span>Verified seller</span>
          </p>
          <div className="detail-price">
            <b>₹{displayPrice.toLocaleString('en-IN')}</b>
            <del>₹{displayMrp.toLocaleString('en-IN')}</del>
            {savings > 0 && <span>Save ₹{savings.toLocaleString('en-IN')}</span>}
          </div>
          <small>Inclusive of all taxes</small>

          <div className="offer-box">
            <b>
              <Tag size={17} /> Best offer
            </b>
            <p>
              Get extra 5% off on UPI payments. <strong>View details</strong>
            </p>
          </div>

          <div className="choice-row">
            <b>Pack size</b>
            <div>
              {variants.length > 0
                ? variants.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      className={selectedVariantId === v.id ? 'selected' : ''}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setSelectedPack(v.title);
                      }}
                    >
                      {v.title}
                    </button>
                  ))
                : ['10g', '25g', '50g'].map((size) => (
                    <button
                      type="button"
                      key={size}
                      className={selectedPack === size ? 'selected' : ''}
                      onClick={() => setSelectedPack(size)}
                    >
                      {size}
                    </button>
                  ))}
            </div>
          </div>

          <div className="delivery-check">
            <b>Check delivery</b>
            <div>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter PIN code"
                maxLength={6}
              />
              <button
                type="button"
                onClick={() => setChecked(pin.length === 6)}
              >
                Check
              </button>
            </div>
            {checked && (
              <p>
                <BadgeCheck size={15} /> Delivery available by Friday, 21 June
              </p>
            )}
          </div>

          {user?.role === 'VENDOR' ? (
            <div
              style={{
                marginTop: '16px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: '#f8faf7',
                border: '1px solid #dfe7df',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '13px', color: '#39463e', lineHeight: 1.5 }}>
                <b style={{ display: 'block', color: '#17221a' }}>Shop Owner View</b>
                Shop owner accounts are for selling products only and cannot place purchase orders.
              </div>
              <Link
                href={user.vendorProfile?.status === 'APPROVED' ? '/vendor/dashboard' : '/vendor/verification'}
                className="outline-btn small"
                style={{ textDecoration: 'none' }}
              >
                <Store size={14} />{' '}
                {user.vendorProfile?.status === 'APPROVED' ? 'Vendor Workspace' : 'Verification Status'}
              </Link>
            </div>
          ) : (
            <div className="buy-row">
              <div className="qty">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus />
                </button>
                <b>{qty}</b>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                >
                  <Plus />
                </button>
              </div>
              <button
                type="button"
                className="outline-btn"
                onClick={handleAddToCart}
                disabled={cartBusy}
              >
                {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                {added ? 'Added to Cart' : cartBusy ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleBuyNow}
                disabled={cartBusy}
              >
                Buy Now
              </button>
            </div>
          )}
          {actionError && (
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#b91c1c', fontWeight: 600 }}>
              {actionError}
            </p>
          )}

          <div className="mini-benefits">
            <span>
              <ShieldCheck /> Genuine product
            </span>
            <span>
              <ArrowLeft /> 7-day return
            </span>
            <span>
              <Truck /> Secure delivery
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {['Product details', 'Specifications', 'Usage guide', `Reviews (${p.reviews})`, 'FAQs'].map(
          (tab) => (
            <button
              type="button"
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* Info Panel */}
      <section className="info-panel">
        <div>
          <h2>Grow healthy, high-yield tomatoes</h2>
          <p>
            {p.name} is a high-performance hybrid variety selected for Indian growing conditions.
            It offers vigorous plants, uniform fruits and excellent disease tolerance.
          </p>
          <div className="spec-grid">
            <span>
              <small>GERMINATION</small>
              <b>85% minimum</b>
            </span>
            <span>
              <small>HARVEST</small>
              <b>70–75 days</b>
            </span>
            <span>
              <small>FRUIT WEIGHT</small>
              <b>90–110 g</b>
            </span>
            <span>
              <small>SEASON</small>
              <b>All season</b>
            </span>
          </div>
        </div>
        <div className="usage">
          <h3>Application guide</h3>
          <ol>
            <li>
              <span>1</span>Sow seeds 0.5 cm deep in a nursery tray.
            </li>
            <li>
              <span>2</span>Keep soil moist, not waterlogged.
            </li>
            <li>
              <span>3</span>Transplant after 25–30 days.
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}
