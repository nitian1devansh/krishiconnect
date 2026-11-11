'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  Layers,
  Leaf,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { products } from '@/lib/referenceData';

export interface SoilReport {
  id: string;
  sampleName: string;
  testedDate: string;
  soilType: string;
  phLevel: number;
  nitrogenLevel: number; // kg/ha
  phosphorusLevel: number; // kg/ha
  potassiumLevel: number; // kg/ha
  organicCarbon: number; // %
  healthScore: number; // 0-100
  fileName?: string;
}

export function SoilTestingModule() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [reports, setReports] = useState<SoilReport[]>([
    {
      id: 'sr-1',
      sampleName: 'North Field - Plot 4',
      testedDate: '15 May 2025',
      soilType: 'Black Soil',
      phLevel: 7.2,
      nitrogenLevel: 180, // Low (optimal: 280-560)
      phosphorusLevel: 32, // Optimal (25-50)
      potassiumLevel: 240, // Optimal (150-300)
      organicCarbon: 0.65,
      healthScore: 78,
      fileName: 'Soil_Health_Card_Plot4.pdf',
    },
    {
      id: 'sr-2',
      sampleName: 'Orchard Block B (Mango)',
      testedDate: '02 Feb 2025',
      soilType: 'Red Loam',
      phLevel: 6.4,
      nitrogenLevel: 310,
      phosphorusLevel: 42,
      potassiumLevel: 195,
      organicCarbon: 0.82,
      healthScore: 89,
      fileName: 'Lab_Report_Feb2025.pdf',
    },
  ]);

  const [activeReport, setActiveReport] = useState<SoilReport>(reports[0]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [sampleName, setSampleName] = useState('');
  const [soilType, setSoilType] = useState('Black Soil');
  const [phLevel, setPhLevel] = useState<number>(6.8);
  const [nitrogenLevel, setNitrogenLevel] = useState<number>(220);
  const [phosphorusLevel, setPhosphorusLevel] = useState<number>(28);
  const [potassiumLevel, setPotassiumLevel] = useState<number>(210);
  const [organicCarbon, setOrganicCarbon] = useState<number>(0.7);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const calculateHealthScore = (ph: number, n: number, p: number, k: number): number => {
    let score = 70;
    if (ph >= 6.5 && ph <= 7.5) score += 10;
    else if (ph >= 6.0 && ph <= 8.0) score += 5;
    if (n >= 250) score += 7;
    if (p >= 25) score += 7;
    if (k >= 150) score += 6;
    return Math.min(score, 98);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);

    setTimeout(() => {
      const score = calculateHealthScore(phLevel, nitrogenLevel, phosphorusLevel, potassiumLevel);
      const newReport: SoilReport = {
        id: `sr-${Date.now()}`,
        sampleName: sampleName || 'New Field Sample',
        testedDate: 'Today',
        soilType,
        phLevel,
        nitrogenLevel,
        phosphorusLevel,
        potassiumLevel,
        organicCarbon,
        healthScore: score,
        fileName: uploadedFile ? uploadedFile.name : undefined,
      };

      setReports([newReport, ...reports]);
      setActiveReport(newReport);
      setAnalyzing(false);
      setShowForm(false);
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 5000);
    }, 600);
  };

  // Helper status tags
  const getPhStatus = (ph: number) => {
    if (ph < 6.0) return { label: 'Acidic', color: 'text-amber-700 bg-amber-50' };
    if (ph > 7.8) return { label: 'Alkaline', color: 'text-blue-700 bg-blue-50' };
    return { label: 'Optimal / Neutral', color: 'text-emerald-700 bg-emerald-50' };
  };

  const getNStatus = (n: number) => {
    if (n < 220) return { label: 'Low', color: 'text-red-700 bg-red-50' };
    if (n > 480) return { label: 'High', color: 'text-blue-700 bg-blue-50' };
    return { label: 'Adequate', color: 'text-emerald-700 bg-emerald-50' };
  };

  const getPStatus = (p: number) => {
    if (p < 20) return { label: 'Deficient', color: 'text-red-700 bg-red-50' };
    if (p > 55) return { label: 'High', color: 'text-blue-700 bg-blue-50' };
    return { label: 'Optimal', color: 'text-emerald-700 bg-emerald-50' };
  };

  const getKStatus = (k: number) => {
    if (k < 140) return { label: 'Low', color: 'text-red-700 bg-red-50' };
    if (k > 320) return { label: 'High', color: 'text-blue-700 bg-blue-50' };
    return { label: 'Sufficient', color: 'text-emerald-700 bg-emerald-50' };
  };

  const phMeta = getPhStatus(activeReport.phLevel);
  const nMeta = getNStatus(activeReport.nitrogenLevel);
  const pMeta = getPStatus(activeReport.phosphorusLevel);
  const kMeta = getKStatus(activeReport.potassiumLevel);

  return (
    <div className="container support-content">
      {/* Title Bar */}
      <div className="support-title">
        <div>
          <span className="kicker">
            {tx(language, 'SOIL HEALTH & AGRONOMY', 'मृदा स्वास्थ्य एवं कृषि विज्ञान')}
          </span>
          <h2>
            {tx(
              language,
              'Scientific Soil Testing & Nutrient Intelligence',
              'वैज्ञानिक मिट्टी परीक्षण और पोषण प्रबंधन'
            )}
          </h2>
          <p>
            {tx(
              language,
              'Optimize fertilizer dosage, correct soil pH, and maximize farm yields with laboratory-backed recommendations.',
              'प्रयोगशाला-आधारित रिपोर्ट के साथ उर्वरक की सही मात्रा, मिट्टी का pH और अधिक पैदावार सुनिश्चित करें।'
            )}
          </p>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={16} /> {showForm ? 'Close Form' : 'Test New Soil Sample'}
        </button>
      </div>

      {successNotice && (
        <div className="posted-notice" style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={18} /> Soil report generated and analyzed successfully! Nutrient
          recommendations have been updated below.
        </div>
      )}

      {/* Benefits Overview Strip */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #dfe7df',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#e8f5e9',
              color: '#2e7d32',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={20} />
          </div>
          <div>
            <b style={{ fontSize: '14px', display: 'block', color: '#17221a' }}>Up to 30% Higher Yield</b>
            <small style={{ color: '#66736a' }}>Balanced NPK nutrition tailored to crop cycle</small>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #dfe7df',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#e8f5e9',
              color: '#2e7d32',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <b style={{ fontSize: '14px', display: 'block', color: '#17221a' }}>Cut Input Wastage</b>
            <small style={{ color: '#66736a' }}>Prevent over-fertilization and save ₹2,500/acre</small>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #dfe7df',
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#e8f5e9',
              color: '#2e7d32',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Leaf size={20} />
          </div>
          <div>
            <b style={{ fontSize: '14px', display: 'block', color: '#17221a' }}>Long-Term Soil Fertility</b>
            <small style={{ color: '#66736a' }}>Improve organic carbon & microbial activity</small>
          </div>
        </div>
      </section>

      {/* FORM: New Soil Test Entry Modal/Card */}
      {showForm && (
        <section
          style={{
            background: '#fff',
            border: '1px solid #2e7d32',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 8px 30px rgba(46, 125, 50, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="kicker">INPUT LAB VALUES</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 0' }}>
                Enter Soil Test Parameters & Upload Card
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#66736a' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Sample / Plot Name
                <input
                  style={{ padding: '10px 14px', border: '1px solid #dfe7df', borderRadius: '10px', fontSize: '13px' }}
                  placeholder="e.g. South Farm - Cotton Block"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Soil Type
                <select
                  style={{ padding: '10px 14px', border: '1px solid #dfe7df', borderRadius: '10px', fontSize: '13px' }}
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                >
                  <option>Black Cotton Soil</option>
                  <option>Red Loam Soil</option>
                  <option>Alluvial Soil</option>
                  <option>Clay Soil</option>
                  <option>Sandy Loam</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Soil pH Level (0 - 14)
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="10"
                    style={{ width: '80px', padding: '10px 14px', border: '1px solid #dfe7df', borderRadius: '10px', fontSize: '13px' }}
                    value={phLevel}
                    onChange={(e) => setPhLevel(parseFloat(e.target.value))}
                    required
                  />
                  <small style={{ color: '#66736a' }}>Optimal: 6.5 - 7.5</small>
                </div>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Available Nitrogen (N) (kg/ha)
                <input
                  type="number"
                  style={{ padding: '10px 14px', border: '1px solid #dfe7df', borderRadius: '10px', fontSize: '13px' }}
                  placeholder="e.g. 210"
                  value={nitrogenLevel}
                  onChange={(e) => setNitrogenLevel(parseInt(e.target.value, 10))}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Available Phosphorus (P) (kg/ha)
                <input
                  type="number"
                  style={{ padding: '10px 14px', border: '1px solid #dfe7df', borderRadius: '10px', fontSize: '13px' }}
                  placeholder="e.g. 30"
                  value={phosphorusLevel}
                  onChange={(e) => setPhosphorusLevel(parseInt(e.target.value, 10))}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Available Potassium (K) (kg/ha)
                <input
                  type="number"
                  style={{ padding: '10px 14px', border: '1px solid #dfe7df', borderRadius: '10px', fontSize: '13px' }}
                  placeholder="e.g. 220"
                  value={potassiumLevel}
                  onChange={(e) => setPotassiumLevel(parseInt(e.target.value, 10))}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Organic Carbon (OC %)
                <input
                  type="number"
                  step="0.05"
                  style={{ padding: '10px 14px', border: '1px solid #dfe7df', borderRadius: '10px', fontSize: '13px' }}
                  placeholder="e.g. 0.65"
                  value={organicCarbon}
                  onChange={(e) => setOrganicCarbon(parseFloat(e.target.value))}
                />
              </label>
            </div>

            {/* Document Upload Dropzone */}
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Upload Soil Health Card / Lab Certificate (Optional - PDF or Image)
              </span>
              <div
                style={{
                  border: '2px dashed #c8e6c9',
                  borderRadius: '14px',
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f8faf7',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('soil-file-upload')?.click()}
              >
                <UploadCloud size={32} style={{ color: '#2e7d32', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 4px', color: '#17221a' }}>
                  {uploadedFile ? uploadedFile.name : 'Click to select Soil Health Card or Lab Report'}
                </p>
                <small style={{ color: '#66736a' }}>Supports PDF, JPG, PNG up to 10MB</small>
                <input
                  id="soil-file-upload"
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="outline-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary" disabled={analyzing}>
                {analyzing ? 'Analyzing Soil Report...' : 'Analyze & Save Report'} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Main Analysis Dashboard for Selected Report */}
      <div className="advisor-layout">
        {/* Left: Health Card & Diagnostic Metrics */}
        <section className="form-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <span className="eyebrow">{activeReport.soilType}</span>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '2px 0 6px' }}>
                {activeReport.sampleName}
              </h3>
              <small style={{ color: '#66736a' }}>
                Tested on {activeReport.testedDate} · Report #{activeReport.id.toUpperCase()}
              </small>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#66736a', fontWeight: 700 }}>
                Soil Health Index
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#2e7d32' }}>
                {activeReport.healthScore} <small style={{ fontSize: '14px', color: '#66736a' }}>/ 100</small>
              </div>
            </div>
          </div>

          {/* Metric Indicators Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              margin: '20px 0',
            }}
          >
            <div
              style={{
                background: '#f8faf7',
                border: '1px solid #dfe7df',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#66736a', fontWeight: 600 }}>Soil pH</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }} className={phMeta.color}>
                  {phMeta.label}
                </span>
              </div>
              <b style={{ fontSize: '18px', color: '#17221a' }}>{activeReport.phLevel}</b>
              <small style={{ display: 'block', fontSize: '11px', color: '#66736a', marginTop: '2px' }}>
                Normal range: 6.5 – 7.5
              </small>
            </div>

            <div
              style={{
                background: '#f8faf7',
                border: '1px solid #dfe7df',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#66736a', fontWeight: 600 }}>Nitrogen (N)</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }} className={nMeta.color}>
                  {nMeta.label}
                </span>
              </div>
              <b style={{ fontSize: '18px', color: '#17221a' }}>{activeReport.nitrogenLevel} kg/ha</b>
              <small style={{ display: 'block', fontSize: '11px', color: '#66736a', marginTop: '2px' }}>
                Optimal: 280 – 560 kg/ha
              </small>
            </div>

            <div
              style={{
                background: '#f8faf7',
                border: '1px solid #dfe7df',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#66736a', fontWeight: 600 }}>Phosphorus (P)</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }} className={pMeta.color}>
                  {pMeta.label}
                </span>
              </div>
              <b style={{ fontSize: '18px', color: '#17221a' }}>{activeReport.phosphorusLevel} kg/ha</b>
              <small style={{ display: 'block', fontSize: '11px', color: '#66736a', marginTop: '2px' }}>
                Optimal: 25 – 50 kg/ha
              </small>
            </div>

            <div
              style={{
                background: '#f8faf7',
                border: '1px solid #dfe7df',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#66736a', fontWeight: 600 }}>Potassium (K)</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }} className={kMeta.color}>
                  {kMeta.label}
                </span>
              </div>
              <b style={{ fontSize: '18px', color: '#17221a' }}>{activeReport.potassiumLevel} kg/ha</b>
              <small style={{ display: 'block', fontSize: '11px', color: '#66736a', marginTop: '2px' }}>
                Optimal: 150 – 300 kg/ha
              </small>
            </div>
          </div>

          {activeReport.fileName && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#e8f5e9',
                borderRadius: '10px',
                marginBottom: '16px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#174d2b', fontWeight: 600 }}>
                <FileText size={16} /> {activeReport.fileName}
              </span>
              <button
                type="button"
                onClick={() => alert(`Downloading verified lab report: ${activeReport.fileName}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2e7d32',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          )}

          {/* Past Reports List */}
          <div style={{ marginTop: '24px' }}>
            <span className="kicker">TESTING HISTORY</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {reports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveReport(r)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: r.id === activeReport.id ? '2px solid #2e7d32' : '1px solid #dfe7df',
                    background: r.id === activeReport.id ? '#e8f5e9' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <b style={{ fontSize: '13px', color: '#17221a' }}>{r.sampleName}</b>
                    <small style={{ display: 'block', color: '#66736a', fontSize: '11px' }}>
                      {r.testedDate} · pH {r.phLevel} · Health Index {r.healthScore}/100
                    </small>
                  </div>
                  <BadgeCheck size={18} style={{ color: r.id === activeReport.id ? '#2e7d32' : '#c8e6c9' }} />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Recommendations & Recommended Products */}
        <section className="recommendation-results generated">
          <div className="result-head">
            <span className="kicker">SOIL CONDITIONING PLAN</span>
            <h3>Nutrient & Amendment Strategy</h3>
            <p>
              Based on {activeReport.soilType.toLowerCase()} analysis with pH {activeReport.phLevel} and
              Nitrogen {activeReport.nitrogenLevel} kg/ha.
            </p>
          </div>

          {/* Action Card 1: Nitrogen replenishment */}
          <article className="recommendation-card nutrient">
            <div className="recommendation-type">
              <span>
                <Leaf size={18} />
              </span>
              <div>
                <small>PRIMARY NITROGEN BOOST</small>
                <h4>Organic Vermicompost & Bio-NPK</h4>
              </div>
              <b>Top Priority</b>
            </div>
            <p>
              Your soil nitrogen ({activeReport.nitrogenLevel} kg/ha) is below optimal. Top-dress with
              organic vermicompost and apply water-soluble bio-fertilizer to restore root-zone biology.
            </p>
            <div className="dose-grid">
              <span>
                <small>DOSAGE</small>
                <b>2.5 Ton / acre</b>
              </span>
              <span>
                <small>METHOD</small>
                <b>Soil incorporation</b>
              </span>
              <span>
                <small>TIMING</small>
                <b>Pre-sowing or early vegetative</b>
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push('/products?category=Fertilizers')}
            >
              View Recommended Fertilizers <ArrowRight size={15} />
            </button>
          </article>

          {/* Action Card 2: Organic Carbon & Soil Conditioning */}
          <article className="recommendation-card protection">
            <div className="recommendation-type">
              <span>
                <Sprout size={18} />
              </span>
              <div>
                <small>SOIL CONDITIONER</small>
                <h4>Bio-Neem Cake & Humic Acid 12%</h4>
              </div>
              <b>Soil Health</b>
            </div>
            <p>
              Maintains optimal pH stability and increases cation-exchange capacity. Apply humic acid
              through drip irrigation to increase nutrient uptake efficiency by 24%.
            </p>
            <div className="diagnostic-steps">
              <span>
                <b>1</b> Broadcast neem cake at 100 kg/acre
              </span>
              <span>
                <b>2</b> Run drip lines with humic extract
              </span>
              <span>
                <b>3</b> Retest soil after 90 days
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push('/products?category=Organic')}
            >
              Explore Soil Conditioners <ArrowRight size={15} />
            </button>
          </article>

          {/* Recommended Verified Marketplace Products */}
          <div style={{ marginTop: '24px' }}>
            <span className="kicker">MATCHING INPUTS IN MARKETPLACE</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '10px' }}>
              {products.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #dfe7df',
                    borderRadius: '14px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '10px', marginBottom: '8px' }}
                  />
                  <div>
                    <small style={{ fontSize: '10px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase' }}>
                      {item.category}
                    </small>
                    <b style={{ fontSize: '13px', display: 'block', color: '#17221a', lineHeight: 1.3, margin: '2px 0 6px' }}>
                      {item.name}
                    </b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <b style={{ fontSize: '15px' }}>₹{item.price}</b>
                    {user?.role !== 'VENDOR' && (
                      <button
                        type="button"
                        style={{
                          padding: '6px 10px',
                          background: '#e8f5e9',
                          color: '#174d2b',
                          border: '1px solid #c8e6c9',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onClick={() => alert(`Added ${item.name} to cart!`)}
                      >
                        <ShoppingCart size={13} /> Add
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SoilTestingModule;

