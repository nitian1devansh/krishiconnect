import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNavigation } from '@/components/layout/MobileNavigation';

export const metadata: Metadata = {
  title: 'KrishiConnect (कृषि कनेक्ट) - Multi-Vendor Agricultural Marketplace',
  description:
    'Connect with verified seed producers, fertilizer manufacturers, and agricultural equipment suppliers across India. Genuine products, transparent mandi rates, and fast farm delivery.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <div className="app">
                  <Header />
                  {children}
                  <Footer />
                  <MobileNavigation />
                </div>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
