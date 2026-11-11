'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CloudSun,
  Droplets,
  FlaskConical,
  Headphones,
  MessageSquare,
  ShieldCheck,
  Sprout,
  Star,
  Truck,
  Wallet,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { ProductCard } from '@/components/common/ProductCard';
import { hero, products, categories, RefProduct } from '@/lib/referenceData';
import { ApiClient } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'trending' | 'best_sellers' | 'new_arrivals'>('trending');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [displayProducts, setDisplayProducts] = useState<RefProduct[]>(products);

  useEffect(() => {
    // Load approved products directly from backend database API
    ApiClient.get('/catalog/products?page=1&limit=8')
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
              category: p.category?.name || 'Farm Supplies',
              price: Number(p.variants?.[0]?.price || 449),
              mrp: Number(p.variants?.[0]?.mrp || 599),
              rating: Number(p.rating || 4.8),
              reviews: p.reviewCount || 12 + idx * 5,
              image: p.images?.[0]?.url || products[idx % products.length].image,
              seller: p.vendor?.businessName || 'Verified Seller',
            }));
            setDisplayProducts(mapped);
          }
        }
      })
      .catch(() => {
        // Fallback to reference data only if backend unreachable
      });
  }, [language]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOrEmail.trim()) {
      setSubscribed(true);
      setPhoneOrEmail('');
    }
  };

  return (
    <main>
      {/* 1. HERO SECTION */}
      <section className="hero">
        <img src={hero} alt="Farmer working in a lush agricultural field" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-tag">
            <BadgeCheck size={16} />{' '}
            {tx(language, 'India’s trusted agri marketplace', 'भारत का भरोसेमंद कृषि बाज़ार')}
          </span>
          <h1>
            {tx(language, 'Everything Your Farm Needs,', 'आपके खेत की हर ज़रूरत,')}
            <br />
            <em>{tx(language, 'All in One Place', 'एक ही जगह')}</em>
          </h1>
          <p>
            {tx(
              language,
              'Quality inputs, expert guidance, and verified sellers—delivered from our network to your farm.',
              'गुणवत्तापूर्ण कृषि सामग्री, विशेषज्ञ मार्गदर्शन और सत्यापित विक्रेता—सीधे आपके खेत तक।',
            )}
          </p>
          <div className="hero-buttons">
            <button
              type="button"
              className="primary"
              onClick={() => router.push('/products')}
            >
              {tx(language, 'Shop Now', 'अभी खरीदें')} <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="secondary-light"
              onClick={() => router.push('/products')}
            >
              {tx(language, 'Explore Categories', 'श्रेणियाँ देखें')}
            </button>
          </div>
          <div className="hero-trust">
            <span>
              <b>50K+</b> {tx(language, 'Farmers', 'किसान')}
            </span>
            <span>
              <b>500+</b> {tx(language, 'Verified shops', 'सत्यापित दुकानें')}
            </span>
            <span>
              <b>12K+</b> {tx(language, 'Products', 'उत्पाद')}
            </span>
          </div>
        </div>
        <div className="floating-review">
          <span className="avatar">RK</span>
          <p>
            <b>Trusted quality</b>
            <br />
            “Delivered right on time.”
          </p>
          <span className="stars">★★★★★</span>
        </div>
      </section>

      {/* 2. CATEGORY SECTION */}
      <section className="container category-section">
        <div className="section-head">
          <div>
            <span className="kicker">{tx(language, 'SHOP BY NEED', 'ज़रूरत के अनुसार खरीदें')}</span>
            <h2>{tx(language, 'What are you looking for?', 'आप क्या खोज रहे हैं?')}</h2>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => router.push('/products')}
          >
            {tx(language, 'View all categories', 'सभी श्रेणियाँ देखें')} <ArrowRight size={16} />
          </button>
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
      </section>

      {/* 3. PROMO GRID */}
      <section className="container promo-grid">
        <div className="promo green">
          <span>MONSOON ESSENTIALS</span>
          <h3>Grow more this season</h3>
          <p>Up to 25% off on selected seeds and nutrients.</p>
          <button type="button" onClick={() => router.push('/products?category=Seeds')}>
            Shop the collection <ArrowRight size={16} />
          </button>
          <Sprout className="promo-art" />
        </div>
        <div className="promo orange">
          <span>SMART IRRIGATION</span>
          <h3>Save every drop</h3>
          <p>Modern kits for every field size. Starting ₹899.</p>
          <button type="button" onClick={() => router.push('/products?category=Irrigation')}>
            Explore irrigation <ArrowRight size={16} />
          </button>
          <Droplets className="promo-art" />
        </div>
      </section>

      {/* 4. PRODUCTS SECTION */}
      <section className="products-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">FARMER FAVOURITES</span>
              <h2>Top picks for your farm</h2>
            </div>
            <div className="tabs">
              <button
                type="button"
                className={activeTab === 'trending' ? 'active' : ''}
                onClick={() => setActiveTab('trending')}
              >
                Trending
              </button>
              <button
                type="button"
                className={activeTab === 'best_sellers' ? 'active' : ''}
                onClick={() => setActiveTab('best_sellers')}
              >
                Best sellers
              </button>
              <button
                type="button"
                className={activeTab === 'new_arrivals' ? 'active' : ''}
                onClick={() => setActiveTab('new_arrivals')}
              >
                New arrivals
              </button>
            </div>
          </div>
          <div className="product-grid">
            {displayProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                open={() => router.push(`/products/${p.slug || p.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. VERIFIED SHOPS SECTION */}
      <section className="container shop-section">
        <div className="section-head">
          <div>
            <span className="kicker">BUY WITH CONFIDENCE</span>
            <h2>Verified shops near you</h2>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => router.push('/products')}
          >
            View all shops <ArrowRight size={16} />
          </button>
        </div>
        <div className="shop-grid">
          {['GreenGrow Seeds', 'Krishi Organics', 'Bharat Agro Tools'].map((shop, i) => (
            <article className="shop-card" key={shop}>
              <div className="shop-logo">{['GG', 'KO', 'BA'][i]}</div>
              <div>
                <h3>
                  {shop} <BadgeCheck size={16} />
                </h3>
                <p>
                  {['Seeds & crop nutrition', 'Organic inputs & plants', 'Tools & machinery'][i]}
                </p>
                <span className="rating">
                  <Star size={13} fill="currentColor" /> {4.9 - i * 0.1} &nbsp; · &nbsp;{' '}
                  {120 + i * 48} products
                </span>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/products?vendor=${encodeURIComponent(shop)}`)}
                aria-label={`View ${shop}`}
              >
                <ChevronRight />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* 6. TESTIMONIAL BANNER */}
      <section className="testimonial">
        <div className="container testimonial-inner">
          <div>
            <span className="kicker light">FARMER STORIES</span>
            <h2>
              Built for those who
              <br />
              feed the nation.
            </h2>
            <p>
              “KrishiConnect helped me find genuine seeds and the right advice. My tomato yield
              improved by almost 30% this season.”
            </p>
            <div className="quote-author">
              <span>MS</span>
              <div>
                <b>Mahesh Saini</b>
                <small>Farmer, Nashik, Maharashtra</small>
              </div>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1615829254885-d4bfd5ce700e?auto=format&fit=crop&w=800&q=85"
            alt="Farmer in a green field"
          />
        </div>
      </section>

      {/* 7. FARM INTELLIGENCE / ADVISORY SERVICES */}
      <section className="farm-intelligence">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="kicker">{tx(language, 'BEYOND THE MARKETPLACE', 'बाज़ार से आगे')}</span>
              <h2>
                {tx(language, 'Smarter decisions, stronger harvests', 'बेहतर निर्णय, बेहतर उपज')}
              </h2>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => router.push('/support')}
            >
              {tx(language, 'Open Farmer Hub', 'किसान केंद्र खोलें')} <ArrowRight size={16} />
            </button>
          </div>
          <div className="intelligence-grid">
            {[
              {
                tab: 'community',
                icon: MessageSquare,
                title: 'Farmer Community',
                titleHi: 'किसान समुदाय',
                text: 'Ask questions, share experiences and consult verified experts.',
                textHi: 'सवाल पूछें, अनुभव साझा करें और सत्यापित विशेषज्ञों से सलाह लें।',
                meta: '2.4K active farmers',
                metaHi: '2.4K सक्रिय किसान',
              },
              {
                tab: 'calendar',
                icon: CalendarDays,
                title: 'Crop Calendar',
                titleHi: 'फसल कैलेंडर',
                text: 'Personalized tasks from land preparation through harvest.',
                textHi: 'खेत की तैयारी से कटाई तक व्यक्तिगत कार्य योजना।',
                meta: '3 tasks this week',
                metaHi: 'इस सप्ताह 3 कार्य',
              },
              {
                tab: 'weather',
                icon: CloudSun,
                title: 'Weather Assistant',
                titleHi: 'मौसम सहायक',
                text: 'Field-ready irrigation, spraying and sowing guidance.',
                textHi: 'सिंचाई, छिड़काव और बुवाई के लिए मार्गदर्शन।',
                meta: 'Rain likely Thursday',
                metaHi: 'गुरुवार को बारिश संभव',
              },
              {
                tab: 'soil',
                icon: FlaskConical,
                title: 'Soil Testing Lab',
                titleHi: 'मृदा परीक्षण लैब',
                text: 'Laboratory analysis, NPK nutrient balancing & pH correction.',
                textHi: 'प्रयोगशाला विश्लेषण, NPK पोषण संतुलन और pH सुधार।',
                meta: 'Optimal pH 6.8',
                metaHi: 'उचित pH 6.8',
              },
              {
                tab: 'advisor',
                icon: FlaskConical,
                title: 'Smart Recommendations',
                titleHi: 'स्मार्ट सुझाव',
                text: 'Crop-specific fertilizer and pest-control suggestions.',
                textHi: 'फसल के अनुसार उर्वरक और कीट नियंत्रण सुझाव।',
                meta: 'Personalized to your farm',
                metaHi: 'आपके खेत के अनुसार',
              },
            ].map(({ tab, icon: Icon, title, titleHi, text, textHi, meta, metaHi }, index) => (
              <button
                type="button"
                className={`intelligence-card tone-${index}`}
                key={title}
                onClick={() => router.push(`/support?tab=${tab}`)}
              >
                <span className="intelligence-icon">
                  <Icon />
                </span>
                <h3>{tx(language, title, titleHi)}</h3>
                <p>{tx(language, text, textHi)}</p>
                <small>{tx(language, meta, metaHi)}</small>
                <ArrowRight className="card-arrow" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 8. BENEFITS SECTION */}
      <section className="container benefits">
        <div>
          <ShieldCheck />
          <p>
            <b>100% genuine products</b>
            <span>Quality checked sellers</span>
          </p>
        </div>
        <div>
          <Truck />
          <p>
            <b>Farm-door delivery</b>
            <span>Across 18,000+ pincodes</span>
          </p>
        </div>
        <div>
          <Headphones />
          <p>
            <b>Expert support</b>
            <span>Talk to agri specialists</span>
          </p>
        </div>
        <div>
          <Wallet />
          <p>
            <b>Secure payments</b>
            <span>Safe and flexible options</span>
          </p>
        </div>
      </section>

      {/* 9. NEWSLETTER / SMS UPDATES */}
      <section className="newsletter">
        <div>
          <h2>Harvest better, every season.</h2>
          <p>Get expert tips, product updates and exclusive farmer offers.</p>
        </div>
        <form onSubmit={handleNewsletterSubmit}>
          <input
            value={phoneOrEmail}
            onChange={(e) => setPhoneOrEmail(e.target.value)}
            placeholder="Enter your mobile number or email"
            required
          />
          <button type="submit">
            {subscribed ? 'Subscribed ✓' : 'Keep me updated'}
          </button>
        </form>
      </section>
    </main>
  );
}
