'use client';

import { useState } from 'react';
import { createUser, updateUserPin, deleteUser } from '@/actions/user';

type User = {
  id: string;
  name: string;
  pin: string;
  role: string;
  createdAt: Date;
};

export default function UserClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('cashier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPin, setEditPin] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await createUser({ name, pin, role });
    if (res.success) {
      setName('');
      setPin('');
      setRole('cashier');
      // On recharge la page pour voir les nouveaux utilisateurs (revalidatePath s'en occupe en partie, mais ici on force)
      window.location.reload();
    } else {
      setError(res.error || 'Erreur inconnue');
    }
    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editPin) return setEditingId(null);
    setLoading(true);
    const res = await updateUserPin(id, editPin);
    if (res.success) {
      setEditingId(null);
      setEditPin('');
      window.location.reload();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce caissier ?')) {
      setLoading(true);
      const res = await deleteUser(id);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
      
      {/* Formulaire de création */}
      <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--slate-900)' }}>Ajouter un utilisateur</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Nom</label>
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
            <label className="form-label">Code PIN</label>
            <input 
              type="text" 
              className="form-control" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              required 
              maxLength={4}
              pattern="\d{4}"
              title="Le code PIN doit contenir exactement 4 chiffres."
              placeholder="Ex: 1234"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rôle</label>
            <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
              <option value="cashier">Caissier</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Création...' : 'Créer l\'utilisateur'}
          </button>
        </form>
      </div>

      {/* Liste des utilisateurs */}
      <div style={{ gridColumn: 'span 2' }}>
        <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--slate-200)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Nom</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Rôle</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Code PIN</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--slate-400)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>Aucun utilisateur créé</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Le PIN Administrateur (9999) fonctionne par défaut.</p>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr 
                    key={user.id} 
                    style={{ borderBottom: '1px solid var(--slate-100)', transition: 'background-color 0.2s ease', cursor: 'default' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--slate-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--slate-900)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-600)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-success'}`}>
                        {user.role === 'admin' ? 'Admin' : 'Caissier'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {editingId === user.id ? (
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editPin} 
                          onChange={e => setEditPin(e.target.value)} 
                          maxLength={4}
                          placeholder="Nouveau PIN"
                          style={{ width: '120px', padding: '0.4rem', fontSize: '0.9rem' }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: 'var(--slate-600)', letterSpacing: '2px' }}>
                          ••••
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {editingId === user.id ? (
                          <>
                            <button onClick={() => handleUpdate(user.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Valider</button>
                            <button onClick={() => { setEditingId(null); setEditPin(''); }} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Annuler</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(user.id); setEditPin(''); }} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>📝 Modifier PIN</button>
                            <button onClick={() => handleDelete(user.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>🗑️ Supprimer</button>
                          </>
                        )}
                      </div>
                    </td>
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
