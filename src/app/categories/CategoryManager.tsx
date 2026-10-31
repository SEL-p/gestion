'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { addCategory, deleteCategory } from '@/actions/categories';
import {
  Layers,
  Plus,
  Trash2,
  FolderPlus,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface CategoryManagerProps {
  initialCategories: { id: string; name: string }[];
}

const PRESET_SUGGESTIONS = [
  { name: 'Alimentaire & Épicerie', icon: '🥫' },
  { name: 'Boissons & Jus', icon: '🥤' },
  { name: 'Produits Frais & Laitiers', icon: '🧀' },
  { name: 'Fruits & Légumes', icon: '🍎' },
  { name: 'Boulangerie & Pâtisserie', icon: '🥖' },
  { name: 'Entretien & Ménage', icon: '🧼' },
  { name: 'Hygiène & Beauté', icon: '🧴' },
  { name: 'Boucherie & Charcuterie', icon: '🥩' },
  { name: 'Confiserie & Chocolat', icon: '🍫' },
  { name: 'Bazar & Maison', icon: '🏠' },
];

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await addCategory(name.trim());
    if (res.success) {
      const newCat = { id: `temp-${Date.now()}`, name: name.trim() };
      setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setSuccess(`Rayon "${newCat.name}" ajouté avec succès !`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'Erreur lors de l’ajout du rayon.');
    }
    setLoading(false);
  };

  const handleQuickAdd = async (presetName: string) => {
    if (categories.some((c) => c.name.toLowerCase() === presetName.toLowerCase())) {
      setError(`Le rayon "${presetName}" existe déjà.`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    setName(presetName);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Supprimer le rayon "${catName}" ?`)) return;
    const res = await deleteCategory(id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSuccess(`Rayon "${catName}" supprimé.`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'Impossible de supprimer.');
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="cat-redesign-page">
      {/* ── 1. Forest Teal Header ─────────────────────────────────────────── */}
      <header className="cat-top-header">
        <div className="cat-header-left">
          <Link href="/products" className="cat-back-btn" title="Retour catalogue">
            ← <span>Catalogue</span>
          </Link>
          <div>
            <h1 className="cat-main-title">Rayons & Catégories</h1>
            <span className="cat-subtitle">{categories.length} département(s) configuré(s)</span>
          </div>
        </div>

        <Link href="/products/new" className="cat-header-cta">
          + Produit
        </Link>
      </header>

      {/* ── Toast Alerts ─────────────────────────────────────────────────── */}
      {error && (
        <div className="cat-alert is-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="cat-alert is-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* ── 2. Add Category Card ──────────────────────────────────────────── */}
      <section className="cat-form-card">
        <div className="cat-form-head">
          <div className="cat-badge-icon">
            <FolderPlus size={18} />
          </div>
          <div>
            <h2>Créer un nouveau rayon</h2>
            <p>Saisissez le nom ou choisissez parmi les départements recommandés.</p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="cat-add-form">
          <div className="cat-input-wrap">
            <input
              type="text"
              required
              placeholder="Ex: Boissons & Jus, Produits Frais..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="cat-text-input"
            />
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="cat-submit-btn"
            >
              {loading ? '...' : (
                <>
                  <Plus size={16} />
                  <span>Ajouter</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preset Suggestions Chips */}
        <div className="cat-suggestions-wrap">
          <span className="cat-suggestions-label">Suggestions rapides :</span>
          <div className="cat-chips-list">
            {PRESET_SUGGESTIONS.map((preset) => {
              const alreadyExists = categories.some(
                (c) => c.name.toLowerCase() === preset.name.toLowerCase()
              );
              return (
                <button
                  key={preset.name}
                  type="button"
                  disabled={alreadyExists}
                  onClick={() => handleQuickAdd(preset.name)}
                  className={`cat-chip-btn ${alreadyExists ? 'is-disabled' : ''}`}
                  title={alreadyExists ? 'Déjà présent' : 'Cliquer pour préremplir'}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. Categories List ────────────────────────────────────────────── */}
      <section className="cat-list-section">
        <div className="cat-list-header">
          <h2>Rayons du Supermarché ({filtered.length})</h2>
          <input
            type="text"
            placeholder="Filtrer les rayons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cat-filter-input"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="cat-empty-box">
            <Layers size={36} color="#94A3B8" />
            <p>Aucun rayon trouvé.</p>
          </div>
        ) : (
          <div className="cat-grid-cards">
            {filtered.map((cat, idx) => (
              <div key={cat.id} className="cat-item-card">
                <div className="cat-item-left">
                  <span className="cat-item-num">{idx + 1}</span>
                  <div className="cat-item-info">
                    <strong className="cat-item-name">{cat.name}</strong>
                    <span className="cat-item-badge">Rayon actif</span>
                  </div>
                </div>

                <div className="cat-item-actions">
                  <Link
                    href={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="cat-btn-browse"
                    title="Voir les articles"
                  >
                    Articles
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="cat-btn-delete"
                    title="Supprimer ce rayon"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
