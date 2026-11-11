'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage, tx } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/common/Logo';

export const Footer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();
  const { user } = useAuth();

  if (
    pathname?.startsWith('/vendor') ||
    pathname?.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/checkout'
  ) {
    return null;
  }

  const handleLinkClick = (x: string) => {
    switch (x) {
      case 'Community':
        router.push('/support?tab=community');
        break;
      case 'Crop calendar':
        router.push('/support?tab=calendar');
        break;
      case 'Weather assistant':
        router.push('/support?tab=weather');
        break;
      case 'Smart advisor':
        router.push('/support?tab=advisor');
        break;
      case 'Seeds':
        router.push('/products?category=Seeds');
        break;
      case 'Fertilizers':
        router.push('/products?category=Fertilizers');
        break;
      case 'Equipment':
        router.push('/products?category=Equipment');
        break;
      case 'Organic farming':
        router.push('/products?category=Organic');
        break;
      case 'Track order':
        if (user?.role === 'VENDOR') {
          router.push(
            user.vendorProfile?.status === 'APPROVED' ? '/vendor/orders' : '/vendor/verification'
          );
        } else {
          router.push('/account/orders');
        }
        break;
      default:
        router.push('/products');
        break;
    }
  };

  return (
    <footer>
      <div className="footer-main container">
        <div className="footer-brand">
          <Logo />
          <p>
            {tx(
              language,
              'Empowering Indian agriculture with trusted products, verified sellers, and expert guidance.',
              'भरोसेमंद उत्पादों, सत्यापित विक्रेताओं और विशेषज्ञ मार्गदर्शन से भारतीय कृषि को सशक्त बनाना।',
            )}
          </p>
          <div className="socials">
            <span>in</span>
            <span>f</span>
            <span>yt</span>
          </div>
        </div>
        {[
          ['Marketplace', 'Seeds', 'Fertilizers', 'Equipment', 'Organic farming'],
          ['Farmer Hub', 'Community', 'Crop calendar', 'Weather assistant', 'Smart advisor'],
          ['Support', 'Help center', 'Track order', 'Returns & refunds', 'Contact us'],
        ].map((col) => (
          <div key={col[0]}>
            <h4>{col[0]}</h4>
            {col.slice(1).map((x) => (
              <button
                type="button"
                key={x}
                onClick={() => handleLinkClick(x)}
              >
                {x}
              </button>
            ))}
          </div>
        ))}
        <div>
          <h4>{tx(language, 'Get in touch', 'संपर्क करें')}</h4>
          <p>1800-123-KRISHI</p>
          <p>support@krishiconnect.in</p>
          <p>Mon–Sat, 8 AM–8 PM</p>
        </div>
      </div>
      <div className="footer-bottom container">
        <span>
          © 2025 KrishiConnect. {tx(language, 'All rights reserved.', 'सर्वाधिकार सुरक्षित।')}
        </span>
        <span>
          {tx(language, 'Privacy · Terms · Seller policy', 'गोपनीयता · शर्तें · विक्रेता नीति')}
        </span>
        <span>{tx(language, 'Made for Indian agriculture', 'भारतीय कृषि के लिए निर्मित')}</span>
      </div>
    </footer>
  );
};

export default Footer;
