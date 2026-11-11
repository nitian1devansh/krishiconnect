'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { handleProductImageError, resolveProductImage } from '@/lib/media';

interface VendorProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number | string;
  mrp: number | string;
  inventory?: {
    stockQuantity: number;
  } | null;
}

interface VendorProductItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category?: { name: string } | null;
  brand?: { name: string } | null;
  images?: Array<{ url: string }>;
  variants?: VendorProductVariant[];
}

interface VendorProductsPanelProps {
  isApproved: boolean;
  vendorStatus?: string;
  onAddProduct: () => void;
  refreshKey?: number;
}

export function VendorProductsPanel({
  isApproved,
  vendorStatus,
  onAddProduct,
  refreshKey = 0,
}: VendorProductsPanelProps) {
  const [items, setItems] = useState<VendorProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ApiClient.get<VendorProductItem[]>('/vendor/products');
      const list = Array.isArray(res) ? res : [];
      setItems(list);
      const nextDrafts: Record<string, string> = {};
      for (const product of list) {
        for (const variant of product.variants || []) {
          nextDrafts[variant.id] = String(variant.inventory?.stockQuantity ?? 0);
        }
      }
      setStockDrafts(nextDrafts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load shop products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshKey]);

  const handleSaveStock = async (variantId: string) => {
    const raw = stockDrafts[variantId];
    const parsed = Number.parseInt(raw ?? '0', 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setError('Stock quantity must be a whole number (0 or higher).');
      return;
    }

    setSavingVariantId(variantId);
    setError('');
    setFeedback('');
    try {
      await ApiClient.patch(`/vendor/inventory/${variantId}`, { stockQuantity: parsed });
      setFeedback('Inventory stock updated successfully.');
      await fetchProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update stock.');
    } finally {
      setSavingVariantId(null);
    }
  };

  return (
    <div className="dash-content">
      <div className="dash-welcome">
        <div>
          <p>SHOP INVENTORY</p>
          <h1>My Agricultural Products</h1>
          <span>
            Manage listed products, pack pricing, and real-time stock quantities shown to farmers in
            Store &amp; Cart.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="outline-btn" onClick={fetchProducts} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link href="/vendor/products" className="outline-btn">
            <ExternalLink size={14} /> Full Page
          </Link>
          {isApproved && (
            <button type="button" className="solid-btn" onClick={onAddProduct}>
              <Plus size={14} /> Add New Product
            </button>
          )}
        </div>
      </div>

      {!isApproved && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <ShieldAlert size={18} className="shrink-0 text-amber-700" />
          <span>
            Shop verification status: <b>{vendorStatus || 'PENDING'}</b>. Super Admin approval is
            required before adding or updating sellable catalog stock.
          </span>
        </div>
      )}

      {feedback && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
          {feedback}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="account-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-[#536459]">
            <Loader2 size={16} className="animate-spin text-[#174d2b]" />
            Loading shop catalog...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <Package size={32} className="mx-auto mb-3 text-[#7a8d81]" />
            <h3 className="text-sm font-bold text-[#17281e]">No agricultural products yet</h3>
            <p className="mt-1 text-xs text-[#536459]">
              Add your first product with packaging photos, pack size, price, and stock quantity.
            </p>
            {isApproved && (
              <button
                type="button"
                onClick={onAddProduct}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#174d2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#113a20]"
              >
                <Plus size={14} /> Add New Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e6ede7] text-[11px] uppercase tracking-wide text-[#5a6d61]">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">Category &amp; Brand</th>
                  <th className="pb-3 pr-4">Pack Variants &amp; Cart Price</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Stock Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef3ee]">
                {items.map((product) => {
                  const firstVar = product.variants?.[0];
                  return (
                    <tr key={product.id} className="align-top">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveProductImage(product.images?.[0]?.url)}
                            alt={product.title}
                            className="h-12 w-12 shrink-0 rounded-lg border border-[#e0e8e1] object-cover"
                            onError={handleProductImageError}
                          />
                          <div>
                            <div className="font-bold text-[#17281e]">{product.title}</div>
                            <div className="text-[11px] text-[#637569]">
                              {product.variants?.length || 0} pack option(s)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-[#435549]">
                        <div className="font-medium">{product.category?.name || 'Agri Inputs'}</div>
                        {product.brand?.name && (
                          <div className="text-[11px] text-[#6a7d71]">
                            Brand: {product.brand.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="space-y-1">
                          {(product.variants || []).map((v) => (
                            <div key={v.id} className="text-[11px] text-[#35463b]">
                              <b>{v.title}</b> ({v.sku}) —{' '}
                              <b className="text-[#174d2b]">
                                ₹{Number(v.price).toLocaleString('en-IN')}
                              </b>{' '}
                              {Number(v.mrp) > Number(v.price) && (
                                <del className="text-[#8a998f]">
                                  ₹{Number(v.mrp).toLocaleString('en-IN')}
                                </del>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            product.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800'
                              : product.status === 'REJECTED'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {firstVar ? (
                          <div className="space-y-2">
                            {(product.variants || []).map((v) => (
                              <div key={v.id} className="flex items-center gap-1.5">
                                <span className="min-w-[70px] text-[11px] text-[#55685c]">
                                  {v.title}:
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  disabled={!isApproved || savingVariantId === v.id}
                                  value={stockDrafts[v.id] ?? String(v.inventory?.stockQuantity ?? 0)}
                                  onChange={(e) =>
                                    setStockDrafts((prev) => ({
                                      ...prev,
                                      [v.id]: e.target.value,
                                    }))
                                  }
                                  className="w-20 rounded-md border border-[#cdd9cf] px-2 py-1 text-xs"
                                />
                                {isApproved && (
                                  <button
                                    type="button"
                                    disabled={savingVariantId === v.id}
                                    onClick={() => handleSaveStock(v.id)}
                                    className="inline-flex items-center gap-1 rounded-md bg-[#eef7f0] px-2 py-1 text-[11px] font-semibold text-[#174d2b] hover:bg-[#dceee0] disabled:opacity-50"
                                  >
                                    {savingVariantId === v.id ? (
                                      <Loader2 size={11} className="animate-spin" />
                                    ) : (
                                      <Save size={11} />
                                    )}
                                    Save
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#7a8d81]">No variants</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
