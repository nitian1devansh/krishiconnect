'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Leaf,
  Loader2,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, tx } from '@/context/LanguageContext';
import { ApiClient } from '@/lib/api';
import { handleProductImageError, resolveProductImage } from '@/lib/media';

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface VariantDraft {
  title: string;
  sku: string;
  mrp: string;
  price: string;
  stock: string;
  weightKg: string;
}

export interface AddProductSectionProps {
  onSuccess?: (product: unknown) => void;
  onCancel?: () => void;
  cancelHref?: string;
}

const SAMPLE_AGRI_IMAGES = [
  {
    label: 'Crop Nutrition',
    url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Seeds & Grain',
    url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Organic Spray',
    url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&auto=format&fit=crop&q=80',
  },
];

const QUICK_CROP_PRESETS = ['Wheat', 'Paddy', 'Cotton', 'Soybean', 'Vegetables', 'Pulses'];

function createDefaultSku(seedTitle: string, index: number): string {
  const clean = (seedTitle || 'AGRI')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 8);
  const rand = Math.floor(100 + Math.random() * 900);
  return `KC-${clean || 'ITEM'}-${index + 1}${rand}`;
}

export function AddProductSection({
  onSuccess,
  onCancel,
  cancelHref = '/vendor/products',
}: AddProductSectionProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [suitableCrops, setSuitableCrops] = useState('Wheat, Paddy, Vegetables');
  const [activeIngredients, setActiveIngredients] = useState('');
  const [dosageInstructions, setDosageInstructions] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [cibRegistrationNo, setCibRegistrationNo] = useState('');
  const [organicCertified, setOrganicCertified] = useState(false);

  const [primaryImageUrl, setPrimaryImageUrl] = useState(SAMPLE_AGRI_IMAGES[0].url);
  const [extraImageInput, setExtraImageInput] = useState('');
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [variants, setVariants] = useState<VariantDraft[]>([
    {
      title: '1 Kg Pack',
      sku: 'KC-AGRI-101',
      mrp: '699',
      price: '549',
      stock: '50',
      weightKg: '1',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdSummary, setCreatedSummary] = useState<{
    title: string;
    sku: string;
    stock: number;
    price: number;
    variantTitle: string;
    image: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingCats(true);
    ApiClient.get<CategoryOption[]>('/catalog/categories')
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : [];
        setCategories(list);
        if (list.length > 0) {
          setCategoryId((prev) => prev || list[0].id);
        }
      })
      .catch(() => {
        if (active) setCategories([]);
      })
      .finally(() => {
        if (active) setLoadingCats(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const allImages = useMemo(() => {
    const merged = [primaryImageUrl.trim(), ...extraImages.map((u) => u.trim())].filter(Boolean);
    return Array.from(new Set(merged));
  }, [primaryImageUrl, extraImages]);

  const selectedCategoryName = useMemo(() => {
    return categories.find((c) => c.id === categoryId)?.name || 'Agri Inputs';
  }, [categories, categoryId]);

  const shopName = user?.vendorProfile?.businessName || 'Your Verified Agri Shop';

  const primaryVariant = variants[0];
  const previewPrice = Number(primaryVariant?.price) || 0;
  const previewMrp = Number(primaryVariant?.mrp) || previewPrice;
  const previewStock = Number.parseInt(primaryVariant?.stock || '0', 10) || 0;
  const discountPct =
    previewMrp > previewPrice && previewMrp > 0
      ? Math.round(((previewMrp - previewPrice) / previewMrp) * 100)
      : 0;
  const qualifiesFreeDelivery = previewPrice >= 999;

  const updateVariant = (idx: number, field: keyof VariantDraft, value: string) => {
    setVariants((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        title: `Pack ${prev.length + 1}`,
        sku: createDefaultSku(title || 'AGRI', prev.length),
        mrp: prev[0]?.mrp || '699',
        price: prev[0]?.price || '549',
        stock: prev[0]?.stock || '25',
        weightKg: prev[0]?.weightKg || '1',
      },
    ]);
  };

  const removeVariantRow = (idx: number) => {
    setVariants((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await ApiClient.post<{ url: string }>('/upload/file', formData);
      const uploadedUrl = res?.url;
      if (!uploadedUrl) {
        throw new Error('Upload succeeded but no file URL was returned');
      }
      if (!primaryImageUrl.trim()) {
        setPrimaryImageUrl(uploadedUrl);
      } else {
        setExtraImages((prev) => {
          const next = [primaryImageUrl.trim(), ...prev].filter(Boolean);
          return next.includes(uploadedUrl) ? prev : [...prev, primaryImageUrl.trim()];
        });
        setPrimaryImageUrl(uploadedUrl);
      }
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : 'Unable to upload image. Check file size/type.'
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddExtraUrl = () => {
    const candidate = extraImageInput.trim();
    if (!candidate) return;
    if (!primaryImageUrl.trim()) {
      setPrimaryImageUrl(candidate);
    } else if (candidate !== primaryImageUrl.trim() && !extraImages.includes(candidate)) {
      setExtraImages((prev) => [...prev, candidate]);
    }
    setExtraImageInput('');
  };

  const handleRemoveImage = (urlToRemove: string) => {
    if (urlToRemove === primaryImageUrl.trim()) {
      const [nextPrimary, ...rest] = extraImages;
      setPrimaryImageUrl(nextPrimary || '');
      setExtraImages(rest);
    } else {
      setExtraImages((prev) => prev.filter((item) => item !== urlToRemove));
    }
  };

  const toggleCropPreset = (crop: string) => {
    const current = suitableCrops
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (current.some((c) => c.toLowerCase() === crop.toLowerCase())) {
      setSuitableCrops(
        current.filter((c) => c.toLowerCase() !== crop.toLowerCase()).join(', ')
      );
    } else {
      setSuitableCrops([...current, crop].join(', '));
    }
  };

  const resetForAnother = () => {
    setTitle('');
    setTitleHi('');
    setBrandName('');
    setDescription('');
    setActiveIngredients('');
    setDosageInstructions('');
    setBatchNumber('');
    setExpiryDate('');
    setHsnCode('');
    setCibRegistrationNo('');
    setOrganicCertified(false);
    setVariants([
      {
        title: '1 Kg Pack',
        sku: createDefaultSku('AGRI', 0),
        mrp: '699',
        price: '549',
        stock: '50',
        weightKg: '1',
      },
    ]);
    setCreatedSummary(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (cleanTitle.length < 3) {
      setError('Product title must be at least 3 characters.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }
    if (cleanDescription.length < 10) {
      setError('Product description must be at least 10 characters.');
      return;
    }
    if (allImages.length === 0) {
      setError('Please upload at least one product image or enter a valid image URL.');
      return;
    }

    const validImagePattern = /^(https?:\/\/.+|\/uploads\/.+|\/images\/.+)$/i;
    const invalidImage = allImages.find((u) => !validImagePattern.test(u));
    if (invalidImage) {
      setError(
        `Invalid image path "${invalidImage}". Upload a photo or use an http(s):// or /uploads/ URL.`
      );
      return;
    }

    const parsedVariants = [];
    for (let i = 0; i < variants.length; i += 1) {
      const v = variants[i];
      const vTitle = v.title.trim();
      const vSku = v.sku.trim();
      const vPrice = Number(v.price);
      const vMrp = Number(v.mrp);
      const vStock = Number(v.stock);
      const vWeight = v.weightKg.trim() ? Number(v.weightKg) : undefined;

      if (!vTitle) {
        setError(`Variant #${i + 1}: Pack / Variant Title is required.`);
        return;
      }
      if (vSku.length < 2) {
        setError(`Variant #${i + 1}: SKU code must be at least 2 characters.`);
        return;
      }
      if (!Number.isFinite(vPrice) || vPrice <= 0) {
        setError(`Variant #${i + 1}: Selling price must be greater than ₹0.`);
        return;
      }
      if (!Number.isFinite(vMrp) || vMrp < vPrice) {
        setError(`Variant #${i + 1}: MRP must be greater than or equal to Selling Price.`);
        return;
      }
      if (!Number.isInteger(vStock) || vStock < 0) {
        setError(`Variant #${i + 1}: Stock quantity must be a whole number (0 or more).`);
        return;
      }
      if (vWeight !== undefined && (!Number.isFinite(vWeight) || vWeight <= 0)) {
        setError(`Variant #${i + 1}: Weight (Kg) must be a positive number.`);
        return;
      }

      parsedVariants.push({
        title: vTitle,
        sku: vSku,
        price: vPrice,
        mrp: vMrp,
        stock: vStock,
        weightKg: vWeight,
      });
    }

    setSubmitting(true);
    try {
      const payload = {
        title: cleanTitle,
        titleHi: titleHi.trim() || undefined,
        description: cleanDescription,
        categoryId,
        brandName: brandName.trim() || undefined,
        images: allImages,
        suitableCrops: suitableCrops
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        activeIngredients: activeIngredients.trim() || undefined,
        dosageInstructions: dosageInstructions.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        hsnCode: hsnCode.trim() || undefined,
        cibRegistrationNo: cibRegistrationNo.trim() || undefined,
        organicCertified,
        variants: parsedVariants,
      };

      const created = await ApiClient.post<unknown>('/vendor/products', payload);
      setCreatedSummary({
        title: cleanTitle,
        sku: parsedVariants[0].sku,
        stock: parsedVariants.reduce((sum, item) => sum + item.stock, 0),
        price: parsedVariants[0].price,
        variantTitle: parsedVariants[0].title,
        image: allImages[0],
      });
      onSuccess?.(created);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit agricultural product. Please verify fields and retry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-content">
      <div className="dash-welcome">
        <div>
          <p>{tx(language, 'CATALOG SUBMISSION', 'कैटलॉग सबमिशन')}</p>
          <h1>{tx(language, 'Add a New Agricultural Product', 'नया कृषि उत्पाद जोड़ें')}</h1>
          <span>
            {tx(
              language,
              'Complete image, stock, pack variant, pricing & compliance details shown to buyers in Marketplace & Cart. Submitted items undergo Super Admin approval.',
              'खरीदारों को मार्केटप्लेस और कार्ट में दिखने वाली इमेज, स्टॉक, पैक और कीमत की जानकारी भरें। सबमिट किए गए उत्पाद सुपर एडमिन सत्यापन के बाद लाइव होंगे।'
            )}
          </span>
        </div>
        {onCancel ? (
          <button type="button" className="outline-btn" onClick={onCancel}>
            {tx(language, 'Cancel', 'रद्द करें')}
          </button>
        ) : (
          <Link href={cancelHref} className="outline-btn">
            {tx(language, 'Back to My Products', 'मेरे उत्पाद देखें')}
          </Link>
        )}
      </div>

      {createdSummary && (
        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"
          role="status"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={20} />
            <div>
              <h3 className="text-sm font-bold">
                Product submitted for Super Admin review ({createdSummary.title})
              </h3>
              <p className="mt-1 text-xs text-emerald-800">
                Pack: <b>{createdSummary.variantTitle}</b> • SKU: <b>{createdSummary.sku}</b> •
                Stock: <b>{createdSummary.stock} units</b> • Price:{' '}
                <b>₹{createdSummary.price.toLocaleString('en-IN')}</b> • Status:{' '}
                <span className="font-semibold">PENDING_REVIEW</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetForAnother}
              className="rounded-lg border border-emerald-700 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              + Add Another Product
            </button>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                View Shop Products
              </button>
            ) : (
              <Link
                href="/vendor/products"
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                View Shop Products
              </Link>
            )}
          </div>
        </div>
      )}

      {error && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
          role="alert"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT COLUMN: FORM SECTIONS */}
        <div className="space-y-5 xl:col-span-8">
          {/* 1. PRODUCT IMAGE & GALLERY */}
          <div className="account-card">
            <div className="account-card-head">
              <div className="account-card-head-title">
                <div className="account-card-icon">
                  <ImagePlus size={18} />
                </div>
                <div>
                  <h2>1. Product Images (Displayed on Store &amp; Cart)</h2>
                  <p>
                    Upload high-resolution product packaging photo (JPG, PNG, WEBP up to 10MB) or
                    paste an image URL.
                  </p>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#174d2b] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#113a20] disabled:opacity-60"
                >
                  {uploadingImage ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {uploadingImage ? 'Uploading...' : 'Upload Product Photo'}
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {uploadError}
              </div>
            )}

            <div className="account-form-grid">
              <label className="span-2">
                Primary Image URL *
                <input
                  type="text"
                  value={primaryImageUrl}
                  onChange={(e) => setPrimaryImageUrl(e.target.value)}
                  placeholder="/uploads/product-photo.jpg or https://..."
                  required
                />
              </label>

              <div className="span-2">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#17281e]">
                  Quick Sample Photos
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_AGRI_IMAGES.map((sample) => (
                    <button
                      key={sample.url}
                      type="button"
                      onClick={() => setPrimaryImageUrl(sample.url)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                        primaryImageUrl.trim() === sample.url
                          ? 'border-[#174d2b] bg-[#eef7f0] text-[#174d2b]'
                          : 'border-[#dce5de] bg-white text-[#536459] hover:bg-[#f7faf7]'
                      }`}
                    >
                      <img
                        src={sample.url}
                        alt={sample.label}
                        className="h-5 w-5 rounded object-cover"
                        onError={handleProductImageError}
                      />
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="span-2">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#17281e]">
                  Additional Gallery Image URL (Optional)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extraImageInput}
                    onChange={(e) => setExtraImageInput(e.target.value)}
                    placeholder="https://... or /uploads/side-view.jpg"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddExtraUrl}
                    className="rounded-lg border border-[#cad7ce] bg-[#f7faf7] px-3.5 text-xs font-semibold text-[#174d2b] hover:bg-[#eaf3ec]"
                  >
                    + Add URL
                  </button>
                </div>
              </div>

              {allImages.length > 0 && (
                <div className="span-2">
                  <span className="mb-2 block text-[12px] font-semibold text-[#17281e]">
                    Active Product Gallery ({allImages.length})
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {allImages.map((imgUrl, idx) => (
                      <div
                        key={imgUrl}
                        className="group relative h-20 w-20 overflow-hidden rounded-xl border border-[#d9e3db] bg-[#f4f7f4]"
                      >
                        <img
                          src={resolveProductImage(imgUrl)}
                          alt={`Product ${idx + 1}`}
                          className="h-full w-full object-cover"
                          onError={handleProductImageError}
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-[#174d2b]/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            MAIN
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(imgUrl)}
                          title="Remove image"
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow-sm hover:bg-red-50"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. BASIC & AGRICULTURAL DETAILS */}
          <div className="account-card">
            <div className="account-card-head">
              <div className="account-card-head-title">
                <div className="account-card-icon">
                  <Leaf size={18} />
                </div>
                <div>
                  <h2>2. Basic &amp; Agricultural Information</h2>
                  <p>
                    Title, category, brand, seller shop, crops &amp; dosage visible across catalog
                    and buyer Cart.
                  </p>
                </div>
              </div>
            </div>

            <div className="account-form-grid">
              <label>
                Product Title (English) *
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bharat Bio-Potash 98% Granules"
                  required
                />
              </label>

              <label>
                Product Title in Hindi (Optional)
                <input
                  type="text"
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  placeholder="उदा. भारत बायो-पोटाश दानेदार"
                />
              </label>

              <label>
                Category *
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={loadingCats}
                >
                  {loadingCats ? (
                    <option value="">Loading categories...</option>
                  ) : categories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                Brand / Manufacturer Name
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Coromandel, IFFCO, Bayer, Syngenta"
                />
              </label>

              <label>
                Seller Shop (Auto-linked)
                <input type="text" value={shopName} readOnly className="bg-[#f4f7f4] text-[#536459]" />
              </label>

              <label>
                HSN / Tax Code (Optional)
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="e.g. 31059090"
                />
              </label>

              <label className="span-2">
                Agricultural Description &amp; Benefits *
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe composition, crop benefits, germination rate, or mode of action..."
                  required
                />
              </label>

              <div className="span-2">
                <label className="mb-1.5 block">
                  Suitable Crops (Comma separated)
                  <input
                    type="text"
                    value={suitableCrops}
                    onChange={(e) => setSuitableCrops(e.target.value)}
                    placeholder="Wheat, Paddy, Cotton, Tomato"
                    className="mt-1.5"
                  />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CROP_PRESETS.map((crop) => {
                    const selected = suitableCrops
                      .toLowerCase()
                      .split(',')
                      .map((s) => s.trim())
                      .includes(crop.toLowerCase());
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCropPreset(crop)}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                          selected
                            ? 'border-[#174d2b] bg-[#174d2b] text-white'
                            : 'border-[#d2ded5] bg-[#f7faf7] text-[#355240] hover:bg-[#eaf2ec]'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label>
                Active Ingredients / Composition
                <input
                  type="text"
                  value={activeIngredients}
                  onChange={(e) => setActiveIngredients(e.target.value)}
                  placeholder="e.g. Humic Acid 98% + Fulvic Acid"
                />
              </label>

              <label>
                Dosage / Application Method
                <input
                  type="text"
                  value={dosageInstructions}
                  onChange={(e) => setDosageInstructions(e.target.value)}
                  placeholder="e.g. 2g per litre foliar spray or 2kg/acre soil"
                />
              </label>

              <label>
                Batch Number
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-KH-2026"
                />
              </label>

              <label>
                Expiry / Best Before Date
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </label>

              <label>
                CIB&amp;RC / Seed License Reg. No.
                <input
                  type="text"
                  value={cibRegistrationNo}
                  onChange={(e) => setCibRegistrationNo(e.target.value)}
                  placeholder="Optional regulatory certificate ID"
                />
              </label>

              <div className="flex items-end pb-1">
                <label className="flex cursor-pointer flex-row items-center gap-2.5 rounded-lg border border-[#dce6de] bg-[#f8fbf8] px-3.5 py-2.5 text-xs font-semibold text-[#174d2b]">
                  <input
                    type="checkbox"
                    checked={organicCertified}
                    onChange={(e) => setOrganicCertified(e.target.checked)}
                    className="!h-4 !w-4 accent-[#174d2b]"
                  />
                  Certified Organic / NPOP Approved Input
                </label>
              </div>
            </div>
          </div>

          {/* 3. PACK VARIANTS, PRICING & STOCK (CART FIELDS) */}
          <div className="account-card">
            <div className="account-card-head">
              <div className="account-card-head-title">
                <div className="account-card-icon">
                  <Package size={18} />
                </div>
                <div>
                  <h2>3. Pack Sizes, Pricing &amp; Stock Inventory *</h2>
                  <p>
                    Each pack variant controls the Pack label, MRP, Selling Price, Discount %, Free
                    Delivery eligibility, and available Stock in the buyer Cart.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#174d2b] bg-[#eef7f0] px-3 py-1.5 text-xs font-semibold text-[#174d2b] hover:bg-[#dff0e3]"
              >
                <Plus size={14} /> Add Pack Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, idx) => {
                const vMrp = Number(variant.mrp) || 0;
                const vPrice = Number(variant.price) || 0;
                const vStock = Number.parseInt(variant.stock || '0', 10) || 0;
                const vOff =
                  vMrp > vPrice && vMrp > 0 ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#dce5dd] bg-[#fafcfa] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8efe9] pb-2">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-[#174d2b]" />
                        <span className="text-xs font-bold text-[#17281e]">
                          Variant #{idx + 1} {idx === 0 ? '(Primary Cart Default)' : ''}
                        </span>
                        {vOff > 0 && (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {vOff}% OFF
                          </span>
                        )}
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            vStock > 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : vStock > 0
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {vStock > 0 ? `${vStock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>

                    <div className="account-form-grid">
                      <label>
                        Pack / Variant Title (Shown as &ldquo;Pack:&rdquo; in Cart) *
                        <input
                          type="text"
                          value={variant.title}
                          onChange={(e) => updateVariant(idx, 'title', e.target.value)}
                          placeholder="e.g. 1 Kg Pack / 500 ml Bottle"
                          required
                        />
                      </label>

                      <label>
                        SKU Code *
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                          placeholder="e.g. KC-BIO-001"
                          required
                        />
                      </label>

                      <label>
                        MRP (₹) *
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={variant.mrp}
                          onChange={(e) => updateVariant(idx, 'mrp', e.target.value)}
                          placeholder="699"
                          required
                        />
                      </label>

                      <label>
                        Selling Price (₹) *
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                          placeholder="549"
                          required
                        />
                      </label>

                      <label>
                        Available Stock Quantity *
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={variant.stock}
                          onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                          placeholder="50"
                          required
                        />
                      </label>

                      <label>
                        Shipping Weight (Kg)
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={variant.weightKg}
                          onChange={(e) => updateVariant(idx, 'weightKg', e.target.value)}
                          placeholder="1.0"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BAR */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-[#cad7ce] bg-white px-5 py-2.5 text-xs font-semibold text-[#314237] hover:bg-[#f4f7f4]"
              >
                Cancel
              </button>
            ) : (
              <Link
                href={cancelHref}
                className="rounded-lg border border-[#cad7ce] bg-white px-5 py-2.5 text-xs font-semibold text-[#314237] hover:bg-[#f4f7f4]"
              >
                Cancel
              </Link>
            )}
            <button
              type="submit"
              disabled={submitting || !categoryId}
              className="inline-flex items-center gap-2 rounded-lg bg-[#174d2b] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#113a20] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Submitting Product...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Publish Product for Admin Review
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE CART & CATALOG PREVIEW */}
        <div className="space-y-4 xl:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="account-card">
              <div className="mb-3 flex items-center justify-between border-b border-[#edf2ed] pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-[#174d2b]" />
                  <h3 className="text-sm font-bold text-[#17281e]">Live Buyer Cart Preview</h3>
                </div>
                <span className="rounded-full bg-[#eef7f0] px-2.5 py-0.5 text-[10px] font-bold text-[#174d2b]">
                  Matches /cart
                </span>
              </div>

              <div className="seller-group overflow-hidden">
                <div className="seller-heading">
                  <Store size={15} />
                  <span>
                    <span>
                      Sold by <b>{shopName}</b>
                    </span>
                    <small>
                      <ShieldCheck size={11} /> Verified shop
                    </small>
                  </span>
                  {qualifiesFreeDelivery ? (
                    <span className="delivery-free">FREE DELIVERY</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                      <Truck size={10} /> ₹50 Shipping (&lt; ₹999)
                    </span>
                  )}
                </div>

                <div className="cart-item border-b-0">
                  <img
                    src={resolveProductImage(allImages[0])}
                    alt={title || 'Product preview'}
                    onError={handleProductImageError}
                  />
                  <div className="cart-item-main">
                    <span className="eyebrow">{selectedCategoryName}</span>
                    <h3>{title.trim() || 'Agricultural Product Title'}</h3>
                    <p>
                      Pack: <b>{primaryVariant?.title.trim() || 'Standard'}</b>
                      {brandName.trim() ? ` • Brand: ${brandName.trim()}` : ''}
                    </p>
                    <div className="price-row">
                      <b>₹{previewPrice.toLocaleString('en-IN')}</b>
                      {previewMrp > previewPrice && (
                        <del>₹{previewMrp.toLocaleString('en-IN')}</del>
                      )}
                      {discountPct > 0 && <span>{discountPct}% off</span>}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          previewStock > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {previewStock > 0
                          ? `In Stock (${previewStock} units)`
                          : 'Out of Stock (0 units)'}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        SKU: {primaryVariant?.sku.trim() || 'PENDING'}
                      </span>
                      {organicCertified && (
                        <span className="rounded-md bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                          Organic Certified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-[#e7efe7] bg-[#f8fbf8] p-3 text-[11px] text-[#4c5e52]">
                <div className="flex justify-between">
                  <span>Variants configured:</span>
                  <b className="text-[#17281e]">{variants.length} pack option(s)</b>
                </div>
                <div className="flex justify-between">
                  <span>Total initial stock:</span>
                  <b className="text-[#17281e]">
                    {variants.reduce(
                      (sum, item) => sum + (Number.parseInt(item.stock || '0', 10) || 0),
                      0
                    )}{' '}
                    units
                  </b>
                </div>
                <div className="flex justify-between">
                  <span>Images attached:</span>
                  <b className="text-[#17281e]">{allImages.length} photo(s)</b>
                </div>
                <div className="flex justify-between">
                  <span>Initial listing status:</span>
                  <b className="text-amber-700">PENDING_REVIEW</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
