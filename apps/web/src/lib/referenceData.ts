import {
  Boxes,
  Droplets,
  Leaf,
  ShieldCheck,
  Sprout,
  Tractor,
} from 'lucide-react';

export const hero =
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1600&q=85';

export const productImages = [
  'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1752249764392-28d6eb72ef4e?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1573561368183-fd88bdb4503d?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1537877853655-34bdcda5e833?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1622383566005-14888dbbd47e?auto=format&fit=crop&w=700&q=80',
];

export interface RefProduct {
  id: string | number;
  variantId?: string;
  slug?: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  image: string;
  seller: string;
}

export const products: RefProduct[] = [
  {
    id: 1,
    slug: 'sarpan-f1-hybrid-tomato-seeds',
    name: 'Sarpan F1 Hybrid Tomato Seeds',
    category: 'Seeds',
    price: 449,
    mrp: 599,
    rating: 4.8,
    reviews: 328,
    image: productImages[1],
    seller: 'GreenGrow Seeds',
  },
  {
    id: 2,
    slug: 'premium-organic-vermicompost',
    name: 'Premium Organic Vermicompost',
    category: 'Fertilizers',
    price: 599,
    mrp: 799,
    rating: 4.7,
    reviews: 204,
    image: productImages[0],
    seller: 'Krishi Organics',
  },
  {
    id: 3,
    slug: 'heavy-duty-garden-tool-set',
    name: 'Heavy Duty Garden Tool Set',
    category: 'Tools',
    price: 1299,
    mrp: 1699,
    rating: 4.6,
    reviews: 156,
    image: productImages[3],
    seller: 'Bharat Agro Tools',
  },
  {
    id: 4,
    slug: 'drip-irrigation-starter-kit',
    name: 'Drip Irrigation Starter Kit',
    category: 'Irrigation',
    price: 2399,
    mrp: 2999,
    rating: 4.9,
    reviews: 91,
    image: productImages[2],
    seller: 'JalDhara Systems',
  },
  {
    id: 5,
    slug: 'steel-farming-spade-pro',
    name: 'Steel Farming Spade Pro',
    category: 'Equipment',
    price: 849,
    mrp: 1099,
    rating: 4.5,
    reviews: 72,
    image: productImages[4],
    seller: 'Bharat Agro Tools',
  },
  {
    id: 6,
    slug: 'bio-neem-crop-protector',
    name: 'Bio Neem Crop Protector',
    category: 'Organic',
    price: 349,
    mrp: 449,
    rating: 4.7,
    reviews: 189,
    image: productImages[5],
    seller: 'Krishi Organics',
  },
];

export const categories = [
  { name: 'Seeds', icon: Sprout, color: 'mint' },
  { name: 'Fertilizers', icon: Leaf, color: 'lime' },
  { name: 'Crop Protection', icon: ShieldCheck, color: 'amber' },
  { name: 'Irrigation', icon: Droplets, color: 'blue' },
  { name: 'Equipment', icon: Tractor, color: 'orange' },
  { name: 'Farming Tools', icon: Boxes, color: 'stone' },
  { name: 'Plants', icon: Leaf, color: 'rose' },
  { name: 'Organic', icon: Sprout, color: 'green' },
];

export const vendorNav = [
  'Overview',
  'My Shop',
  'Products',
  'Add Product',
  'Inventory',
  'Orders',
  'Customers',
  'Messages',
  'Payments',
  'Analytics',
  'Promotions',
  'Reviews',
  'Support',
  'Settings',
];

export const adminNav = [
  'Overview',
  'Farmers',
  'Shop Owners',
  'Shop Verification',
  'Shops',
  'Products',
  'Product Approvals',
  'Categories',
  'Orders',
  'Payments',
  'Commissions',
  'Payouts',
  'Messages',
  'Support',
  'Disputes',
  'Reviews',
  'Reports',
  'Analytics',
  'Settings',
  'Audit Logs',
];

export const hindiNav: Record<string, string> = {
  Overview: 'अवलोकन',
  'My Shop': 'मेरी दुकान',
  Products: 'उत्पाद',
  'Add Product': 'उत्पाद जोड़ें',
  Inventory: 'स्टॉक',
  Orders: 'ऑर्डर',
  Customers: 'ग्राहक',
  Messages: 'संदेश',
  Payments: 'भुगतान',
  Analytics: 'विश्लेषण',
  Promotions: 'प्रचार',
  Reviews: 'समीक्षाएँ',
  Support: 'सहायता',
  Settings: 'सेटिंग्स',
  Farmers: 'किसान',
  'Shop Owners': 'दुकानदार',
  'Shop Verification': 'दुकान सत्यापन',
  Shops: 'दुकानें',
  'Product Approvals': 'उत्पाद स्वीकृति',
  Categories: 'श्रेणियाँ',
  Commissions: 'कमीशन',
  Payouts: 'भुगतान वितरण',
  Disputes: 'विवाद',
  Reports: 'रिपोर्ट',
  'Audit Logs': 'ऑडिट लॉग',
};

