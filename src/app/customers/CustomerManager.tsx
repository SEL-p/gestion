'use client';

import { useState } from 'react';
import { addCustomer } from '@/actions/customers';
import { UserPlus } from 'lucide-react';

export default function CustomerManager({ initialCustomers }: { initialCustomers: any[] }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await addCustomer({ name, phone });
    if (res.success) {
      setName('');
      setPhone('');
    } else {
      setError(res.error || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem', gridColumn: 'span 1' }}>
        <h3><UserPlus size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Ajouter un Client</h3>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="form-label">Nom et Prénom</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="Ex: Jean Dupont"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input 
              type="text" 
              className="form-control" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="Ex: +225 0102030405"
            />
          </div>
          {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Ajout...' : 'Ajouter le client'}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '2rem', gridColumn: 'span 2' }}>
        <h3>Liste des Clients ({initialCustomers.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-500)' }}>
                <th style={{ padding: '1rem 0' }}>Nom</th>
                <th>Téléphone</th>
                <th>Total Dépensé</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {initialCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--slate-400)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>Aucun client enregistré</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Ajoutez des clients pour suivre leurs achats et points de fidélité.</p>
                  </td>
                </tr>
              ) : (
                initialCustomers.map(c => (
                  <tr 
                    key={c.id} 
                    style={{ borderBottom: '1px solid var(--slate-100)', transition: 'background-color 0.2s ease', cursor: 'default' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--slate-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-600)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>{c.phone || <span style={{ color: 'var(--slate-400)' }}>Non renseigné</span>}</td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>{c.totalSpent.toFixed(0)} FCFA</td>
                    <td style={{ padding: '1rem 0.5rem' }}><span className="badge badge-success">{c.points} pts</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
