'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Store,
  User,
  X,
} from 'lucide-react';
import { AccountShell, resolveMediaUrl } from '@/components/account/AccountShell';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLanguage, tx } from '@/context/LanguageContext';
import { ApiClient } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, refreshUser } = useAuth();
  const { wishlist } = useWishlist();
  const { language, setLanguage } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Personal details editing state
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: '',
    phone: '',
    preferredLanguage: 'en' as 'en' | 'hi',
  });

  // Role details editing state (Farmer / Vendor)
  const [editingRole, setEditingRole] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [farmerForm, setFarmerForm] = useState({
    farmSize: '1',
    farmSizeUnit: 'acres',
    village: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
  });
  const [vendorForm, setVendorForm] = useState({
    businessName: '',
    businessType: 'Retailer',
    description: '',
    businessAddress: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    gstin: '',
    licenseNumber: '',
  });

  // Security / password change state
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwNotice, setPwNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const hydrateForms = useCallback((p: any) => {
    if (!p) return;
    setPersonalForm({
      fullName: p.fullName || '',
      phone: p.phone || '',
      preferredLanguage: p.preferredLanguage === 'hi' ? 'hi' : 'en',
    });
    if (p.farmerProfile) {
      setFarmerForm({
        farmSize: String(p.farmerProfile.farmSize || '1'),
        farmSizeUnit: p.farmerProfile.farmSizeUnit || 'acres',
        village: p.farmerProfile.village || '',
        city: p.farmerProfile.city || '',
        district: p.farmerProfile.district || '',
        state: p.farmerProfile.state || '',
        pincode: p.farmerProfile.pincode || '',
      });
    }
    if (p.vendorProfile) {
      setVendorForm({
        businessName: p.vendorProfile.businessName || '',
        businessType: p.vendorProfile.businessType || 'Retailer',
        description: p.vendorProfile.description || '',
        businessAddress: p.vendorProfile.businessAddress || '',
        city: p.vendorProfile.city || '',
        district: p.vendorProfile.district || '',
        state: p.vendorProfile.state || '',
        pincode: p.vendorProfile.pincode || '',
        gstin: p.vendorProfile.gstin || '',
        licenseNumber: p.vendorProfile.licenseNumber || '',
      });
    }
  }, []);

  const loadDbProfile = useCallback(async () => {
    if (!token) return;
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await ApiClient.get('/users/profile');
      if (res.success && res.data) {
        setProfile(res.data);
        hydrateForms(res.data);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.sessionExpired) {
        router.push('/login?expired=1');
        return;
      }
      setProfileError(err.message || 'Could not refresh profile from database.');
      if (user) {
        setProfile(user);
        hydrateForms(user);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [token, user, hydrateForms]);

  useEffect(() => {
    if (token) {
      loadDbProfile();
    } else if (user) {
      setProfile(user);
      hydrateForms(user);
    }
  }, [token]);

  const activeUser = profile || user;

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    setNotice(null);
    try {
      const res = await ApiClient.patch('/users/profile', {
        fullName: personalForm.fullName,
        phone: personalForm.phone,
        preferredLanguage: personalForm.preferredLanguage,
      });
      if (res.success && res.data) {
        setProfile(res.data);
        hydrateForms(res.data);
        setLanguage(personalForm.preferredLanguage);
        await refreshUser();
        setEditingPersonal(false);
        setNotice({ type: 'success', text: 'Your personal details have been saved to the database.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to update personal details.' });
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingAvatar(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadJson = await ApiClient.post('/upload/file', fd);
      if (!uploadJson?.success) {
        throw new Error(uploadJson?.message || 'Image upload failed');
      }
      const patchRes = await ApiClient.patch('/users/profile', {
        avatarUrl: uploadJson.data.url,
      });
      if (patchRes.success && patchRes.data) {
        setProfile(patchRes.data);
        await refreshUser();
        setNotice({ type: 'success', text: 'Profile photo updated.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to upload profile photo.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveRoleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setSavingRole(true);
    setNotice(null);
    try {
      const payload =
        activeUser.role === 'FARMER'
          ? {
              farmerProfile: {
                farmSize: Number(farmerForm.farmSize),
                farmSizeUnit: farmerForm.farmSizeUnit,
                village: farmerForm.village || null,
                city: farmerForm.city || null,
                district: farmerForm.district,
                state: farmerForm.state,
                pincode: farmerForm.pincode || null,
              },
            }
          : {
              vendorProfile: {
                businessName: vendorForm.businessName,
                businessType: vendorForm.businessType,
                description: vendorForm.description || null,
                businessAddress: vendorForm.businessAddress,
                city: vendorForm.city,
                district: vendorForm.district || null,
                state: vendorForm.state,
                pincode: vendorForm.pincode,
                gstin: vendorForm.gstin || null,
                licenseNumber: vendorForm.licenseNumber || null,
              },
            };

      const res = await ApiClient.patch('/users/profile', payload);
      if (res.success && res.data) {
        setProfile(res.data);
        hydrateForms(res.data);
        await refreshUser();
        setEditingRole(false);
        setNotice({
          type: 'success',
          text:
            activeUser.role === 'FARMER'
              ? 'Farm profile updated in PostgreSQL.'
              : 'Shop & business profile updated in PostgreSQL.',
        });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Failed to save role details.' });
    } finally {
      setSavingRole(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwNotice(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwNotice({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setSavingPw(true);
    try {
      const res = await ApiClient.post('/users/change-password', pwForm);
      if (res.success) {
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPwNotice({ type: 'success', text: res.message || 'Password updated successfully.' });
      }
    } catch (err: any) {
      setPwNotice({ type: 'error', text: err.message || 'Could not update password.' });
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const statusBadgeClass = (s?: string) => {
    if (!s) return 'slate';
    if (s === 'APPROVED' || s === 'ACTIVE') return 'green';
    if (s === 'PENDING' || s === 'PENDING_VERIFICATION' || s === 'MORE_INFORMATION_REQUIRED') return 'amber';
    return 'red';
  };

  const counts = activeUser?._count || {};

  return (
    <AccountShell sectionTitle="My Profile & Role" sectionTitleHi="मेरी प्रोफ़ाइल और भूमिका">
      {notice && (
        <div className={`account-alert ${notice.type}`}>
          {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notice.text}</span>
        </div>
      )}

      {profileError && (
        <div className="account-alert error">
          <AlertTriangle size={16} />
          <span>{profileError}</span>
        </div>
      )}

      {/* Database Activity Summary Strip */}
      <div className="account-stats-grid">
        <button type="button" className="account-stat-card" onClick={() => router.push('/account/orders')}>
          <div className="account-stat-icon">
            <Package size={20} />
          </div>
          <div>
            <b>{counts.orders ?? 0}</b>
            <span>{tx(language, 'Total Orders', 'कुल ऑर्डर')}</span>
          </div>
        </button>

        <button type="button" className="account-stat-card" onClick={() => router.push('/account/wishlist')}>
          <div className="account-stat-icon" style={{ background: '#fff1f2', color: '#e11d48' }}>
            <Heart size={20} />
          </div>
          <div>
            <b>{wishlist.length}</b>
            <span>{tx(language, 'Wishlist Items', 'पसंदीदा उत्पाद')}</span>
          </div>
        </button>

        <button type="button" className="account-stat-card" onClick={() => router.push('/account/addresses')}>
          <div className="account-stat-icon">
            <MapPin size={20} />
          </div>
          <div>
            <b>{counts.addresses ?? activeUser?.addresses?.length ?? 0}</b>
            <span>{tx(language, 'Saved Addresses', 'सहेजे गए पते')}</span>
          </div>
        </button>

        <button type="button" className="account-stat-card" onClick={() => router.push('/soil-testing')}>
          <div className="account-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FlaskConical size={20} />
          </div>
          <div>
            <b>{counts.soilTestReports ?? 0}</b>
            <span>{tx(language, 'Soil Reports', 'मिट्टी रिपोर्ट')}</span>
          </div>
        </button>
      </div>

      {/* Card 1: Personal Details */}
      <div className="account-card">
        <div className="account-card-head">
          <div className="account-card-head-title">
            <div className="account-card-icon">
              <User size={19} />
            </div>
            <div>
              <h1>{tx(language, 'Personal Details & Identity', 'व्यक्तिगत विवरण और पहचान')}</h1>
              <p>{tx(language, 'Synced directly with your KrishiConnect database account.', 'आपके कृषि कनेक्ट डेटाबेस खाते से सीधे जुड़ा हुआ।')}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="outline-btn small"
              onClick={loadDbProfile}
              disabled={loadingProfile}
              style={{ height: '34px', padding: '0 12px', fontSize: '12px' }}
            >
              <RefreshCw size={13} /> {loadingProfile ? 'Syncing...' : 'Refresh'}
            </button>
            <button
              type="button"
              className={editingPersonal ? 'outline-btn small' : 'primary small'}
              onClick={() => setEditingPersonal(!editingPersonal)}
              style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}
            >
              {editingPersonal ? (
                <>
                  <X size={14} /> Cancel
                </>
              ) : (
                <>
                  <Edit3 size={14} /> Edit Details
                </>
              )}
            </button>
          </div>
        </div>

        {!editingPersonal ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '18px', padding: '14px', background: '#f8faf7', borderRadius: '12px', border: '1px solid #e7eee7' }}>
              <div className="account-avatar" style={{ background: 'var(--dark)', borderColor: 'var(--border)' }}>
                {resolveMediaUrl(activeUser?.avatarUrl) ? (
                  <img src={resolveMediaUrl(activeUser?.avatarUrl)!} alt={activeUser?.fullName} />
                ) : (
                  (activeUser?.fullName || 'K').slice(0, 2).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: '16px' }}>{activeUser?.fullName}</b>
                  <span className={`account-badge ${statusBadgeClass(activeUser?.status || 'ACTIVE')}`}>
                    {activeUser?.status || 'ACTIVE'}
                  </span>
                  {activeUser?.isVerified ? (
                    <span className="account-badge green">
                      <BadgeCheck size={12} /> Verified Contact
                    </span>
                  ) : (
                    <Link href="/verify" className="account-badge amber" style={{ textDecoration: 'none' }}>
                      Confirm Email
                    </Link>
                  )}
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px' }}>
                  Member ID: <code>{activeUser?.id}</code>
                  {activeUser?.createdAt && ` · Joined ${new Date(activeUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Camera size={14} />
                <span>{uploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingAvatar}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div className="account-detail-grid">
              <div className="account-detail-item">
                <small>Full Name</small>
                <b>{activeUser?.fullName}</b>
              </div>
              <div className="account-detail-item">
                <small>Registered Email</small>
                <b>{activeUser?.email}</b>
              </div>
              <div className="account-detail-item">
                <small>Mobile Number</small>
                <b>{activeUser?.phone ? `+91 ${activeUser.phone}` : 'Not provided'}</b>
              </div>
              <div className="account-detail-item">
                <small>Preferred Language</small>
                <b>{activeUser?.preferredLanguage === 'hi' ? 'हिंदी (Hindi)' : 'English'}</b>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSavePersonal}>
            <div className="account-form-grid">
              <label>
                Full Name
                <input
                  value={personalForm.fullName}
                  onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                  required
                />
              </label>
              <label>
                Registered Email (Fixed)
                <input value={activeUser?.email || ''} disabled style={{ background: '#f3f6f3', color: 'var(--muted)' }} />
              </label>
              <label>
                10-Digit Mobile Number
                <input
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  pattern="[6-9][0-9]{9}"
                  title="Enter a valid 10-digit Indian mobile number"
                  required
                />
              </label>
              <label>
                Preferred Language
                <select
                  value={personalForm.preferredLanguage}
                  onChange={(e) => setPersonalForm({ ...personalForm, preferredLanguage: e.target.value as 'en' | 'hi' })}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="outline-btn" onClick={() => setEditingPersonal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={savingPersonal}>
                <Save size={15} /> {savingPersonal ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Card 2: Role & Account Verification Details */}
      <div className="account-card">
        <div className="account-card-head">
          <div className="account-card-head-title">
            <div className="account-card-icon">
              {activeUser?.role === 'ADMIN' ? (
                <ShieldCheck size={19} />
              ) : activeUser?.role === 'VENDOR' ? (
                <Store size={19} />
              ) : (
                <Sprout size={19} />
              )}
            </div>
            <div>
              <h2>
                {activeUser?.role === 'ADMIN'
                  ? 'Platform Role: Super Administrator'
                  : activeUser?.role === 'VENDOR'
                  ? 'Role: Shop Owner / Agricultural Vendor'
                  : 'Role: Farmer & Agricultural Buyer'}
              </h2>
              <p>
                {activeUser?.role === 'ADMIN'
                  ? 'Full marketplace moderation, vendor KYC compliance, product review, and audit governance.'
                  : activeUser?.role === 'VENDOR'
                  ? 'Manage your verified agri-input shop, inventory catalog, and incoming farm orders.'
                  : 'Manage your land holding details, farm location, saved delivery addresses, and soil test reports.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="account-badge green">ROLE: {activeUser?.role}</span>
            {(activeUser?.role === 'FARMER' || activeUser?.role === 'VENDOR') && (
              <button
                type="button"
                className={editingRole ? 'outline-btn small' : 'outline-btn small'}
                onClick={() => setEditingRole(!editingRole)}
                style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
              >
                {editingRole ? (
                  <>
                    <X size={13} /> Cancel
                  </>
                ) : (
                  <>
                    <Edit3 size={13} /> {activeUser?.role === 'FARMER' ? 'Edit Farm Details' : 'Edit Shop Details'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* FARMER ROLE CONTENT */}
        {activeUser?.role === 'FARMER' && (
          <>
            {!editingRole ? (
              <div className="account-detail-grid">
                <div className="account-detail-item">
                  <small>Account Type</small>
                  <strong>Farmer / Buyer Account</strong>
                </div>
                <div className="account-detail-item">
                  <small>Registered Farm Size</small>
                  <b>
                    {activeUser?.farmerProfile?.farmSize
                      ? `${activeUser.farmerProfile.farmSize} ${activeUser.farmerProfile.farmSizeUnit || 'acres'}`
                      : 'Not set'}
                  </b>
                </div>
                <div className="account-detail-item">
                  <small>Village / Locality & City</small>
                  <b>
                    {[activeUser?.farmerProfile?.village, activeUser?.farmerProfile?.city]
                      .filter(Boolean)
                      .join(', ') || 'Not specified'}
                  </b>
                </div>
                <div className="account-detail-item">
                  <small>District, State & PIN Code</small>
                  <b>
                    {[
                      activeUser?.farmerProfile?.district,
                      activeUser?.farmerProfile?.state,
                      activeUser?.farmerProfile?.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Not specified'}
                  </b>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveRoleDetails}>
                <div className="account-form-grid">
                  <label>
                    Farm Size
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={farmerForm.farmSize}
                      onChange={(e) => setFarmerForm({ ...farmerForm, farmSize: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Unit
                    <select
                      value={farmerForm.farmSizeUnit}
                      onChange={(e) => setFarmerForm({ ...farmerForm, farmSizeUnit: e.target.value })}
                    >
                      <option value="acres">Acres</option>
                      <option value="hectares">Hectares</option>
                      <option value="bigha">Bigha</option>
                    </select>
                  </label>
                  <label>
                    Village / Locality
                    <input
                      value={farmerForm.village}
                      onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
                    />
                  </label>
                  <label>
                    City / Tehsil
                    <input
                      value={farmerForm.city}
                      onChange={(e) => setFarmerForm({ ...farmerForm, city: e.target.value })}
                    />
                  </label>
                  <label>
                    District
                    <input
                      value={farmerForm.district}
                      onChange={(e) => setFarmerForm({ ...farmerForm, district: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    State
                    <input
                      value={farmerForm.state}
                      onChange={(e) => setFarmerForm({ ...farmerForm, state: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    PIN Code
                    <input
                      value={farmerForm.pincode}
                      onChange={(e) => setFarmerForm({ ...farmerForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      maxLength={6}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button type="button" className="outline-btn" onClick={() => setEditingRole(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary" disabled={savingRole}>
                    <Save size={15} /> {savingRole ? 'Saving...' : 'Save Farm Profile'}
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              <Link href="/account/wishlist" className="outline-btn small" style={{ textDecoration: 'none' }}>
                <Heart size={14} /> View Wishlist ({wishlist.length})
              </Link>
              <Link href="/account/orders" className="outline-btn small" style={{ textDecoration: 'none' }}>
                <Package size={14} /> Order History
              </Link>
              <Link href="/soil-testing" className="outline-btn small" style={{ textDecoration: 'none' }}>
                <FlaskConical size={14} /> Soil Testing Lab
              </Link>
            </div>
          </>
        )}

        {/* VENDOR ROLE CONTENT */}
        {activeUser?.role === 'VENDOR' && (
          <>
            {activeUser?.vendorProfile?.status !== 'APPROVED' && (
              <div className="account-alert info">
                <AlertTriangle size={16} />
                <span>
                  Shop status is currently <b>{activeUser?.vendorProfile?.status || 'PENDING'}</b>.{' '}
                  {activeUser?.vendorProfile?.verificationRemarks || 'Super Admin verification unlocks catalog publishing.'}
                </span>
              </div>
            )}

            {!editingRole ? (
              <div className="account-detail-grid">
                <div className="account-detail-item">
                  <small>Shop / Business Name</small>
                  <b>{activeUser?.vendorProfile?.businessName || 'Pending setup'}</b>
                </div>
                <div className="account-detail-item">
                  <small>Verification Status</small>
                  <span className={`account-badge ${statusBadgeClass(activeUser?.vendorProfile?.status)}`}>
                    {activeUser?.vendorProfile?.status || 'PENDING'}
                  </span>
                </div>
                <div className="account-detail-item">
                  <small>Business Type & Store Slug</small>
                  <b>
                    {activeUser?.vendorProfile?.businessType || 'Agri Input Dealer'} · /{activeUser?.vendorProfile?.storeSlug}
                  </b>
                </div>
                <div className="account-detail-item">
                  <small>GSTIN & Agri License</small>
                  <b>
                    {activeUser?.vendorProfile?.gstin || 'No GSTIN'} · {activeUser?.vendorProfile?.licenseNumber || 'No License'}
                  </b>
                </div>
                <div className="account-detail-item" style={{ gridColumn: '1 / -1' }}>
                  <small>Shop Dispatch Address</small>
                  <b>
                    {[
                      activeUser?.vendorProfile?.businessAddress,
                      activeUser?.vendorProfile?.city,
                      activeUser?.vendorProfile?.district,
                      activeUser?.vendorProfile?.state,
                      activeUser?.vendorProfile?.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </b>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveRoleDetails}>
                <div className="account-form-grid">
                  <label>
                    Shop / Business Name
                    <input
                      value={vendorForm.businessName}
                      onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Business Type
                    <select
                      value={vendorForm.businessType}
                      onChange={(e) => setVendorForm({ ...vendorForm, businessType: e.target.value })}
                    >
                      <option value="Retailer">Agri Input Retailer</option>
                      <option value="Wholesaler">Wholesaler / Distributor</option>
                      <option value="Manufacturer">Seed / Fertilizer Manufacturer</option>
                      <option value="Cooperative">FPO / Farmer Cooperative</option>
                    </select>
                  </label>
                  <label className="span-2">
                    Shop Street Address
                    <input
                      value={vendorForm.businessAddress}
                      onChange={(e) => setVendorForm({ ...vendorForm, businessAddress: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    City
                    <input
                      value={vendorForm.city}
                      onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    District
                    <input
                      value={vendorForm.district}
                      onChange={(e) => setVendorForm({ ...vendorForm, district: e.target.value })}
                    />
                  </label>
                  <label>
                    State
                    <input
                      value={vendorForm.state}
                      onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    PIN Code
                    <input
                      value={vendorForm.pincode}
                      onChange={(e) => setVendorForm({ ...vendorForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      maxLength={6}
                      required
                    />
                  </label>
                  <label>
                    GSTIN (Optional)
                    <input
                      value={vendorForm.gstin}
                      onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <label>
                    License Number
                    <input
                      value={vendorForm.licenseNumber}
                      onChange={(e) => setVendorForm({ ...vendorForm, licenseNumber: e.target.value })}
                    />
                  </label>
                  <label className="span-2">
                    About Shop
                    <textarea
                      value={vendorForm.description}
                      onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button type="button" className="outline-btn" onClick={() => setEditingRole(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary" disabled={savingRole}>
                    <Save size={15} /> {savingRole ? 'Saving...' : 'Save Shop Details'}
                  </button>
                </div>
              </form>
            )}

            {activeUser?.vendorProfile?.documents?.length > 0 && (
              <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {activeUser.vendorProfile.documents.map((doc: any) => (
                  <span key={doc.id} className="account-badge slate">
                    <FileText size={12} /> {doc.documentType}: {doc.fileName}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              {activeUser?.vendorProfile?.status === 'APPROVED' ? (
                <>
                  <Link href="/vendor/dashboard" className="primary small" style={{ textDecoration: 'none' }}>
                    <Store size={14} /> Open Vendor Workspace
                  </Link>
                  <Link href="/vendor/verification" className="outline-btn small" style={{ textDecoration: 'none' }}>
                    <BadgeCheck size={14} /> Verification Documents
                  </Link>
                  <Link href="/vendor/products" className="outline-btn small" style={{ textDecoration: 'none' }}>
                    Manage Inventory
                  </Link>
                </>
              ) : (
                <Link href="/vendor/verification" className="primary small" style={{ textDecoration: 'none' }}>
                  <BadgeCheck size={14} /> Check Verification Status
                </Link>
              )}
            </div>
          </>
        )}

        {/* ADMIN ROLE CONTENT */}
        {activeUser?.role === 'ADMIN' && (
          <>
            <div className="account-detail-grid">
              <div className="account-detail-item">
                <small>Access Privilege Level</small>
                <b>Super Administrator (Full Platform Scope)</b>
              </div>
              <div className="account-detail-item">
                <small>Governance Scope</small>
                <b>Vendor KYC, Catalog Approvals, Orders, Audit Logs</b>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              <Link href="/admin/dashboard" className="primary small" style={{ textDecoration: 'none' }}>
                <ShieldCheck size={14} /> Open Admin Console
              </Link>
              <Link href="/admin/vendors" className="outline-btn small" style={{ textDecoration: 'none' }}>
                Review Vendor KYC
              </Link>
              <Link href="/admin/products" className="outline-btn small" style={{ textDecoration: 'none' }}>
                Product Approvals
              </Link>
              <Link href="/admin/audit-logs" className="outline-btn small" style={{ textDecoration: 'none' }}>
                Audit Logs
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Card 3: Security, Change Password & Logout */}
      <div className="account-card">
        <div className="account-card-head">
          <div className="account-card-head-title">
            <div className="account-card-icon">
              <KeyRound size={19} />
            </div>
            <div>
              <h2>{tx(language, 'Security & Session', 'सुरक्षा और सत्र प्रबंधन')}</h2>
              <p>{tx(language, 'Update your password or sign out cleanly from this device.', 'अपना पासवर्ड अपडेट करें या इस डिवाइस से साइन आउट करें।')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              height: '36px',
              padding: '0 14px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '12px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={14} /> {tx(language, 'Logout Account', 'खाते से लॉग आउट करें')}
          </button>
        </div>

        {pwNotice && (
          <div className={`account-alert ${pwNotice.type}`}>
            {pwNotice.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            <span>{pwNotice.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="account-form-grid">
            <label>
              Current Password
              <div className="auth-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            <label>
              New Password (min 6 characters)
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                placeholder="New password"
                minLength={6}
                required
              />
            </label>
            <label>
              Confirm New Password
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                minLength={6}
                required
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="outline-btn" disabled={savingPw} style={{ height: '42px', width: '100%', justifyContent: 'center' }}>
                {savingPw ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AccountShell>
  );
}

