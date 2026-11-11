'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, ChevronRight, Star } from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';

export default function VendorsDirectoryPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const shops = [
    { name: 'GreenGrow Seeds', initials: 'GG', desc: 'Seeds & crop nutrition', rating: 4.9, count: 120 },
    { name: 'Krishi Organics', initials: 'KO', desc: 'Organic inputs & plants', rating: 4.8, count: 168 },
    { name: 'Bharat Agro Tools', initials: 'BA', desc: 'Tools & machinery', rating: 4.7, count: 216 },
    { name: 'JalDhara Systems', initials: 'JD', desc: 'Drip & micro irrigation', rating: 4.9, count: 91 },
    { name: 'Kisan Bio Care', initials: 'KB', desc: 'Bio pesticides & fertilizers', rating: 4.6, count: 84 },
    { name: 'Maha Krishi Center', initials: 'MK', desc: 'Farm implements & spares', rating: 4.8, count: 142 },
  ];

  return (
    <main className="container shop-section" style={{ padding: '40px 0 60px' }}>
      <div className="section-head">
        <div>
          <span className="kicker">{tx(language, 'BUY WITH CONFIDENCE', 'भरोसे के साथ खरीदें')}</span>
          <h2>{tx(language, 'Verified Agricultural Sellers', 'सत्यापित कृषि विक्रेता')}</h2>
        </div>
      </div>

      <div className="shop-grid">
        {shops.map((shop) => (
          <article className="shop-card" key={shop.name}>
            <div className="shop-logo">{shop.initials}</div>
            <div>
              <h3>
                {shop.name} <BadgeCheck size={16} />
              </h3>
              <p>{shop.desc}</p>
              <span className="rating">
                <Star size={13} fill="currentColor" /> {shop.rating} &nbsp; · &nbsp; {shop.count} products
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/products?vendor=${encodeURIComponent(shop.name)}`)}
              aria-label={`View ${shop.name}`}
            >
              <ChevronRight size={18} />
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
