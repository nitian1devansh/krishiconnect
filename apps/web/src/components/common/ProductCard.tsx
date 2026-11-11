'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Heart, BadgeCheck, ShoppingCart, Store, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { handleProductImageError, resolveProductImage, VERIFIED_AGRI_PHOTO } from '@/lib/media';

export interface ProductCardProps {
  product: {
    id: string | number;
    title?: string;
    name?: string;
    slug?: string;
    category?: string;
    price?: number | string;
    mrp?: number | string;
    rating?: number | string;
    reviews?: number;
    reviewCount?: number;
    image?: string;
    images?: { url: string }[];
    seller?: string;
    vendor?: { businessName: string };
    variantId?: string;
    variants?: { id: string; price: number | string; mrp: number | string }[];
  };
  add?: () => void;
  open?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, add, open }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [wishBusy, setWishBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const productIdStr = String(product.id);
  const liked = user ? isWishlisted(productIdStr) : false;

  const name = product.name || product.title || 'Product';
  const slug = product.slug || productIdStr;
  const category = product.category || 'Agricultural Supplies';
  const seller = product.seller || product.vendor?.businessName || 'Verified Seller';
  const rating = Number(product.rating || 4.8).toFixed(1);
  const reviews = product.reviews ?? product.reviewCount ?? 128;

  let price = Number(product.price || 0);
  let mrp = Number(product.mrp || 0);
  if (!price && product.variants?.[0]) {
    price = Number(product.variants[0].price);
    mrp = Number(product.variants[0].mrp || price * 1.25);
  }
  if (!mrp || mrp < price) mrp = Math.round(price * 1.25);

  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 15;
  const image = resolveProductImage(
    product.image || product.images?.[0]?.url || VERIFIED_AGRI_PHOTO
  );

  const variantId = product.variantId || product.variants?.[0]?.id;

  const handleOpen = () => {
    if (open) {
      open();
    } else {
      router.push(`/products/${slug}`);
    }
  };

  const showTempMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg((curr) => (curr === msg ? null : curr)), 2600);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    if (wishBusy) return;
    setWishBusy(true);
    setActionMsg(null);
    try {
      await toggleWishlist(productIdStr);
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return;
      }
      showTempMsg(err?.message || 'Could not update wishlist.');
    } finally {
      setWishBusy(false);
    }
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (add) {
      add();
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    if (!variantId) {
      handleOpen();
      return;
    }
    if (cartBusy) return;
    setCartBusy(true);
    setActionMsg(null);
    try {
      await addToCart(productIdStr, variantId, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return;
      }
      showTempMsg(err?.message || 'Could not add item to cart.');
    } finally {
      setCartBusy(false);
    }
  };

  return (
    <article className="product-card">
      <div className="product-image" onClick={handleOpen}>
        <img src={image} alt={name} onError={handleProductImageError} />
        <span className="discount">{discount}% OFF</span>
        {user?.role !== 'VENDOR' && (
          <button
            className={liked ? 'liked' : ''}
            onClick={handleWishlist}
            disabled={wishBusy}
            type="button"
            aria-label={liked ? 'Remove from Wishlist' : 'Add to Wishlist'}
            title={liked ? 'Saved in Wishlist' : 'Add to Wishlist'}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="product-body">
        <span className="eyebrow">{category}</span>
        <h3 onClick={handleOpen}>{name}</h3>
        <div className="rating">
          <span>
            <Star size={13} fill="currentColor" /> {rating}
          </span>
          <small>({reviews})</small>
        </div>
        <p className="seller">
          <BadgeCheck size={14} /> {seller}
        </p>
        <div className="price-row">
          <b>₹{price.toLocaleString('en-IN')}</b>
          <del>₹{mrp.toLocaleString('en-IN')}</del>
        </div>
        {user?.role === 'VENDOR' ? (
          <button
            className="add-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
            type="button"
            style={{ background: '#f3f6f4', color: '#2b4433', border: '1px solid #d5e2d8' }}
          >
            <Store size={16} /> View Listing
          </button>
        ) : (
          <button className="add-btn" onClick={handleAdd} disabled={cartBusy} type="button">
            {added ? (
              <>
                <Check size={17} /> Added to Cart
              </>
            ) : cartBusy ? (
              <>Adding...</>
            ) : (
              <>
                <ShoppingCart size={17} /> Add to Cart
              </>
            )}
          </button>
        )}
        {actionMsg && (
          <p
            style={{
              marginTop: '6px',
              fontSize: '11.5px',
              color: '#b91c1c',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {actionMsg}
          </p>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
