'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { AccountShell } from '@/components/account/AccountShell';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, tx } from '@/context/LanguageContext';

export default function CustomerAddressesPage() {
  const { token, refreshUser } = useAuth();
  const { language } = useLanguage();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    street: '',
    villageOrLocality: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    isDefault: false,
    addressType: 'FARM',
  });

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.get('/users/addresses');
      if (res.success && Array.isArray(res.data)) {
        setAddresses(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await ApiClient.post('/users/addresses', form);
      if (res.success) {
        setShowModal(false);
        setForm({
          name: '',
          phone: '',
          street: '',
          villageOrLocality: '',
          city: '',
          district: '',
          state: '',
          pincode: '',
          isDefault: false,
          addressType: 'FARM',
        });
        await fetchAddresses();
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await ApiClient.patch(`/users/addresses/${id}/default`);
      await fetchAddresses();
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update default address.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await ApiClient.delete(`/users/addresses/${id}`);
      await fetchAddresses();
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to delete address.');
    }
  };

  return (
    <AccountShell sectionTitle="Delivery Addresses" sectionTitleHi="डिलीवरी पते">
      <div className="account-card">
        <div className="account-card-head">
          <div className="account-card-head-title">
            <div className="account-card-icon">
              <MapPin size={19} />
            </div>
            <div>
              <h1>
                {tx(language, 'Saved Delivery Addresses', 'सहेजे गए डिलीवरी पते')} ({addresses.length})
              </h1>
              <p>
                {tx(
                  language,
                  'Manage farm, home, and warehouse dispatch locations from the database.',
                  'डेटाबेस में सहेजे गए खेत, घर और गोदाम के डिलीवरी पते प्रबंधित करें।'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="primary small"
            onClick={() => setShowModal(true)}
            style={{ height: '36px', padding: '0 14px', fontSize: '12px' }}
          >
            <Plus size={15} /> Add Address
          </button>
        </div>

        {error && (
          <div className="account-alert error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading && addresses.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
            Loading saved addresses from database...
          </div>
        ) : addresses.length === 0 ? (
          <div className="account-empty">
            <MapPin size={40} />
            <h3>{tx(language, 'No saved addresses yet', 'अभी तक कोई पता सहेजा नहीं गया')}</h3>
            <p>Save your farm or home delivery location for faster KrishiConnect checkout.</p>
            <button type="button" className="primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add New Address
            </button>
          </div>
        ) : (
          <div className="account-detail-grid">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="account-detail-item"
                style={{
                  background: '#fff',
                  borderColor: addr.isDefault ? 'var(--green)' : 'var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <b style={{ fontSize: '14px' }}>{addr.name}</b>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      {addr.isDefault && (
                        <span className="account-badge green" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          <CheckCircle2 size={11} /> Default
                        </span>
                      )}
                      <span className="account-badge slate" style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {addr.addressType}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.55 }}>
                    {addr.street}
                    {addr.villageOrLocality ? `, ${addr.villageOrLocality}` : ''}, {addr.city},{' '}
                    {addr.district}, {addr.state} - <b>{addr.pincode}</b>
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '6px', fontWeight: 600 }}>
                    Mobile: +91 {addr.phone}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #eef2ee' }}>
                  {!addr.isDefault ? (
                    <button
                      type="button"
                      className="outline-btn small"
                      onClick={() => handleSetDefault(addr.id)}
                      style={{ height: '30px', padding: '0 10px', fontSize: '11px' }}
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>
                      Primary Checkout Address
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    style={{
                      color: '#b91c1c',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Add New Delivery Address</h3>
              <button type="button" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="account-form-grid">
                <label>
                  Recipient Name
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ramesh Patel (Farm)"
                  />
                </label>
                <label>
                  10-Digit Mobile
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    pattern="[6-9][0-9]{9}"
                    placeholder="9898011223"
                  />
                </label>
                <label className="span-2">
                  Plot / Street / Landmark
                  <input
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Farm Plot 14, Near Canal Road"
                  />
                </label>
                <label>
                  Village / Locality
                  <input
                    value={form.villageOrLocality}
                    onChange={(e) => setForm({ ...form, villageOrLocality: e.target.value })}
                  />
                </label>
                <label>
                  City / Tehsil
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </label>
                <label>
                  District
                  <input
                    required
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  />
                </label>
                <label>
                  State
                  <input
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </label>
                <label>
                  PIN Code
                  <input
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  />
                </label>
                <label>
                  Address Type
                  <select
                    value={form.addressType}
                    onChange={(e) => setForm({ ...form, addressType: e.target.value })}
                  >
                    <option value="FARM">FARM</option>
                    <option value="HOME">HOME</option>
                    <option value="WAREHOUSE">WAREHOUSE</option>
                  </select>
                </label>
              </div>

              <label className="auth-checkbox-row" style={{ marginTop: '12px' }}>
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                <span>Make this my default delivery address</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" className="outline-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AccountShell>
  );
}
