'use client';

import Link from 'next/link';
import { Download, Archive, FileSpreadsheet, Database } from 'lucide-react';
import { useState } from 'react';

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.href = '/api/export';
      setTimeout(() => setLoading(false), 2000);
    }, 100);
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '680px', marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
        <Database size={22} color="var(--primary-color, #00796B)" />
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Données, Archives & Exports</h2>
      </div>

      <p style={{ marginBottom: '1.5rem', color: 'var(--text-color)', opacity: 0.8, fontSize: '0.9rem' }}>
        Gérez l'historique de vos références archivées, exportez vos fiches articles sur Excel ou téléchargez une sauvegarde intégrale de votre supermarché.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Ligne 1: Articles archivés */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.1rem',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.92rem' }}>Références & Produits Archivés</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Consulter ou restaurer les articles retirés des rayons</span>
          </div>
          <Link
            href="/products/archived"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', padding: '0.45rem 0.95rem' }}
          >
            <Archive size={16} />
            <span>Voir les articles archivés</span>
          </Link>
        </div>

        {/* Ligne 2: Exporter CSV */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.1rem',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.92rem' }}>Catalogue Produits (Tableur CSV)</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Format compatible Excel, Google Sheets et logiciels tiers</span>
          </div>
          <a
            href="/api/csv"
            download
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', padding: '0.45rem 0.95rem' }}
          >
            <FileSpreadsheet size={16} />
            <span>Exporter CSV</span>
          </a>
        </div>

        {/* Ligne 3: Sauvegarde complète ZIP */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.1rem',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.92rem' }}>Sauvegarde Complète (Archive ZIP)</strong>
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Base de données complète + images produits originales</span>
          </div>
          <button 
            type="button"
            onClick={handleExport} 
            disabled={loading}
            className="btn btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', padding: '0.45rem 0.95rem' }}
          >
            <Download size={16} />
            <span>{loading ? 'Préparation...' : 'Sauvegarde ZIP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

