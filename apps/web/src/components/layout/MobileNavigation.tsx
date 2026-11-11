'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, Home, Search, ShoppingCart, Store, User } from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { cart } = useCart();

  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const isFullScreen =
    pathname?.startsWith('/vendor') ||
    pathname?.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/checkout';

  if (isFullScreen) return null;

  return (
    <nav className="mobile-bottom">
      <Link href="/" className={pathname === '/' ? 'active' : ''}>
        <Home size={20} />
        <span>{tx(language, 'Home', 'होम')}</span>
      </Link>
      <Link href="/products" className={pathname === '/products' ? 'active' : ''}>
        <Boxes size={20} />
        <span>{tx(language, 'Categories', 'श्रेणियाँ')}</span>
      </Link>
      <Link href="/products">
        <Search size={20} />
        <span>{tx(language, 'Search', 'खोजें')}</span>
      </Link>
      {user?.role === 'VENDOR' ? (
        <Link
          href={user.vendorProfile?.status === 'APPROVED' ? '/vendor/dashboard' : '/vendor/verification'}
        >
          <Store size={20} />
          <span>{tx(language, 'Shop', 'दुकान')}</span>
        </Link>
      ) : (
        <Link href="/cart" className="mob-cart">
          <ShoppingCart size={20} />
          <span>{tx(language, 'Cart', 'कार्ट')}</span>
          {cartCount > 0 && <i>{cartCount}</i>}
        </Link>
      )}
      <Link href={user ? '/account/profile' : '/login'} className={pathname?.startsWith('/account') ? 'active' : ''}>
        <User size={20} />
        <span>{tx(language, 'Profile', 'प्रोफ़ाइल')}</span>
      </Link>
    </nav>
  );
};

export default MobileNavigation;

