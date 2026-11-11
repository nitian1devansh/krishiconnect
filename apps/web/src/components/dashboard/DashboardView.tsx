'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Headphones,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Tag,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/common/Logo';
import { MessagingCenter } from '@/components/dashboard/MessagingCenter';
import { VendorAccessGuard } from '@/components/vendor/VendorAccessGuard';
import { AddProductSection } from '@/components/vendor/AddProductSection';
import { VendorProductsPanel } from '@/components/vendor/VendorProductsPanel';
import {
  products as initialProducts,
  vendorNav,
  adminNav,
  hindiNav,
  RefProduct,
} from '@/lib/referenceData';

export function DashboardView({ type = 'vendor' }: { type: 'vendor' | 'admin' }) {
  const router = useRouter();
  const isAdmin = type === 'admin';
  const nav = isAdmin ? adminNav : vendorNav;
  const { language, setLanguage } = useLanguage();
  const { user, loading, logout, updateVendorProfileLocal, updateFarmerProfileLocal } = useAuth();

  const [active, setActive] = useState('Overview');
  const [sidebar, setSidebar] = useState(false);
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);

  const [modal, setModal] = useState<{
    action: 'Approve' | 'Reject' | 'Suspend' | 'Reactivate';
    type: 'Vendor' | 'Product';
    id: string;
    title: string;
  } | null>(null);
  const [modalRemarks, setModalRemarks] = useState('');

  // Tab filters inside Admin sections
  const [vendorTab, setVendorTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('PENDING');
  const [productTab, setProductTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Admin Farmers & Buyers directory list (no verification workflow needed for farmers)
  const [farmersList] = useState([
    {
      id: 'f-1',
      fullName: 'Sanjay Deshmukh',
      phone: '9823011223',
      email: 'sanjay.d@farmer.krishiconnect.in',
      farmSize: '6.5',
      farmSizeUnit: 'acres',
      district: 'Nashik',
      state: 'Maharashtra',
      createdAt: '18 May 2025',
    },
    {
      id: 'f-2',
      fullName: 'Kavita Shinde',
      phone: '9845012345',
      email: 'kavita.s@farmer.krishiconnect.in',
      farmSize: '4.0',
      farmSizeUnit: 'acres',
      district: 'Pune',
      state: 'Maharashtra',
      createdAt: '17 May 2025',
    },
    {
      id: 'f-3',
      fullName: 'Harpreet Singh',
      phone: '9876543201',
      email: 'harpreet@farmer.krishiconnect.in',
      farmSize: '12.0',
      farmSizeUnit: 'hectares',
      district: 'Ludhiana',
      state: 'Punjab',
      createdAt: '16 May 2025',
    },
    {
      id: 'f-4',
      fullName: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh.k@farmer.krishiconnect.in',
      farmSize: '4.5',
      farmSizeUnit: 'acres',
      district: 'Nashik',
      state: 'Maharashtra',
      createdAt: '10 May 2025',
    },
    {
      id: 'f-5',
      fullName: 'Manoj Verma',
      phone: '9890123456',
      email: 'manoj.v@farmer.krishiconnect.in',
      farmSize: '2.0',
      farmSizeUnit: 'acres',
      district: 'Indore',
      state: 'Madhya Pradesh',
      createdAt: '08 May 2025',
    },
  ]);

  // Interactive Admin state: Vendors list
  const [vendorsList, setVendorsList] = useState([
    {
      id: 'v-1',
      shopName: 'Kisan Agro Care Center',
      ownerName: 'Rajesh Patil',
      email: 'kisanagro@example.com',
      phone: '9822019922',
      gstin: '27AABCK1234F1Z9',
      address: 'Shop 14, APMC Market Yard',
      district: 'Nashik',
      state: 'Maharashtra',
      pincode: '422003',
      establishedSince: '2019',
      businessType: 'Retailer & Distributor',
      documents: 'GST_Certificate.pdf, Trade_License.pdf',
      status: 'PENDING',
      rejectionReason: '',
      createdAt: '18 May 2025',
    },
    {
      id: 'v-2',
      shopName: 'Shree Seeds & Nutrients',
      ownerName: 'Amit Shah',
      email: 'shreeseeds@example.com',
      phone: '9879011223',
      gstin: '24BBBCD5678G2Z1',
      address: 'Plot 4, Krishi Udhyog',
      district: 'Surat',
      state: 'Gujarat',
      pincode: '395003',
      establishedSince: '2017',
      businessType: 'Seed Producer',
      documents: 'Seed_License_2025.pdf',
      status: 'PENDING',
      rejectionReason: '',
      createdAt: '17 May 2025',
    },
    {
      id: 'v-3',
      shopName: 'GreenGrow Seeds Pvt Ltd',
      ownerName: 'Vikram Patel',
      email: 'sales@greengrow.in',
      phone: '9876543211',
      gstin: '27AAAAA0000A1Z5',
      address: '42, Agro Industrial Area',
      district: 'Nashik',
      state: 'Maharashtra',
      pincode: '422003',
      establishedSince: '2018',
      businessType: 'Seed Producer',
      documents: 'GST_Verified.pdf, Seed_Producer_License.pdf',
      status: 'APPROVED',
      rejectionReason: '',
      createdAt: '02 May 2025',
    },
    {
      id: 'v-4',
      shopName: 'Fake Chemicals Depot',
      ownerName: 'Sunil Rao',
      email: 'fake.depot@example.com',
      phone: '9890123499',
      gstin: '27XXXXX0000X0X0',
      address: 'Unknown Road',
      district: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440001',
      establishedSince: '2024',
      businessType: 'Chemicals',
      documents: 'Invalid_Doc.png',
      status: 'REJECTED',
      rejectionReason: 'GSTIN failed verification check on GST portal. Invalid business address.',
      createdAt: '05 May 2025',
    },
    {
      id: 'v-5',
      shopName: 'Maha Agro Spares',
      ownerName: 'Asha Pawar',
      email: 'maha.agro@example.com',
      phone: '9821098765',
      gstin: '27AACCA9876H1Z2',
      address: 'Near Old Bus Stand',
      district: 'Satara',
      state: 'Maharashtra',
      pincode: '415001',
      establishedSince: '2015',
      businessType: 'Equipment Supplier',
      documents: 'GST_Doc.pdf',
      status: 'SUSPENDED',
      rejectionReason: 'Repeated customer complaints regarding delivery delays.',
      createdAt: '12 Jan 2025',
    },
  ]);

  // Interactive Admin state: Products moderation list
  const [productsList, setProductsList] = useState<
    (RefProduct & { status: 'PENDING' | 'APPROVED' | 'REJECTED'; rejectionReason?: string })[]
  >([
    {
      ...initialProducts[0],
      status: 'APPROVED',
    },
    {
      ...initialProducts[1],
      status: 'APPROVED',
    },
    {
      id: 7,
      name: 'Unregulated Growth Tonic 500ml',
      category: 'Fertilizers',
      price: 299,
      mrp: 499,
      rating: 4.0,
      reviews: 0,
      image: initialProducts[0].image,
      seller: 'Kisan Agro Care Center',
      status: 'PENDING',
      rejectionReason: '',
    },
    {
      id: 8,
      name: 'Hybrid Cotton Seeds - Gold 2025',
      category: 'Seeds',
      price: 890,
      mrp: 1100,
      rating: 4.9,
      reviews: 0,
      image: initialProducts[1].image,
      seller: 'Shree Seeds & Nutrients',
      status: 'PENDING',
      rejectionReason: '',
    },
    {
      id: 9,
      name: 'Banned Endosulfan Substitute Compound',
      category: 'Crop Protection',
      price: 450,
      mrp: 600,
      rating: 3.5,
      reviews: 0,
      image: initialProducts[2].image,
      seller: 'Fake Chemicals Depot',
      status: 'REJECTED',
      rejectionReason: 'Contains unauthorized pesticide active ingredients not approved by CIB&RC.',
    },
  ]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'al-1',
      adminName: 'Ananya Sharma',
      action: 'VENDOR_APPROVED',
      target: 'GreenGrow Seeds Pvt Ltd',
      remarks: 'All documents and GST verified on portal.',
      timestamp: 'Today, 10:15 AM',
    },
    {
      id: 'al-2',
      adminName: 'Ananya Sharma',
      action: 'PRODUCT_APPROVED',
      target: 'Sarpan F1 Hybrid Tomato Seeds',
      remarks: 'Complies with seed certification standards.',
      timestamp: 'Yesterday, 04:30 PM',
    },
    {
      id: 'al-3',
      adminName: 'Ananya Sharma',
      action: 'VENDOR_REJECTED',
      target: 'Fake Chemicals Depot',
      remarks: 'GSTIN failed verification check on GST portal.',
      timestamp: '16 May 2025, 11:20 AM',
    },
    {
      id: 'al-4',
      adminName: 'Ananya Sharma',
      action: 'VENDOR_SUSPENDED',
      target: 'Maha Agro Spares',
      remarks: 'Customer dispute escalation #DISP-912.',
      timestamp: '15 May 2025, 02:45 PM',
    },
  ]);

  // -------------------------------------------------------------
  // STRICT ROLE ACCESS CONTROL GATING
  // -------------------------------------------------------------
  if (!isAdmin && (loading || !user || user.role !== 'VENDOR')) {
    return <VendorAccessGuard requireApproved={false}>{null}</VendorAccessGuard>;
  }

  if (isAdmin && loading) {
    return (
      <main className="container" style={{ padding: '64px 20px' }}>
        <div className="account-card" style={{ maxWidth: '540px', margin: '0 auto', textAlign: 'center', padding: '48px 28px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>Checking admin permissions...</p>
        </div>
      </main>
    );
  }

  if (isAdmin && (!user || user.role !== 'ADMIN')) {
    return (
      <main className="container" style={{ padding: '64px 20px' }}>
        <div className="account-card" style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', padding: '42px 28px' }}>
          <div className="account-card-icon" style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#fef2f2', color: '#b91c1c', margin: '0 auto 14px' }}>
            <ShieldAlert size={26} />
          </div>
          <h1 style={{ fontSize: '21px', fontWeight: 800, marginBottom: '8px' }}>Admin Access Required</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '22px' }}>
            This console is restricted to KrishiConnect Super Administrators.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="primary" style={{ textDecoration: 'none' }}>Sign In as Admin</Link>
            <Link href="/" className="outline-btn" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={15} /> Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Vendor's current verification status (must be explicitly APPROVED to sell)
  const vendorStatus = user?.vendorProfile?.status || 'PENDING';

  // -------------------------------------------------------------
  // VENDOR REJECTED SCREEN
  // -------------------------------------------------------------
  if (!isAdmin && vendorStatus === 'REJECTED') {
    return (
      <div className="dashboard">
        <aside className="dash-sidebar">
          <Logo onClick={() => router.push('/')} />
          <div className="workspace">
            <span>VENDOR WORKSPACE</span>
            <b>{user?.vendorProfile?.businessName || 'My Agri Shop'}</b>
            <small style={{ color: '#dc2626', fontWeight: 700 }}>VERIFICATION REJECTED</small>
          </div>
          <button className="back-market" onClick={() => router.push('/')}>
            <ArrowLeft size={16} /> Back to marketplace
          </button>
        </aside>

        <main className="dash-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              maxWidth: '560px',
              background: '#fff',
              border: '1px solid #fee2e2',
              borderRadius: '20px',
              padding: '36px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <ShieldAlert size={32} />
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '14px 0 8px' }}>
              Shop Application Rejected
            </h1>

            <div
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'left',
                margin: '18px 0 24px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#be123c', textTransform: 'uppercase' }}>
                Admin Rejection Remarks:
              </span>
              <p style={{ color: '#881337', fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>
                “{user?.vendorProfile?.rejectionReason || 'Uploaded trade license is expired. Please submit valid 2025 license.'}”
              </p>
            </div>

            <button
              type="button"
              className="primary full"
              onClick={() => router.push('/vendor/verification')}
            >
              Update Documents & Resubmit
            </button>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VENDOR ACCESS CONTROL GATING (PENDING / SUSPENDED / UNVERIFIED)
  // -------------------------------------------------------------
  if (!isAdmin && vendorStatus !== 'APPROVED') {
    const isSuspended = vendorStatus === 'SUSPENDED';
    return (
      <div className="dashboard">
        <aside className="dash-sidebar">
          <Logo onClick={() => router.push('/')} />
          <div className="workspace">
            <span>VENDOR WORKSPACE</span>
            <b>{user?.vendorProfile?.businessName || 'My Agri Shop'}</b>
            <small style={{ color: isSuspended ? '#dc2626' : '#d97706', fontWeight: 700 }}>
              {isSuspended ? 'SHOP SUSPENDED' : 'VERIFICATION PENDING'}
            </small>
          </div>
          <nav>
            <button className="active">
              <Clock size={16} /> Verification Status
            </button>
            <button onClick={() => router.push('/vendor/verification')}>
              <FileText size={16} /> View Submitted Docs
            </button>
          </nav>
          <button className="back-market" onClick={() => router.push('/')}>
            <ArrowLeft size={16} /> Back to marketplace
          </button>
        </aside>

        <main className="dash-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              maxWidth: '560px',
              background: '#fff',
              border: '1px solid #dfe7df',
              borderRadius: '20px',
              padding: '36px',
              textAlign: 'center',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isSuspended ? '#fee2e2' : '#fef3c7',
                color: isSuspended ? '#b91c1c' : '#92400e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              {isSuspended ? <ShieldAlert size={32} /> : <Clock size={32} />}
            </div>

            <span
              style={{
                background: isSuspended ? '#fee2e2' : '#fef3c7',
                color: isSuspended ? '#b91c1c' : '#92400e',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '20px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              {isSuspended ? 'Shop Account Suspended' : 'Shop Under Administrative Review'}
            </span>

            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '14px 0 8px' }}>
              {isSuspended ? 'Selling Access Paused' : 'Vendor Verification in Progress'}
            </h1>

            <p style={{ color: '#66736a', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
              {isSuspended
                ? `Your shop ${user?.vendorProfile?.businessName || ''} is currently suspended from selling on KrishiConnect. Contact support for reinstatement.`
                : `Your shop ${user?.vendorProfile?.businessName || 'Your Shop'} is currently being reviewed by the Super Administrator. Selling features remain locked until your shop is approved.`}
            </p>

            <div
              style={{
                background: '#f8faf7',
                border: '1px solid #dfe7df',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#66736a' }}>Shop Verification Status:</span>
                <b style={{ color: isSuspended ? '#b91c1c' : '#d97706' }}>{vendorStatus}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#66736a' }}>Catalog & Product Publishing:</span>
                <b style={{ color: '#66736a' }}>Locked until approved</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#66736a' }}>Payment Settlement:</span>
                <b style={{ color: '#66736a' }}>Requires verified shop</b>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="outline-btn full"
                onClick={() => router.push('/')}
              >
                Back to Marketplace
              </button>
              <button
                type="button"
                className="primary full"
                onClick={() => router.push('/vendor/verification')}
              >
                <RefreshCw size={15} /> View Verification Page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTION HANDLER FOR APPROVE / REJECT / SUSPEND MODALS
  // -------------------------------------------------------------
  const handleConfirmAction = () => {
    if (!modal) return;
    const { action, type, id, title } = modal;

    if (action === 'Reject' && !modalRemarks.trim()) {
      alert('A mandatory rejection reason is required.');
      return;
    }

    if (type === 'Vendor') {
      const newStatus = action === 'Approve' ? 'APPROVED' : action === 'Suspend' ? 'SUSPENDED' : 'REJECTED';
      setVendorsList((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, status: newStatus, rejectionReason: action === 'Reject' ? modalRemarks : '' } : v
        )
      );

      setAuditLogs((prev) => [
        {
          id: `al-${Date.now()}`,
          adminName: user?.fullName || 'Super Admin',
          action: `VENDOR_${newStatus}`,
          target: title,
          remarks: modalRemarks || `Vendor status updated to ${newStatus}.`,
          timestamp: 'Just now',
        },
        ...prev,
      ]);
    } else if (type === 'Product') {
      const newStatus = action === 'Approve' ? 'APPROVED' : 'REJECTED';
      setProductsList((prev) =>
        prev.map((p) =>
          String(p.id) === String(id) ? { ...p, status: newStatus, rejectionReason: action === 'Reject' ? modalRemarks : '' } : p
        )
      );

      setAuditLogs((prev) => [
        {
          id: `al-${Date.now()}`,
          adminName: user?.fullName || 'Super Admin',
          action: `PRODUCT_${newStatus}`,
          target: title,
          remarks: modalRemarks || `Product review status updated to ${newStatus}.`,
          timestamp: 'Just now',
        },
        ...prev,
      ]);
    }

    alert(`Successfully processed: ${action} for ${title}`);
    setModal(null);
    setModalRemarks('');
  };

  const pendingVendorsCount = vendorsList.filter((v) => v.status === 'PENDING').length;
  const pendingProductsCount = productsList.filter((p) => p.status === 'PENDING').length;

  const stats = isAdmin
    ? [
        ['Gross GMV', '₹42.8L', '+18.2%'],
        ['Registered Farmers', String(farmersList.length), 'Buyer Accounts'],
        ['Pending Shops', String(pendingVendorsCount), 'Needs Action'],
        ['Pending Products', String(pendingProductsCount), 'Queue'],
      ]
    : [
        ['Total revenue', '₹3,84,250', '+12.5%'],
        ['Orders', '284', '+8.2%'],
        ['Store visitors', '12,490', '+18.4%'],
        ['Avg. rating', '4.8', '186 reviews'],
      ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebar ? 'open' : ''}`}>
        <Logo onClick={() => router.push('/')} />
        <div className="workspace">
          <span>
            {tx(
              language,
              isAdmin ? 'SUPER ADMIN' : 'VENDOR WORKSPACE',
              isAdmin ? 'सुपर एडमिन' : 'विक्रेता कार्यक्षेत्र'
            )}
          </span>
          <b>
            {tx(
              language,
              isAdmin ? 'Marketplace Control' : user?.vendorProfile?.businessName || 'GreenGrow Seeds',
              isAdmin ? 'मार्केटप्लेस नियंत्रण' : user?.vendorProfile?.businessName || 'ग्रीनग्रो सीड्स'
            )}
          </b>
          <small>
            {tx(
              language,
              isAdmin ? 'Full access' : 'Verified Seller',
              isAdmin ? 'पूर्ण पहुँच' : 'सत्यापित विक्रेता'
            )}
          </small>
        </div>

        <nav>
          {nav.map((x, i) => {
            const I = [
              LayoutDashboard,
              Store,
              Package,
              Plus,
              Boxes,
              ShoppingBag,
              Users,
              MessageSquare,
              Wallet,
              BarChart3,
              Tag,
              Star,
              Headphones,
              Settings,
            ][i % 14];

            let badgeCount = 0;
            if (x === 'Shop Verification' || x === 'Shop Owners') badgeCount = pendingVendorsCount;
            if (x === 'Product Approvals') badgeCount = pendingProductsCount;

            return (
              <button
                type="button"
                className={active === x ? 'active' : ''}
                key={x}
                onClick={() => {
                  setActive(x);
                  setSidebar(false);
                }}
              >
                <I size={17} />
                <span>{language === 'hi' ? hindiNav[x] || x : x}</span>
                {badgeCount > 0 && <span className="nav-count">{badgeCount}</span>}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className="back-market"
          onClick={() => router.push('/')}
        >
          <ArrowLeft size={16} /> {tx(language, 'Back to marketplace', 'मार्केटप्लेस पर वापस जाएँ')}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="dash-main">
        {/* Header */}
        <header className="dash-header">
          <button
            type="button"
            className="icon-btn mobile-only"
            onClick={() => setSidebar(!sidebar)}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div>
            <span>
              {tx(
                language,
                isAdmin ? 'Admin /' : 'Workspace /',
                isAdmin ? 'एडमिन /' : 'कार्यक्षेत्र /'
              )}{' '}
              {language === 'hi' ? hindiNav[active] || active : active}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="dash-language-switch">
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

            <button type="button" className="icon-btn" aria-label="Search">
              <Search size={18} />
            </button>

            <button type="button" className="icon-btn notify-wrap" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>

            <div className="user-chip" onClick={() => router.push('/account/profile')}>
              <span>{isAdmin ? 'AS' : 'VP'}</span>
              <div>
                <b>{isAdmin ? 'Ananya Sharma' : user?.fullName || 'Vikram Patel'}</b>
                <small>{isAdmin ? 'Super Admin' : 'Verified Vendor'}</small>
              </div>
              <ChevronDown size={14} />
            </div>

            <button
              type="button"
              className="icon-btn"
              title="Logout"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* ============================================================= */}
        {/* VIEW 1: OVERVIEW */}
        {/* ============================================================= */}
        {active === 'Overview' && (
          <div className="dash-content">
            <div className="dash-welcome">
              <div>
                <p>
                  {tx(
                    language,
                    isAdmin ? 'MARKETPLACE CONTROL CONSOLE' : 'STORE OVERVIEW',
                    isAdmin ? 'मार्केटप्लेस नियंत्रण' : 'स्टोर अवलोकन'
                  )}
                </p>
                <h1>
                  {tx(
                    language,
                    isAdmin ? 'Good morning, Ananya.' : `Good morning, ${user?.fullName?.split(' ')[0] || 'Partner'}.`,
                    isAdmin ? 'सुप्रभात, अनन्या।' : 'सुप्रभात, साथी।'
                  )}
                </h1>
                <span>
                  {tx(
                    language,
                    isAdmin
                      ? `There are ${pendingVendorsCount} shops and ${pendingProductsCount} products awaiting your review.`
                      : 'Your store is verified and active across all delivery zones.',
                    isAdmin
                      ? 'सत्यापन के लिए नई दुकानें प्रतीक्षारत हैं।'
                      : 'आपकी दुकान सत्यापित है और सक्रिय है।'
                  )}
                </span>
              </div>
              <button
                type="button"
                className="primary"
                onClick={() => setActive(isAdmin ? 'Shop Verification' : 'Add Product')}
              >
                <Plus size={16} /> {isAdmin ? 'Review Applications' : 'Add New Product'}
              </button>
            </div>

            {/* KPI Cards */}
            <div className="stat-grid">
              {stats.map(([a, b, c], i) => {
                const StatIcon = [Wallet, Users, Store, Package][i];
                return (
                  <article key={a}>
                    <div className={`stat-icon s${i}`}>
                      <StatIcon size={21} />
                    </div>
                    <span>{a}</span>
                    <h2>{b}</h2>
                    <small className={c.includes('Needs') ? 'warning-text' : ''}>
                      {c} {i === 0 && <TrendingUp size={13} />}
                    </small>
                  </article>
                );
              })}
            </div>

            {/* Quick Priority Action Queues */}
            {isAdmin && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', margin: '24px 0' }}>
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #dfe7df',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span className="kicker">VENDOR QUEUE</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 8px' }}>
                      {pendingVendorsCount} Pending Shops
                    </h3>
                    <p style={{ color: '#66736a', fontSize: '12px', margin: 0 }}>
                      Agri dealers with submitted GSTIN & trade licenses awaiting onboarding.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="outline-btn"
                    style={{ marginTop: '16px', width: '100%' }}
                    onClick={() => setActive('Shop Verification')}
                  >
                    Open Shop Queue <ArrowRight size={14} />
                  </button>
                </div>

                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #dfe7df',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span className="kicker">CATALOG QUEUE</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 8px' }}>
                      {pendingProductsCount} Products for Review
                    </h3>
                    <p style={{ color: '#66736a', fontSize: '12px', margin: 0 }}>
                      Newly submitted inputs, pricing, and label claims awaiting release.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="outline-btn"
                    style={{ marginTop: '16px', width: '100%' }}
                    onClick={() => setActive('Product Approvals')}
                  >
                    Open Product Moderation <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Standard Overview Table */}
            <article className="table-card">
              <div className="card-head">
                <div>
                  <h3>Recent Marketplace Verifications</h3>
                  <p>Audit trail of approved and audited partners</p>
                </div>
                <button type="button" onClick={() => setActive('Audit Logs')}>
                  View all audit logs <ArrowRight size={15} />
                </button>
              </div>
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Target Entity</th>
                      <th>Admin</th>
                      <th>Notes / Reason</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.slice(0, 4).map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span
                            className={`status ${
                              log.action.includes('APPROVED')
                                ? 'success'
                                : log.action.includes('REJECTED')
                                ? 'pending'
                                : 'processing'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <b>{log.target}</b>
                        </td>
                        <td>{log.adminName}</td>
                        <td>{log.remarks}</td>
                        <td>{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 2: FARMER & BUYER DIRECTORY (ADMIN ONLY) */}
        {/* ============================================================= */}
        {isAdmin && active === 'Farmers' && (
          <div className="dash-content">
            <div className="dash-welcome">
              <div>
                <p>BUYER DIRECTORY</p>
                <h1>Registered Farmers & Buyers</h1>
                <span>Registered farmer buyer accounts across districts. Farmers do not require shop verification.</span>
              </div>
            </div>

            <article className="table-card">
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Farmer Name</th>
                      <th>Phone & Email</th>
                      <th>Farm Size</th>
                      <th>District / State</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmersList.map((farmer) => (
                      <tr key={farmer.id}>
                        <td>
                          <b>{farmer.fullName}</b>
                        </td>
                        <td>
                          +91 {farmer.phone}
                          <small style={{ display: 'block', color: '#66736a' }}>{farmer.email}</small>
                        </td>
                        <td>
                          <b>
                            {farmer.farmSize} {farmer.farmSizeUnit}
                          </b>
                        </td>
                        <td>
                          {farmer.district}, {farmer.state}
                        </td>
                        <td>{farmer.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 3: SHOP / VENDOR VERIFICATION (ADMIN ONLY) */}
        {/* ============================================================= */}
        {isAdmin && (active === 'Shop Verification' || active === 'Shop Owners' || active === 'Shops') && (
          <div className="dash-content">
            <div className="dash-welcome">
              <div>
                <p>ADMIN VERIFICATION SYSTEM</p>
                <h1>Shop Owner & Vendor Verification</h1>
                <span>Inspect GSTIN, trade licenses, addresses, and onboard verified agricultural dealers.</span>
              </div>
            </div>

            {/* Subtabs */}
            <div className="feed-filters" style={{ margin: '16px 0 24px' }}>
              <button
                type="button"
                className={vendorTab === 'PENDING' ? 'active' : ''}
                onClick={() => setVendorTab('PENDING')}
              >
                Pending Verification ({vendorsList.filter((v) => v.status === 'PENDING').length})
              </button>
              <button
                type="button"
                className={vendorTab === 'APPROVED' ? 'active' : ''}
                onClick={() => setVendorTab('APPROVED')}
              >
                Approved Shops ({vendorsList.filter((v) => v.status === 'APPROVED').length})
              </button>
              <button
                type="button"
                className={vendorTab === 'REJECTED' ? 'active' : ''}
                onClick={() => setVendorTab('REJECTED')}
              >
                Rejected Applications ({vendorsList.filter((v) => v.status === 'REJECTED').length})
              </button>
              <button
                type="button"
                className={vendorTab === 'SUSPENDED' ? 'active' : ''}
                onClick={() => setVendorTab('SUSPENDED')}
              >
                Suspended ({vendorsList.filter((v) => v.status === 'SUSPENDED').length})
              </button>
            </div>

            <article className="table-card">
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Shop & Owner</th>
                      <th>GSTIN & Type</th>
                      <th>Location</th>
                      <th>Documents</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorsList
                      .filter((v) => v.status === vendorTab)
                      .map((vendor) => (
                        <tr key={vendor.id}>
                          <td>
                            <b>{vendor.shopName}</b>
                            <small style={{ display: 'block', color: '#66736a' }}>
                              Owner: {vendor.ownerName} · {vendor.phone}
                            </small>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                              {vendor.gstin}
                            </span>
                            <small style={{ display: 'block', color: '#66736a' }}>
                              {vendor.businessType} (Est. {vendor.establishedSince})
                            </small>
                          </td>
                          <td>
                            {vendor.district}, {vendor.state}
                            <small style={{ display: 'block', color: '#66736a' }}>{vendor.address}</small>
                          </td>
                          <td>
                            <span className="doc-link">
                              <FileText size={14} /> {vendor.documents}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status ${
                                vendor.status === 'APPROVED'
                                  ? 'success'
                                  : vendor.status === 'PENDING'
                                  ? 'processing'
                                  : 'pending'
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-row">
                              {vendor.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    title="Approve Vendor Shop"
                                    onClick={() =>
                                      setModal({
                                        action: 'Approve',
                                        type: 'Vendor',
                                        id: vendor.id,
                                        title: vendor.shopName,
                                      })
                                    }
                                  >
                                    <UserCheck size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Reject Application (Requires Reason)"
                                    onClick={() =>
                                      setModal({
                                        action: 'Reject',
                                        type: 'Vendor',
                                        id: vendor.id,
                                        title: vendor.shopName,
                                      })
                                    }
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                              {vendor.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  title="Suspend Vendor Shop"
                                  onClick={() =>
                                    setModal({
                                      action: 'Suspend',
                                      type: 'Vendor',
                                      id: vendor.id,
                                      title: vendor.shopName,
                                    })
                                  }
                                >
                                  <ShieldAlert size={16} style={{ color: '#b91c1c' }} />
                                </button>
                              )}
                              {vendor.status === 'SUSPENDED' && (
                                <button
                                  type="button"
                                  title="Reactivate Vendor Shop"
                                  onClick={() =>
                                    setModal({
                                      action: 'Reactivate',
                                      type: 'Vendor',
                                      id: vendor.id,
                                      title: vendor.shopName,
                                    })
                                  }
                                >
                                  <CheckCircle2 size={16} style={{ color: '#2e7d32' }} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 4: PRODUCT MODERATION & APPROVALS (ADMIN ONLY) */}
        {/* ============================================================= */}
        {isAdmin && (active === 'Product Approvals' || active === 'Products') && (
          <div className="dash-content">
            <div className="dash-welcome">
              <div>
                <p>PRODUCT MODERATION WORKFLOW</p>
                <h1>Agricultural Product Moderation</h1>
                <span>
                  All products submitted by vendors require Super Admin approval before marketplace release.
                </span>
              </div>
            </div>

            {/* Subtabs */}
            <div className="feed-filters" style={{ margin: '16px 0 24px' }}>
              <button
                type="button"
                className={productTab === 'PENDING' ? 'active' : ''}
                onClick={() => setProductTab('PENDING')}
              >
                Pending Approval ({productsList.filter((p) => p.status === 'PENDING').length})
              </button>
              <button
                type="button"
                className={productTab === 'APPROVED' ? 'active' : ''}
                onClick={() => setProductTab('APPROVED')}
              >
                Approved Catalog ({productsList.filter((p) => p.status === 'APPROVED').length})
              </button>
              <button
                type="button"
                className={productTab === 'REJECTED' ? 'active' : ''}
                onClick={() => setProductTab('REJECTED')}
              >
                Rejected Listings ({productsList.filter((p) => p.status === 'REJECTED').length})
              </button>
            </div>

            <article className="table-card">
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Submitted By</th>
                      <th>Pricing</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsList
                      .filter((p) => p.status === productTab)
                      .map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="table-product">
                              <img src={p.image} alt={p.name} />
                              <div>
                                <b>{p.name}</b>
                                <small>SKU: AGRI-{p.id}00</small>
                              </div>
                            </div>
                          </td>
                          <td>{p.category}</td>
                          <td>
                            <b>{p.seller}</b>
                          </td>
                          <td>
                            <b>₹{p.price}</b> <del style={{ color: '#66736a' }}>₹{p.mrp}</del>
                          </td>
                          <td>
                            <span
                              className={`status ${
                                p.status === 'APPROVED'
                                  ? 'success'
                                  : p.status === 'PENDING'
                                  ? 'processing'
                                  : 'pending'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-row">
                              {p.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    title="Approve for Marketplace"
                                    onClick={() =>
                                      setModal({
                                        action: 'Approve',
                                        type: 'Product',
                                        id: String(p.id),
                                        title: p.name,
                                      })
                                    }
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Reject Product (Requires Reason)"
                                    onClick={() =>
                                      setModal({
                                        action: 'Reject',
                                        type: 'Product',
                                        id: String(p.id),
                                        title: p.name,
                                      })
                                    }
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                              {p.status === 'REJECTED' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(`Rejection reason: ${p.rejectionReason || 'Uncertified product'}`)
                                  }
                                >
                                  <Eye size={15} />
                                </button>
                              )}
                              {p.status === 'APPROVED' && (
                                <span style={{ color: '#2e7d32', fontSize: '12px', fontWeight: 700 }}>
                                  Live in Market ✓
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 5: AUDIT LOGS (ADMIN ONLY) */}
        {/* ============================================================= */}
        {isAdmin && active === 'Audit Logs' && (
          <div className="dash-content">
            <div className="dash-welcome">
              <div>
                <p>SECURITY & COMPLIANCE</p>
                <h1>Administrative Audit Trail</h1>
                <span>Immutable record of all verification approvals, rejections, and suspensions.</span>
              </div>
            </div>

            <article className="table-card">
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Target Entity</th>
                      <th>Admin Performer</th>
                      <th>Mandatory Remarks / Reason</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span
                            className={`status ${
                              log.action.includes('APPROVED')
                                ? 'success'
                                : log.action.includes('REJECTED')
                                ? 'pending'
                                : 'processing'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <b>{log.target}</b>
                        </td>
                        <td>{log.adminName}</td>
                        <td>{log.remarks}</td>
                        <td>{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 6: ADD PRODUCT & PRODUCTS (VENDOR WORKSPACE) */}
        {/* ============================================================= */}
        {!isAdmin && active === 'Add Product' && (
          <AddProductSection
            onCancel={() => setActive('Products')}
            onSuccess={() => {
              setProductsRefreshKey((prev) => prev + 1);
            }}
          />
        )}

        {!isAdmin && active === 'Products' && (
          <VendorProductsPanel
            isApproved={vendorStatus === 'APPROVED'}
            vendorStatus={vendorStatus}
            refreshKey={productsRefreshKey}
            onAddProduct={() => setActive('Add Product')}
          />
        )}

        {/* ============================================================= */}
        {/* VIEW 7: MESSAGES */}
        {/* ============================================================= */}
        {active === 'Messages' && <MessagingCenter isAdmin={isAdmin} />}

        {/* ============================================================= */}
        {/* VIEW 8: OTHER DATA SCREENS */}
        {/* ============================================================= */}
        {active !== 'Overview' &&
          active !== 'Farmers' &&
          active !== 'Shop Verification' &&
          active !== 'Shop Owners' &&
          active !== 'Shops' &&
          active !== 'Products' &&
          active !== 'Product Approvals' &&
          active !== 'Audit Logs' &&
          active !== 'Add Product' &&
          active !== 'Messages' && (
            <div className="dash-content">
              <div className="dash-welcome">
                <div>
                  <p>{isAdmin ? 'MARKETPLACE CONTROL' : 'STORE MANAGEMENT'}</p>
                  <h1>{active}</h1>
                  <span>Manage and review your agricultural marketplace operations.</span>
                </div>
              </div>
              <article className="table-card">
                <div style={{ padding: '36px', textAlign: 'center', color: '#66736a' }}>
                  No pending records in {active}. System status is optimal.
                </div>
              </article>
            </div>
          )}
      </main>

      {/* ============================================================= */}
      {/* CONFIRMATION / REJECTION MODAL */}
      {/* ============================================================= */}
      {modal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setModal(null);
                setModalRemarks('');
              }}
            >
              <X size={18} />
            </button>

            <span className="modal-icon">
              {modal.action === 'Reject' ? (
                <ShieldAlert size={28} style={{ color: '#b91c1c' }} />
              ) : (
                <ShieldCheck size={28} style={{ color: '#2e7d32' }} />
              )}
            </span>

            <h2>
              {modal.action} {modal.type}: {modal.title}?
            </h2>

            <p style={{ fontSize: '13px', color: '#66736a', margin: '8px 0 16px' }}>
              {modal.action === 'Reject'
                ? 'Please provide a mandatory rejection reason. The user will be notified and given the option to correct their information and resubmit.'
                : `Are you sure you want to mark ${modal.title} as ${modal.action}ed? This will take effect immediately.`}
            </p>

            <label style={{ display: 'block', textAlign: 'left', margin: '14px 0' }}>
              {modal.action === 'Reject' ? 'Rejection Reason (Mandatory) *' : 'Admin Audit Remarks (Optional)'}
              <textarea
                rows={3}
                style={{ width: '100%', marginTop: '4px' }}
                placeholder={
                  modal.action === 'Reject'
                    ? 'State clear reason for rejection (e.g. invalid GSTIN, land title clarification needed)...'
                    : 'Add audit remarks...'
                }
                value={modalRemarks}
                onChange={(e) => setModalRemarks(e.target.value)}
                required={modal.action === 'Reject'}
              />
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="outline-btn"
                onClick={() => {
                  setModal(null);
                  setModalRemarks('');
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary"
                style={{
                  background: modal.action === 'Reject' ? '#b91c1c' : '#2e7d32',
                  borderColor: modal.action === 'Reject' ? '#b91c1c' : '#2e7d32',
                }}
                disabled={modal.action === 'Reject' && !modalRemarks.trim()}
                onClick={handleConfirmAction}
              >
                Confirm {modal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;
