'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Settings,
  X,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { ProductCard } from '@/components/common/ProductCard';
import { products as initialProducts, RefProduct } from '@/lib/referenceData';
import { ApiClient } from '@/lib/api';

function Filter({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
}) {
  return (
    <div className="filter-block">
      <b>{title}</b>
      {options.map((o, i) => (
        <label key={o}>
          <input
            type="checkbox"
            checked={selected.includes(o)}
            onChange={() => onToggle(o)}
          />{' '}
          <span>{o}</span>
          <small>{42 - i * 7}</small>
        </label>
      ))}
    </div>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  const { language } = useLanguage();

  const [sort, setSort] = useState('Popular');
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(['In stock']);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [priceLimit, setPriceLimit] = useState(25000);
  const [productsList, setProductsList] = useState<RefProduct[]>(initialProducts);
  const [loadedFromDb, setLoadedFromDb] = useState(false);

  useEffect(() => {
    // Load approved products directly from backend database API
    ApiClient.get('/catalog/products?page=1&limit=50')
      .then((res) => {
        const rawList = Array.isArray(res.data) ? res.data : res.data?.products || [];
        if (rawList.length > 0) {
          const approved = rawList.filter(
            (p: any) => !p.status || p.status === 'APPROVED'
          );
          if (approved.length > 0) {
            const mapped: RefProduct[] = approved.map((p: any, idx: number) => ({
              id: p.id,
              variantId: p.variants?.[0]?.id,
              slug: p.slug,
              name: language === 'hi' && p.titleHi ? p.titleHi : p.title,
              category: p.category?.name || 'Seeds',
              price: Number(p.variants?.[0]?.price || 449),
              mrp: Number(p.variants?.[0]?.mrp || 599),
              rating: Number(p.rating || 4.8),
              reviews: p.reviewCount || 12 + idx * 5,
              image: p.images?.[0]?.url || initialProducts[idx % initialProducts.length].image,
              seller: p.vendor?.businessName || 'Verified Seller',
            }));
            setProductsList(mapped);
            setLoadedFromDb(true);
          }
        }
      })
      .catch(() => {
        // Fallback to initialProducts if backend is offline
      });
  }, [language]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleAvailability = (opt: string) => {
    setSelectedAvailability((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedAvailability([]);
    setSelectedRatings([]);
    setPriceLimit(25000);
    setSearch('');
  };

  const filtered = useMemo(() => {
    let result = productsList.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        p.seller.toLowerCase().includes(search.toLowerCase());

      const matchCat =
        selectedCategories.length === 0 ||
        selectedCategories.some((c) => {
          const lc = c.toLowerCase();
          const pc = p.category.toLowerCase();
          if (lc === 'equipment' || lc === 'tools' || lc === 'farming tools') {
            return pc.includes('tool') || pc.includes('equipment') || pc.includes('irrigation');
          }
          return pc.includes(lc);
        });

      const matchPrice = p.price <= priceLimit;

      return matchSearch && matchCat && matchPrice;
    });

    if (sort === 'Price: Low to High') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === 'Top rated') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [productsList, search, selectedCategories, priceLimit, sort]);

  const displayList = loadedFromDb ? filtered : filtered.length > 0 ? filtered : initialProducts;

  return (
    <main className="container listing">
      <div className="breadcrumbs">
        <span onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
          Home
        </span>{' '}
        <ChevronRight /> Agricultural inputs <ChevronRight /> All products
      </div>

      <div className="listing-head">
        <div>
          <h1>{tx(language, 'Agricultural Products', 'कृषि उत्पाद')}</h1>
          <p>
            {displayList.length}{' '}
            {tx(
              language,
              'quality products from verified sellers',
              'गुणवत्तापूर्ण उत्पाद सत्यापित विक्रेताओं से'
            )}
          </p>
        </div>
        <button
          type="button"
          className="filter-trigger mobile-only-flex"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <Settings size={17} /> Filters
        </button>
        <label className="sort">
          Sort by:{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Popular</option>
            <option>Price: Low to High</option>
            <option>Top rated</option>
            <option>Newest</option>
          </select>
        </label>
      </div>

      <div className="listing-layout">
        <aside className={`filters ${filterOpen ? 'open' : ''}`}>
          <div className="filter-title">
            <b>Filters</b>
            <button type="button" onClick={clearFilters}>
              Clear all
            </button>
          </div>

          <Filter
            title="Category"
            options={['Seeds', 'Fertilizers', 'Crop Protection', 'Irrigation', 'Farming Tools']}
            selected={selectedCategories}
            onToggle={toggleCategory}
          />

          <Filter
            title="Availability"
            options={['In stock', 'Fast delivery']}
            selected={selectedAvailability}
            onToggle={toggleAvailability}
          />

          <Filter
            title="Seller rating"
            options={['4★ & above', '3★ & above']}
            selected={selectedRatings}
            onToggle={(r) =>
              setSelectedRatings((prev) =>
                prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
              )
            }
          />

          <div className="filter-block">
            <b>Price range</b>
            <input
              type="range"
              min="100"
              max="25000"
              step="100"
              value={priceLimit}
              onChange={(e) => setPriceLimit(Number(e.target.value))}
            />
            <div className="price-inputs">
              <span>₹100</span>
              <span>₹{priceLimit.toLocaleString()}</span>
            </div>
          </div>
        </aside>

        <div>
          <div className="active-filters">
            <span>
              Verified sellers <X size={13} />
            </span>
            <span>
              In stock <X size={13} />
            </span>
            {selectedCategories.map((c) => (
              <span key={c} onClick={() => toggleCategory(c)} style={{ cursor: 'pointer' }}>
                {c} <X size={13} />
              </span>
            ))}
          </div>

          <div className="product-grid listing-products">
            {displayList.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                open={() => router.push(`/products/${p.slug || p.id}`)}
              />
            ))}
          </div>

          <div className="pagination">
            <button type="button">
              <ArrowLeft />
            </button>
            <button type="button" className="active">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading products...</div>}>
      <ShopContent />
    </Suspense>
  );
}
