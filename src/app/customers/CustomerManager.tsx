'use client';

import React, { useState } from 'react';
import { addCustomer } from '@/actions/customers';
import {
  UserPlus,
  Users,
  Search,
  Award,
  Phone,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  QrCode,
  Tag,
} from 'lucide-react';

interface Customer {
  id: string;
  code?: string | null;
  name: string;
  phone?: string | null;
  totalSpent: number;
  points: number;
  createdAt?: Date | string;
}

export default function CustomerManager({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
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

    const res = await addCustomer({
      name: name.trim(),
      phone: phone.trim() || undefined,
      code: code.trim() || undefined,
    });

    if (res.success) {
      setName('');
      setPhone('');
      setCode('');
      setSuccess(`Client "${res.customer?.name}" enregistré avec le code ${res.customer?.code} !`);
      setTimeout(() => setSuccess(''), 4000);
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setError(res.error || 'Erreur lors de l’enregistrement du client.');
    }
    setLoading(false);
  };

  const filteredCustomers = initialCustomers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q))
    );
  });

  const totalClients = initialCustomers.length;
  const totalTurnover = initialCustomers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const totalPoints = initialCustomers.reduce((acc, c) => acc + (c.points || 0), 0);

  return (
    <div className="customers-layout-grid">
      {/* Left Column: Register New Client */}
      <div className="customer-form-card">
        <div className="card-top-icon-title">
          <div className="icon-badge-teal">
            <UserPlus size={20} />
          </div>
          <div>
            <h2 className="card-main-title">Nouveau Client Fidèle</h2>
            <p className="card-sub-title">Attribuez un code unique ou une carte fidélité</p>
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

        <form onSubmit={handleAdd} className="customer-form">
          <div className="form-group">
            <label className="form-label">
              Nom & Prénom <span className="text-req">*</span>
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Kouamé Jean-Baptiste"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Code Client / N° Carte (Optionnel)</label>
            <div className="input-icon-wrapper">
              <CreditCard size={16} className="field-icon" />
              <input
                type="text"
                className="form-control input-with-left-icon"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: CLT-1001 (Laissez vide pour auto)"
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem', display: 'block' }}>
              💡 Si vous ne mettez rien, un code unique (ex: CLT-8492) sera généré automatiquement.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Numéro de Téléphone (Optionnel)</label>
            <div className="input-icon-wrapper">
              <Phone size={16} className="field-icon" />
              <input
                type="tel"
                className="form-control input-with-left-icon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +225 07 00 00 00 00"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Enregistrement...' : 'Enregistrer le client'}</span>
          </button>
        </form>

        {/* Loyalty Info Card */}
        <div className="loyalty-info-box">
          <Award size={20} color="#D97706" />
          <div>
            <strong>Programme Fidélité & Carte Client</strong>
            <p>Le code permet d&apos;identifier le client en caisse et de créditer automatiquement ses points.</p>
          </div>
        </div>
      </div>

      {/* Right Column: Customers List */}
      <div className="customers-list-card">
        {/* KPI Mini Row */}
        <div className="customer-kpi-mini-grid">
          <div className="kpi-mini-item">
            <span className="lbl">Clients Actifs</span>
            <span className="val">{totalClients}</span>
          </div>
          <div className="kpi-mini-item">
            <span className="lbl">Volume Acheté</span>
            <span className="val">{totalTurnover.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="kpi-mini-item">
            <span className="lbl">Points Cumulés</span>
            <span className="val text-amber">{totalPoints} pts</span>
          </div>
        </div>

        {/* Search */}
        <div className="customer-search-bar">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par Nom, Code client (ex: CLT-1001) ou Téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="customer-search-input"
          />
        </div>

        {/* Table */}
        <div className="table-responsive-wrapper">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Code Client</th>
                <th>Nom Client</th>
                <th>Téléphone</th>
                <th>Total Dépensé</th>
                <th>Fidélité</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty-row">
                    <Users size={36} color="#94A3B8" />
                    <p>Aucun client trouvé.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(0, 121, 107, 0.1)', color: '#00796B', fontFamily: 'monospace', fontSize: '0.82rem', padding: '0.35rem 0.6rem', fontWeight: 700 }}>
                        <QrCode size={13} style={{ marginRight: '0.3rem', display: 'inline' }} />
                        {c.code || `CLT-${c.id.slice(0, 4).toUpperCase()}`}
                      </span>
                    </td>
                    <td>
                      <div className="customer-avatar-cell">
                        <div className="avatar-circle">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="customer-cell-details">
                          <span className="customer-cell-name">{c.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.phone ? (
                        <span className="phone-badge">{c.phone}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <strong className="amount-text">
                        {c.totalSpent.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </td>
                    <td>
                      <span className="badge badge-points">
                        <Award size={12} />
                        <span>{c.points} pts</span>
                      </span>
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
