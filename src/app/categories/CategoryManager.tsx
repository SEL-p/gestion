'use client';

import React, { useState } from 'react';
import { addCategory, deleteCategory } from '@/actions/categories';
import {
  Layers,
  Plus,
  Trash2,
  Package,
  FolderPlus,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CategoryManagerProps {
  initialCategories: { id: string; name: string }[];
}

const PRESET_SUGGESTIONS = [
  { name: 'Alimentaire & Épicerie', icon: '🥫' },
  { name: 'Boissons & Rafraîchissements', icon: '🥤' },
  { name: 'Produits Frais & Laiterie', icon: '🧀' },
  { name: 'Fruits & Légumes', icon: '🍎' },
  { name: 'Boulangerie & Pâtisserie', icon: '🥖' },
  { name: 'Entretien & Ménage', icon: '🧼' },
  { name: 'Hygiène & Beauté', icon: '🧴' },
  { name: 'Boucherie & Charcuterie', icon: '🥩' },
];

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await addCategory(name.trim());
    if (res.success) {
      setName('');
      setSuccess('Rayon ajouté avec succès !');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'Erreur lors de l’ajout du rayon.');
    }
    setLoading(false);
  };

  const handleQuickAdd = async (presetName: string) => {
    setName(presetName);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le rayon "${catName}" ?`)) return;
    await deleteCategory(id);
  };

  return (
    <div className="categories-layout-grid">
      {/* Left Column: Creation Card */}
      <div className="category-creation-card">
        <div className="card-top-icon-title">
          <div className="icon-badge-teal">
            <FolderPlus size={20} />
          </div>
          <div>
            <h2 className="card-main-title">Nouveau Rayon</h2>
            <p className="card-sub-title">Définissez les départements de votre magasin</p>
          </div>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-box alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleAdd} className="category-form">
          <div className="form-group">
            <label className="form-label">
              Nom du Rayon / Département <span className="text-req">*</span>
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Boissons, Épicerie Fine..."
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            <Plus size={18} />
            <span>{loading ? 'Création en cours...' : 'Ajouter le rayon'}</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="category-presets-section">
          <div className="presets-header">
            <Sparkles size={15} color="#00796B" />
            <span>Rayons types recommandés</span>
          </div>
          <div className="presets-chips-grid">
            {PRESET_SUGGESTIONS.map((item) => (
              <button
                key={item.name}
                type="button"
                className="preset-chip-btn"
                onClick={() => handleQuickAdd(item.name)}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Existing Categories List */}
      <div className="categories-list-card">
        <div className="list-card-header">
          <div>
            <h2 className="card-main-title">Rayons Existants</h2>
            <p className="card-sub-title">
              {initialCategories.length} rayon(s) configuré(s) pour la caisse et l'inventaire
            </p>
          </div>
        </div>

        {initialCategories.length === 0 ? (
          <div className="categories-empty-view">
            <ShoppingBag size={48} color="#94A3B8" />
            <h3>Aucun rayon configuré</h3>
            <p>Utilisez le formulaire pour ajouter votre premier rayon de supermarché.</p>
          </div>
        ) : (
          <div className="categories-tiles-grid">
            {initialCategories.map((cat) => (
              <div key={cat.id} className="category-tile-card">
                <div className="tile-top-row">
                  <div className="tile-icon-box">
                    <Layers size={20} color="#00796B" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="tile-delete-btn"
                    title="Supprimer le rayon"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="tile-cat-name">{cat.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
