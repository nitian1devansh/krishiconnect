import type { SyntheticEvent } from 'react';

export const FALLBACK_PRODUCT_IMAGE = '/images/product-placeholder.svg';

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
).replace(/\/api\/v1\/?$/, '');

/**
 * Fallback agricultural photo verified HTTP 200 on Unsplash, used as secondary
 * photo fallback before switching to the local SVG placeholder.
 */
export const VERIFIED_AGRI_PHOTO =
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80';

/**
 * Normalizes product image paths so API-served uploads (`/uploads/...`),
 * full external URLs, and local static assets (`/images/...`) render safely.
 */
export function resolveProductImage(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return FALLBACK_PRODUCT_IMAGE;
  if (trimmed.startsWith('/uploads/')) {
    return `${API_ORIGIN}${trimmed}`;
  }
  return trimmed;
}

/**
 * Attaches cleanly to any product <img> onError handler so broken or blocked
 * external URLs never show broken browser icons or infinite retry loops.
 */
export function handleProductImageError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === '1') {
    img.src = FALLBACK_PRODUCT_IMAGE;
    img.onerror = null;
    return;
  }
  img.dataset.fallbackApplied = '1';
  img.src = FALLBACK_PRODUCT_IMAGE;
}

