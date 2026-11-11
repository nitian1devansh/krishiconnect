'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { categories } from '@/lib/referenceData';

export default function CategoriesPage() {
  const router = useRouter();
  const { language } = useLanguage();

  return (
    <main className="container category-section" style={{ padding: '40px 0 60px' }}>
      <div className="section-head">
        <div>
          <span className="kicker">{tx(language, 'CATALOG TAXONOMY', 'वर्गीकरण')}</span>
          <h2>{tx(language, 'Explore All Categories', 'सभी श्रेणियाँ देखें')}</h2>
        </div>
      </div>

      <div className="category-grid">
        {categories.map(({ name, icon: Icon, color }) => (
          <button
            key={name}
            type="button"
            onClick={() => router.push(`/products?category=${encodeURIComponent(name)}`)}
            className="category-card"
          >
            <span className={`category-icon ${color}`}>
              <Icon size={26} />
            </span>
            <b>{name}</b>
            <small>Explore products</small>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
    </main>
  );
}
