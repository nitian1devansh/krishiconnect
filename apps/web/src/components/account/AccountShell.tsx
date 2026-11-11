'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgeCheck,
  ChevronRight,
  FlaskConical,
  Heart,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  ShieldCheck,
  Sprout,
  Store,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLanguage, tx } from '@/context/LanguageContext';

interface AccountShellProps {
  sectionTitle: string;
  sectionTitleHi?: string;
  children: React.ReactNode;
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/api\/v1\/?$/, '');

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}

export const AccountShell: React.FC<AccountShellProps> = ({
  sectionTitle,
  sectionTitleHi,
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { language } = useLanguage();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading && !user) {
    return (
      <main className="container account-shell">
        <div className="account-card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            {tx(language, 'Loading your KrishiConnect account...', 'आपका कृषि कनेक्ट खाता लोड हो रहा है...')}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container account-shell">
        <div className="account-card" style={{ maxWidth: '540px', margin: '36px auto', textAlign: 'center', padding: '42px 28px' }}>
          <div className="account-card-icon" style={{ width: '56px', height: '56px', margin: '0 auto 14px', borderRadius: '50%' }}>
            <User size={26} />
          </div>
          <h1 style={{ fontSize: '21px', fontWeight: 800, marginBottom: '8px' }}>
            {tx(language, 'Sign in to view your Profile & Wishlist', 'अपनी प्रोफ़ाइल और पसंदीदा देखने के लिए साइन इन करें')}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '22px' }}>
            {tx(
              language,
              'Access your account details, farm or shop profile, saved wishlist items from the database, orders, and delivery addresses.',
              'अपने खाते का विवरण, खेत या दुकान प्रोफ़ाइल, डेटाबेस में सहेजे गए पसंदीदा उत्पाद, ऑर्डर और पते देखें।'
            )}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="primary" style={{ textDecoration: 'none' }}>
              {tx(language, 'Sign In', 'लॉग इन करें')}
            </Link>
            <Link href="/register" className="outline-btn" style={{ textDecoration: 'none' }}>
              {tx(language, 'Create Account', 'नया खाता बनाएँ')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const initials = (user.fullName || user.email || 'K')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const avatarSrc = resolveMediaUrl(user.avatarUrl);
  const roleLabel =
    user.role === 'ADMIN'
      ? tx(language, 'Super Admin', 'सुपर एडमिन')
      : user.role === 'VENDOR'
      ? tx(language, 'Shop Owner / Vendor', 'दुकान मालिक / विक्रेता')
      : tx(language, 'Farmer / Customer', 'किसान / ग्राहक');

  const counts = (user as any)._count || {};

  const allNavItems = [
    {
      href: '/account/profile',
      label: tx(language, 'My Profile & Role', 'मेरी प्रोफ़ाइल और भूमिका'),
      icon: User,
      badge: undefined,
    },
    {
      href: '/account/wishlist',
      label: tx(language, 'Saved Wishlist', 'मेरी पसंदीदा सूची'),
      icon: Heart,
      badge: wishlist.length,
    },
    {
      href: '/account/orders',
      label: tx(language, 'My Orders', 'मेरे ऑर्डर'),
      icon: Package,
      badge: typeof counts.orders === 'number' ? counts.orders : undefined,
    },
    {
      href: '/account/addresses',
      label: tx(language, 'Delivery Addresses', 'डिलीवरी पते'),
      icon: MapPin,
      badge: typeof counts.addresses === 'number' ? counts.addresses : undefined,
    },
    {
      href: '/account/messages',
      label: tx(language, 'Messages & Chat', 'संदेश और चैट'),
      icon: MessageSquare,
      badge: undefined,
    },
    {
      href: '/soil-testing',
      label: tx(language, 'Soil Testing Lab', 'मिट्टी परीक्षण लैब'),
      icon: FlaskConical,
      badge: typeof counts.soilTestReports === 'number' ? counts.soilTestReports : undefined,
    },
  ];

  const navItems =
    user.role === 'VENDOR'
      ? allNavItems.filter(
          (item) =>
            item.href !== '/account/wishlist' &&
            item.href !== '/account/orders' &&
            item.href !== '/account/addresses'
        )
      : allNavItems;

  return (
    <main className="container account-shell">
      <div className="account-breadcrumbs">
        <Link href="/">{tx(language, 'Home', 'होम')}</Link>
        <ChevronRight size={14} />
        <Link href="/account/profile">{tx(language, 'Account', 'खाता')}</Link>
        <ChevronRight size={14} />
        <strong>{language === 'hi' && sectionTitleHi ? sectionTitleHi : sectionTitle}</strong>
      </div>

      <div className="account-layout">
        <aside className="account-sidebar">
          <div className="account-user-hero">
            <div className="account-user-row">
              <div className="account-avatar">
                {avatarSrc ? <img src={avatarSrc} alt={user.fullName} /> : initials}
              </div>
              <div className="account-user-meta">
                <h2>{user.fullName}</h2>
                <p>{user.email}</p>
                {user.phone && <p>+91 {user.phone}</p>}
              </div>
            </div>

            <div className="account-pill-row">
              <span className="account-hero-pill">
                {user.role === 'ADMIN' ? (
                  <ShieldCheck size={12} />
                ) : user.role === 'VENDOR' ? (
                  <Store size={12} />
                ) : (
                  <Sprout size={12} />
                )}
                {roleLabel}
              </span>
              {user.role === 'VENDOR' && (
                <span className="account-hero-pill">
                  <BadgeCheck size={12} />{' '}
                  {user.vendorProfile?.status === 'APPROVED'
                    ? tx(language, 'Verified Shop Owner', 'सत्यापित दुकान मालिक')
                    : tx(language, 'Shop Verification Pending', 'दुकान सत्यापन लंबित')}
                </span>
              )}
            </div>
          </div>

          <nav className="account-nav" aria-label="Account sections">
            {navItems.map(({ href, label, icon: Icon, badge }) => {
              const isActive = pathname === href || (href === '/account/profile' && pathname === '/account');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`account-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  {badge !== undefined && <span className="nav-badge">{badge}</span>}
                </Link>
              );
            })}

            <div className="account-nav-divider" />

            {user.role === 'VENDOR' && (
              <Link
                href={
                  user.vendorProfile?.status === 'APPROVED'
                    ? '/vendor/dashboard'
                    : '/vendor/verification'
                }
                className="account-portal-cta"
              >
                <Store size={15} />{' '}
                {user.vendorProfile?.status === 'APPROVED'
                  ? tx(language, 'Open Vendor Workspace', 'विक्रेता डैशबोर्ड खोलें')
                  : tx(language, 'Shop Verification Status', 'दुकान सत्यापन स्थिति')}
              </Link>
            )}
            {user.role === 'ADMIN' && (
              <Link href="/admin/dashboard" className="account-portal-cta">
                <ShieldCheck size={15} /> {tx(language, 'Open Admin Console', 'एडमिन कंसोल खोलें')}
              </Link>
            )}
            {user.role === 'FARMER' && (
              <Link href="/support" className="account-portal-cta">
                <Sprout size={15} /> {tx(language, 'Open Farmer Hub', 'किसान केंद्र खोलें')}
              </Link>
            )}

            <button
              type="button"
              className="account-logout-btn"
              onClick={handleLogout}
              style={{ marginTop: '6px' }}
            >
              <LogOut size={17} />
              <span>{tx(language, 'Logout', 'लॉग आउट')}</span>
            </button>
          </nav>
        </aside>

        <section className="account-main">{children}</section>
      </div>
    </main>
  );
};

export default AccountShell;

