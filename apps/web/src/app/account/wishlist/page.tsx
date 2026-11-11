'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Heart,
  RefreshCw,
  Search,
  ShoppingCart,
  Sprout,
  Star,
  Trash2,
} from 'lucide-react';
import { AccountShell } from '@/components/account/AccountShell';
import { useWishlist, WishlistEntry } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useLanguage, tx } from '@/context/LanguageContext';
import { handleProductImageError, VERIFIED_AGRI_PHOTO } from '@/lib/media';
import { BuyerOnlyGuard } from '@/components/common/BuyerOnlyGuard';

const FALLBACK_IMAGE = VERIFIED_AGRI_PHOTO;

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, loading, error, refreshWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { language } = useLanguage();

  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedCartId, setAddedCartId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return wishlist;
    const q = query.trim().toLowerCase();
    return wishlist.filter((entry) => {
      const title = (entry.product.title || '').toLowerCase();
      const titleHi = (entry.product.titleHi || '').toLowerCase();
      const category = (entry.product.category?.name || '').toLowerCase();
      const vendor = (entry.product.vendor?.businessName || '').toLowerCase();
      return title.includes(q) || titleHi.includes(q) || category.includes(q) || vendor.includes(q);
    });
  }, [wishlist, query]);

  const handleAddToCart = async (entry: WishlistEntry) => {
    const firstVariant = entry.product.variants?.[0];
    if (!firstVariant) {
      router.push(`/products/${entry.product.slug}`);
      return;
    }
    setBusyId(entry.productId);
    setActionError(null);
    try {
      await addToCart(entry.productId, firstVariant.id, 1);
      setAddedCartId(entry.productId);
      setTimeout(() => setAddedCartId((curr) => (curr === entry.productId ? null : curr)), 2200);
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return;
      }
      setActionError(err.message || 'Could not add item to cart.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setBusyId(productId);
    setActionError(null);
    try {
      await removeFromWishlist(productId);
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return;
      }
      setActionError(err.message || 'Could not remove item from database wishlist.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <BuyerOnlyGuard
      title="Buyer Wishlist Disabled for Shop Owners"
      description="Shop owner accounts are for selling only and do not maintain a shopping wishlist or cart."
    >
      <AccountShell sectionTitle="Saved Wishlist" sectionTitleHi="सहेजी गई पसंदीदा सूची">
      <div className="account-card">
        <div className="account-card-head">
          <div className="account-card-head-title">
            <div className="account-card-icon" style={{ background: '#fff1f2', color: '#e11d48' }}>
              <Heart size={19} fill="currentColor" />
            </div>
            <div>
              <h1>
                {tx(language, 'My Wishlist', 'मेरी पसंदीदा सूची')} ({wishlist.length})
              </h1>
              <p>
                {tx(
                  language,
                  'All saved products loaded live from your PostgreSQL database.',
                  'आपके डेटाबेस से सीधे लोड किए गए सभी पसंदीदा कृषि उत्पाद।'
                )}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--muted)' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tx(language, 'Filter wishlist...', 'खोजें...')}
                style={{
                  height: '36px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0 12px 0 30px',
                  fontSize: '12.5px',
                  width: '185px',
                }}
              />
            </div>

            <button
              type="button"
              className="outline-btn small"
              onClick={refreshWishlist}
              disabled={loading}
              style={{ height: '36px', padding: '0 12px', fontSize: '12px' }}
            >
              <RefreshCw size={13} /> {loading ? 'Syncing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {(error || actionError) && (
          <div className="account-alert error">
            <AlertTriangle size={16} />
            <span>{actionError || error}</span>
          </div>
        )}

        {loading && wishlist.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
            {tx(language, 'Fetching your saved wishlist items from database...', 'डेटाबेस से आपकी पसंदीदा सूची लोड हो रही है...')}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="account-empty">
            <Heart size={42} />
            <h3>{tx(language, 'Your wishlist has no saved items yet', 'आपकी पसंदीदा सूची अभी खाली है')}</h3>
            <p>
              {tx(
                language,
                'Tap the heart icon on any marketplace product to save it here in your account database.',
                'किसी भी उत्पाद के हार्ट आइकन पर क्लिक करें ताकि वह आपके खाते में यहाँ सहेजा जा सके।'
              )}
            </p>
            <button type="button" className="primary" onClick={() => router.push('/products')}>
              <Sprout size={16} /> {tx(language, 'Browse Products', 'उत्पाद देखें')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="account-empty">
            <Search size={36} />
            <h3>No wishlist items match &ldquo;{query}&rdquo;</h3>
            <p>Try clearing your filter to view all {wishlist.length} saved items.</p>
            <button type="button" className="outline-btn" onClick={() => setQuery('')}>
              Clear Filter
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {filtered.map((entry) => {
              const p = entry.product;
              const variant = p.variants?.[0];
              const price = Number(variant?.price || 0);
              const mrp = Number(variant?.mrp || price);
              const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
              const stockQty = variant?.inventory
                ? variant.inventory.stockQuantity - variant.inventory.reservedQuantity
                : 10;
              const inStock = stockQty > 0;
              const title = language === 'hi' && p.titleHi ? p.titleHi : p.title;
              const catName =
                language === 'hi' && p.category?.nameHi
                  ? p.category.nameHi
                  : p.category?.name || 'Farm Inputs';
              const image = p.images?.[0]?.url || FALLBACK_IMAGE;
              const isBusy = busyId === entry.productId;
              const isAdded = addedCartId === entry.productId;

              return (
                <article className="wishlist-card" key={entry.id}>
                  <div
                    className="product-image"
                    style={{ height: '190px' }}
                    onClick={() => router.push(`/products/${p.slug}`)}
                  >
                    <img src={image} alt={title} onError={handleProductImageError} />
                    {discountPct > 0 && <span className="discount">{discountPct}% OFF</span>}
                    <button
                      type="button"
                      className="liked"
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(entry.productId);
                      }}
                      title="Remove from Wishlist"
                      aria-label="Remove from Wishlist"
                    >
                      <Heart size={17} fill="currentColor" />
                    </button>
                  </div>

                  <div className="wishlist-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span className="eyebrow">{catName.toUpperCase()}</span>
                      <span
                        className={`account-badge ${inStock ? 'green' : 'red'}`}
                        style={{ padding: '2px 7px', fontSize: '10px' }}
                      >
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <h3 onClick={() => router.push(`/products/${p.slug}`)}>{title}</h3>

                    <div className="rating" style={{ marginBottom: '6px' }}>
                      <span>
                        <Star size={12} fill="currentColor" /> {Number(p.rating || 4.8).toFixed(1)}
                      </span>
                      <small>({p.reviewCount || 0} reviews)</small>
                    </div>

                    <p className="seller" style={{ margin: '4px 0 8px' }}>
                      <BadgeCheck size={14} /> {p.vendor?.businessName || 'Verified Seller'}
                      {p.vendor?.city ? ` · ${p.vendor.city}` : ''}
                    </p>

                    {variant && (
                      <small style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
                        Pack: <b>{variant.title}</b> · Saved{' '}
                        {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </small>
                    )}

                    <div className="price-row">
                      <b>₹{price.toLocaleString('en-IN')}</b>
                      {mrp > price && <del>₹{mrp.toLocaleString('en-IN')}</del>}
                    </div>

                    <div className="wishlist-actions-row">
                      <button
                        type="button"
                        className="primary"
                        disabled={!inStock || isBusy}
                        onClick={() => handleAddToCart(entry)}
                      >
                        {isAdded ? (
                          <>
                            <Check size={15} /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={15} /> Add to Cart
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="wishlist-remove-btn"
                        disabled={isBusy}
                        onClick={() => handleRemove(entry.productId)}
                        title="Remove from Wishlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      </AccountShell>
    </BuyerOnlyGuard>
  );
}

