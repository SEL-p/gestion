'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface Customer {
  id: string;
  code?: string | null;
  name: string;
  phone?: string | null;
  totalSpent: number;
  points: number;
  debtBalance?: number;
  createdAt?: Date | string;
}

export default function CustomerManager({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'points'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

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

    if (res.success && res.customer) {
      const created = {
        ...res.customer,
        totalSpent: 0,
        points: 0,
        debtBalance: 0,
      };
      setCustomers((prev) => [created, ...prev]);
      setName('');
      setPhone('');
      setCode('');
      setSuccess(`Client "${res.customer.name}" enregistré avec le code ${res.customer.code} !`);
      setShowAddModal(false);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.error || 'Erreur lors de l’enregistrement du client.');
    }
    setLoading(false);
  };

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (filterType === 'debt') return (c.debtBalance || 0) > 0;
      if (filterType === 'points') return c.points > 0;
      return true;
    });
  }, [customers, search, filterType]);

  const totalClients = customers.length;
  const totalTurnover = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const totalPoints = customers.reduce((acc, c) => acc + (c.points || 0), 0);
  const totalDebt = customers.reduce((acc, c) => acc + (c.debtBalance || 0), 0);

  return (
    <div className="cust-redesign-page">
      {/* ── 1. Top Forest Teal Header ─────────────────────────────────────── */}
      <header className="cust-top-header">
        <div className="cust-header-left">
          <Link href="/pos" className="cust-back-btn" title="Retour caisse">
            ← <span>Caisse POS</span>
          </Link>
          <div>
            <h1 className="cust-main-title">Clients & Fidélité</h1>
            <span className="cust-count-sub">
              {totalClients} client(s) • Suivi des comptes & crédits
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="cust-btn-new-modal"
        >
          <UserPlus size={16} />
          <span>Nouveau Client</span>
        </button>
      </header>

      {/* ── Toast Alerts ─────────────────────────────────────────────────── */}
      {error && (
        <div className="cust-alert is-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="cust-alert is-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* ── 2. KPI Summary Cards ─────────────────────────────────────────── */}
      <section className="cust-kpis-grid">
        <div className="cust-kpi-card">
          <span className="cust-kpi-lbl">Clients Enregistrés</span>
          <strong className="cust-kpi-val text-dark">{totalClients}</strong>
          <span className="cust-kpi-hint">comptes actifs</span>
        </div>

        <div className="cust-kpi-card">
          <span className="cust-kpi-lbl">Volume Dépensé</span>
          <strong className="cust-kpi-val text-teal">
            {totalTurnover.toLocaleString('fr-FR')} F
          </strong>
          <span className="cust-kpi-hint">chiffre fidélisé</span>
        </div>

        <div className="cust-kpi-card">
          <span className="cust-kpi-lbl">Dette Globale en Cours</span>
          <strong className={`cust-kpi-val ${totalDebt > 0 ? 'text-danger' : 'text-success'}`}>
            {totalDebt.toLocaleString('fr-FR')} F
          </strong>
          <span className="cust-kpi-hint">à recouvrer</span>
        </div>
      </section>

      {/* ── 3. Search & Filters Bar ────────────────────────────────────────── */}
      <div className="cust-toolbar">
        <div className="cust-search-box">
          <Search size={18} className="cust-search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou code client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cust-search-input"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="cust-search-clear"
            >
              ×
            </button>
          )}
        </div>

        <div className="cust-filter-pills">
          <button
            type="button"
            className={`cust-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Tous ({customers.length})
          </button>
          <button
            type="button"
            className={`cust-pill ${filterType === 'debt' ? 'active' : ''}`}
            onClick={() => setFilterType('debt')}
          >
            Avec Dette ({customers.filter((c) => (c.debtBalance || 0) > 0).length})
          </button>
          <button
            type="button"
            className={`cust-pill ${filterType === 'points' ? 'active' : ''}`}
            onClick={() => setFilterType('points')}
          >
            Fidélité Active ({customers.filter((c) => c.points > 0).length})
          </button>
        </div>
      </div>

      {/* ── 4. Main Customers List (Cards for Mobile, Table for Desktop) ─── */}
      <main className="cust-content-section">
        {filteredCustomers.length === 0 ? (
          <div className="cust-empty-box">
            <Users size={40} color="#94A3B8" />
            <h3>Aucun client trouvé</h3>
            <p>Essayez avec un autre terme ou ajoutez un nouveau client fidèle.</p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="cust-empty-add-btn"
            >
              + Ajouter un client
            </button>
          </div>
        ) : (
          <div className="cust-cards-stack">
            {filteredCustomers.map((c) => {
              const hasDebt = (c.debtBalance || 0) > 0;
              const codeDisplay = c.code || `CLT-${c.id.slice(0, 4).toUpperCase()}`;

              return (
                <div key={c.id} className={`cust-item-card ${hasDebt ? 'has-debt' : ''}`}>
                  <div className="cust-card-top">
                    <div className="cust-avatar-circle">
                      {c.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="cust-card-identity">
                      <div className="cust-name-row">
                        <strong className="cust-name">{c.name}</strong>
                        <span className="cust-code-pill">{codeDisplay}</span>
                      </div>

                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="cust-phone-link">
                          <Phone size={13} />
                          <span>{c.phone}</span>
                        </a>
                      ) : (
                        <span className="cust-no-phone">Pas de téléphone</span>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="cust-card-metrics">
                    <div className="cust-metric-cell">
                      <span>Total Acheté</span>
                      <strong>{c.totalSpent.toLocaleString('fr-FR')} F</strong>
                    </div>

                    <div className="cust-metric-cell">
                      <span>Fidélité</span>
                      <strong className="text-amber">
                        <Award size={13} style={{ display: 'inline', marginRight: '2px' }} />
                        {c.points} pts
                      </strong>
                    </div>

                    <div className="cust-metric-cell">
                      <span>Dette en cours</span>
                      <strong className={hasDebt ? 'text-danger' : 'text-success'}>
                        {hasDebt ? `${c.debtBalance!.toLocaleString('fr-FR')} F` : '0 F'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── 5. Add Customer Modal ─────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="cust-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="cust-modal-card animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cust-modal-head">
              <h3>Enregistrer un Nouveau Client</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="cust-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAdd} className="cust-modal-form">
              <div className="cust-form-group">
                <label>Nom & Prénom du Client *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Kouamé Jean-Baptiste"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="cust-form-input"
                />
              </div>

              <div className="cust-form-group">
                <label>Numéro de Téléphone (Optionnel)</label>
                <input
                  type="tel"
                  placeholder="Ex: +225 07 00 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="cust-form-input"
                />
              </div>

              <div className="cust-form-group">
                <label>Code Client ou N° Carte Fidélité</label>
                <input
                  type="text"
                  placeholder="Laissez vide pour génération automatique"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="cust-form-input"
                />
              </div>

              <div className="cust-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cust-btn-cancel"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="cust-btn-submit"
                >
                  {loading ? 'Création...' : 'Créer la Fiche Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
