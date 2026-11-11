'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Heart,
  Languages,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Logo } from '@/components/common/Logo';

export const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [search, setSearch] = useState('');

  // Hide the global storefront header on dedicated full-screen dashboards, login, and checkout
  if (
    pathname?.startsWith('/vendor') ||
    pathname?.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/checkout'
  ) {
    return null;
  }

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <>
      <div className="announcement">
        <span className="desktop-only-flex">
          <ShieldCheck size={14} />{' '}
          {tx(
            language,
            'Trusted by 50,000+ farmers across India',
            'भारत के 50,000+ किसानों का भरोसा',
          )}
        </span>
        <div className="portal-access">
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link href="/admin/dashboard" className={pathname?.startsWith('/admin') ? 'active' : ''}>
                  <ShieldCheck size={14} /> {tx(language, 'Admin Console', 'एडमिन कंसोल')}
                </Link>
              )}
              {user.role === 'VENDOR' && (
                <Link
                  href={
                    user.vendorProfile?.status === 'APPROVED'
                      ? '/vendor/dashboard'
                      : '/vendor/verification'
                  }
                  className={pathname?.startsWith('/vendor') ? 'active' : ''}
                >
                  <Store size={14} />{' '}
                  {user.vendorProfile?.status === 'APPROVED'
                    ? tx(language, 'Vendor Workspace', 'दुकान कार्यक्षेत्र')
                    : tx(language, 'Shop Verification Status', 'दुकान सत्यापन स्थिति')}
                </Link>
              )}
              {user.role === 'FARMER' && (
                <Link href="/support" className={pathname === '/support' ? 'active' : ''}>
                  <User size={14} /> {tx(language, 'Farmer Hub', 'किसान केंद्र')}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/register?role=vendor">
                <Store size={14} /> {tx(language, 'Sell Products', 'उत्पाद बेचें')}
              </Link>
              <Link href="/login">
                <User size={14} /> {tx(language, 'Sign In', 'लॉग इन')}
              </Link>
            </>
          )}
        </div>
        <div className="language-switch" aria-label="Language selection">
          <Languages size={15} />
          <button
            type="button"
            className={language === 'en' ? 'active' : ''}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={language === 'hi' ? 'active' : ''}
            onClick={() => setLanguage('hi')}
          >
            हिंदी
          </button>
        </div>
      </div>

      <header className="header">
        <div className="nav-row">
          <button
            type="button"
            className="icon-btn mobile-only"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle menu"
          >
            <Menu />
          </button>
          <Logo />
          <form className="search" onSubmit={handleSearchSubmit}>
            <Search size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tx(
                language,
                'Search seeds, fertilizers, tools and more',
                'बीज, उर्वरक, उपकरण और बहुत कुछ खोजें',
              )}
            />
            <button type="submit">{tx(language, 'Search', 'खोजें')}</button>
          </form>
          <nav className="nav-actions">
            <button
              type="button"
              onClick={() => router.push(user ? '/account/profile' : '/login')}
              title={user ? tx(language, 'My Profile & Account', 'मेरी प्रोफ़ाइल और खाता') : tx(language, 'Sign In', 'लॉग इन')}
            >
              <User size={21} />
              <span>{user ? user.fullName?.split(' ')[0] || 'Profile' : tx(language, 'Account', 'खाता')}</span>
            </button>
            {user?.role !== 'VENDOR' && (
              <>
                <button
                  type="button"
                  className="desktop-only-flex"
                  onClick={() => router.push(user ? '/account/wishlist' : '/login')}
                  title={tx(language, 'My Wishlist', 'मेरी पसंदीदा सूची')}
                >
                  <Heart size={21} fill={user && wishlist.length > 0 ? '#e34858' : 'none'} color={user && wishlist.length > 0 ? '#e34858' : 'currentColor'} />
                  <span>{tx(language, 'Wishlist', 'पसंदीदा')}</span>
                  {user && wishlist.length > 0 && <b className="nav-count">{wishlist.length}</b>}
                </button>
              </>
            )}
            <button
              type="button"
              className="desktop-only-flex notify-wrap"
              onClick={() => setNotifications(!notifications)}
              aria-label="Notifications"
            >
              <Bell size={21} />
              <i />
            </button>
            {user?.role !== 'VENDOR' && (
              <button
                type="button"
                className="cart-button"
                onClick={() => router.push('/cart')}
              >
                <ShoppingCart size={22} />
                <span>{tx(language, 'Cart', 'कार्ट')}</span>
                {cartCount > 0 && <b>{cartCount}</b>}
              </button>
            )}
          </nav>

          {notifications && (
            <div className="notification-pop">
              <div className="pop-title">
                <b>{tx(language, 'Notifications', 'सूचनाएँ')}</b>
                <span onClick={() => setNotifications(false)}>
                  {tx(language, 'Mark all read', 'सभी पढ़ा हुआ करें')}
                </span>
              </div>
              <div className="notification-item unread">
                <Package />
                <div>
                  <b>{tx(language, 'Your order has shipped', 'आपका ऑर्डर भेज दिया गया है')}</b>
                  <p>
                    {tx(
                      language,
                      'Order #KC2048 arrives by Friday',
                      'ऑर्डर #KC2048 शुक्रवार तक आएगा',
                    )}
                  </p>
                </div>
              </div>
              <div className="notification-item">
                <Tag />
                <div>
                  <b>{tx(language, 'Seasonal offer is live', 'मौसमी ऑफर शुरू है')}</b>
                  <p>{tx(language, 'Save up to 25% on seeds', 'बीज पर 25% तक बचाएँ')}</p>
                </div>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setNotifications(false);
                  if (user?.role === 'VENDOR') {
                    router.push(
                      user.vendorProfile?.status === 'APPROVED'
                        ? '/vendor/orders'
                        : '/vendor/verification'
                    );
                  } else {
                    router.push('/account/orders');
                  }
                }}
              >
                {tx(language, 'View notification center', 'सूचना केंद्र देखें')}
              </button>
            </div>
          )}
        </div>

        <div className={`category-nav ${menu ? 'open' : ''}`}>
          <button type="button" onClick={() => router.push('/products')}>
            <Menu size={17} /> {tx(language, 'All Categories', 'सभी श्रेणियाँ')}
          </button>
          <button type="button" onClick={() => router.push('/products?category=Seeds')}>
            {tx(language, 'Seeds', 'बीज')}
          </button>
          <button type="button" onClick={() => router.push('/products?category=Fertilizers')}>
            {tx(language, 'Fertilizers', 'उर्वरक')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/products?category=Crop%20Protection')}
          >
            {tx(language, 'Crop Protection', 'फसल सुरक्षा')}
          </button>
          <button type="button" onClick={() => router.push('/products?category=Equipment')}>
            {tx(language, 'Equipment', 'उपकरण')}
          </button>
          <button type="button" onClick={() => router.push('/products?category=Irrigation')}>
            {tx(language, 'Irrigation', 'सिंचाई')}
          </button>
          <button type="button" onClick={() => router.push('/support')}>
            <Users size={15} /> {tx(language, 'Farmer Hub', 'किसान केंद्र')}
          </button>
          <button
            type="button"
            className="deal-link"
            onClick={() => router.push('/products?deals=true')}
          >
            <Zap size={15} fill="currentColor" /> {tx(language, 'Today’s Deals', 'आज के ऑफर')}
          </button>
          {(!user || user.role === 'VENDOR') && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push('/register?role=vendor');
                } else if (user.vendorProfile?.status === 'APPROVED') {
                  router.push('/vendor/dashboard');
                } else {
                  router.push('/vendor/verification');
                }
              }}
            >
              <Store size={15} />{' '}
              {user?.role === 'VENDOR' && user.vendorProfile?.status !== 'APPROVED'
                ? tx(language, 'Shop Verification Status', 'दुकान सत्यापन स्थिति')
                : tx(language, 'Sell on KrishiConnect', 'KrishiConnect पर बेचें')}
            </button>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
