'use client';

import { useState } from 'react';
import { addCategory, deleteCategory } from '@/actions/categories';
import { Trash2 } from 'lucide-react';

export default function CategoryManager({ initialCategories }: { initialCategories: any[] }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await addCategory(name);
    if (res.success) {
      setName('');
    } else {
      setError(res.error || 'Erreur');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    await deleteCategory(id);
  };

  return (
    <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3>Ajouter une Catégorie</h3>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="form-label">Nom de la catégorie</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="Ex: Boissons, Électronique..."
            />
          </div>
          {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          Catégories existantes
        </h3>
        
        {initialCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--slate-400)', border: '2px dashed var(--slate-200)', borderRadius: '12px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.22-1.82A2 2 0 0 0 8.53 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
            <p style={{ margin: 0, fontWeight: 500 }}>Aucune catégorie créée</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Ajoutez votre première catégorie à l'aide du formulaire.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {initialCategories.map(cat => (
              <div 
                key={cat.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '1.5rem', 
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--slate-200)',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--slate-50)';
                  e.currentTarget.style.borderColor = 'var(--slate-200)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontWeight: '600', color: 'var(--slate-800)', textAlign: 'center', marginBottom: '1rem' }}>
                  {cat.name}
                </div>
                <button 
                  onClick={() => handleDelete(cat.id)} 
                  className="btn btn-outline" 
                  style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', padding: '0.3rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  title="Supprimer la catégorie"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
