'use client';

import React, { useState } from 'react';
import { createUser, updateUserPin, deleteUser } from '@/actions/user';
import {
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Users,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  Briefcase,
  User,
} from 'lucide-react';

type UserData = {
  id: string;
  name: string;
  pin: string;
  role: string;
  createdAt: Date | string;
};

export default function UserClient({ initialUsers }: { initialUsers: UserData[] }) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [role, setRole] = useState('cashier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPin, setEditPin] = useState('');
  const [showEditPin, setShowEditPin] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await createUser({ name: name.trim(), pin: pin.trim(), role });
    if (res.success) {
      setName('');
      setPin('');
      setRole('cashier');
      setSuccess('Utilisateur créé avec succès !');
      setTimeout(() => window.location.reload(), 800);
    } else {
      setError(res.error || 'Erreur lors de la création');
    }
    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editPin) return setEditingId(null);
    if (!/^\d{4}$/.test(editPin)) {
      alert('Le code PIN doit comporter exactement 4 chiffres.');
      return;
    }
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

  const handleDelete = async (id: string, userName: string) => {
    if (confirm(`Voulez-vous vraiment supprimer l'utilisateur "${userName}" ?`)) {
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

  const rolesList = [
    {
      id: 'cashier',
      label: 'Caissier(ère)',
      desc: 'Accès Caisse POS uniquement',
      icon: UserCheck,
      color: '#00796B',
      bgColor: 'rgba(0, 121, 107, 0.08)',
      borderColor: 'rgba(0, 121, 107, 0.25)',
    },
    {
      id: 'manager',
      label: 'Gérant / Superviseur',
      desc: 'Caisse + Stocks & Tarifs',
      icon: Briefcase,
      color: '#D97706',
      bgColor: 'rgba(217, 119, 6, 0.08)',
      borderColor: 'rgba(217, 119, 6, 0.25)',
    },
    {
      id: 'admin',
      label: 'Administrateur',
      desc: 'Accès Total & Paramètres',
      icon: Shield,
      color: '#DC2626',
      bgColor: 'rgba(220, 38, 38, 0.08)',
      borderColor: 'rgba(220, 38, 38, 0.25)',
    },
  ];

  return (
    <div className="users-layout-grid">
      {/* Formulaire de création */}
      <div className="user-form-card">
        <div className="card-top-icon-title" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--slate-100)' }}>
          <div className="icon-badge-teal" style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #00796B, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(0, 121, 107, 0.25)' }}>
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="card-main-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Nouveau Membre du Personnel</h2>
            <p className="card-sub-title" style={{ fontSize: '0.82rem', color: 'var(--slate-500)', margin: 0 }}>Créez un profil avec code PIN de caisse sécurisé</p>
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

        <form onSubmit={handleCreate} className="user-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Nom complet */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.4rem' }}>
              Nom & Prénom <span className="text-req">*</span>
            </label>
            <div className="input-icon-wrapper-pro">
              <User size={18} className="field-icon-pro" />
              <input
                type="text"
                className="form-control-pro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Marc Kouamé"
              />
            </div>
          </div>

          {/* Code PIN */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.4rem' }}>
              Code PIN Caisse (4 chiffres) <span className="text-req">*</span>
            </label>
            <div className="input-icon-wrapper-pro">
              <KeyRound size={18} className="field-icon-pro" />
              <input
                type={showPin ? 'text' : 'password'}
                className="form-control-pro pin-input-field"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                }}
                required
                maxLength={4}
                pattern="\d{4}"
                placeholder="••••"
              />
              <button
                type="button"
                className="pin-toggle-btn"
                onClick={() => setShowPin(!showPin)}
                tabIndex={-1}
                title={showPin ? 'Masquer' : 'Afficher'}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sélection du Rôle (Cartes élégantes) */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--slate-700)', display: 'block', marginBottom: '0.5rem' }}>
              Rôle / Niveau d'Accès <span className="text-req">*</span>
            </label>
            <div className="role-cards-grid">
              {rolesList.map((r) => {
                const IconComponent = r.icon;
                const isSelected = role === r.id;
                return (
                  <div
                    key={r.id}
                    className={`role-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setRole(r.id)}
                    style={{
                      borderColor: isSelected ? r.color : 'var(--slate-200)',
                      backgroundColor: isSelected ? r.bgColor : 'var(--card-bg)',
                    }}
                  >
                    <div className="role-card-header">
                      <div className="role-card-icon" style={{ color: r.color, backgroundColor: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--slate-100)' }}>
                        <IconComponent size={18} />
                      </div>
                      <div className="role-card-title-wrap">
                        <div className="role-card-title" style={{ color: isSelected ? r.color : 'var(--slate-800)' }}>{r.label}</div>
                        <div className="role-card-desc">{r.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading || pin.length !== 4}
            style={{ marginTop: '0.5rem' }}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Création...' : 'Créer l’utilisateur'}</span>
          </button>
        </form>
      </div>

      {/* Liste des Utilisateurs */}
      <div className="users-list-card">
        <div className="list-card-header">
          <div>
            <h2 className="card-main-title">Personnel Enregistré</h2>
            <p className="card-sub-title">
              {users.length} compte(s) configuré(s) pour les accès caisse et gestion
            </p>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Code PIN</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty-row">
                    <Users size={36} color="#94A3B8" />
                    <p>Aucun utilisateur configuré.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="customer-avatar-cell">
                        <div className="avatar-circle">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="customer-cell-details">
                          <span className="customer-cell-name">{u.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="badge badge-admin">
                          <Shield size={12} />
                          <span>Admin</span>
                        </span>
                      ) : u.role === 'manager' ? (
                        <span className="badge badge-manager">
                          <Briefcase size={12} />
                          <span>Gérant</span>
                        </span>
                      ) : (
                        <span className="badge badge-cashier">
                          <UserCheck size={12} />
                          <span>Caissier</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === u.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <div className="input-icon-wrapper-pro" style={{ width: '130px' }}>
                            <Lock size={14} className="field-icon-pro" />
                            <input
                              type={showEditPin ? 'text' : 'password'}
                              maxLength={4}
                              placeholder="PIN"
                              value={editPin}
                              onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              className="form-control-pro pin-input-field"
                              style={{ paddingLeft: '2.2rem', paddingRight: '1.8rem', height: '36px', fontSize: '0.9rem' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="pin-toggle-btn"
                              onClick={() => setShowEditPin(!showEditPin)}
                              style={{ right: '6px' }}
                            >
                              {showEditPin ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdate(u.id)}
                            className="btn btn-primary btn-sm"
                            style={{ height: '36px' }}
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="btn btn-outline btn-sm"
                            style={{ height: '36px' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="pin-dots-styled">••••</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(u.id);
                              setEditPin('');
                            }}
                            className="btn-icon-subtle"
                            title="Modifier le code PIN"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id, u.name)}
                        className="btn-icon-danger"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
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
