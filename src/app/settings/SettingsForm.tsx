'use client';

import React, { useState } from 'react';
import { updateStoreSettings } from '@/actions/settings';
import {
  Store,
  MapPin,
  Phone,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Save,
  Printer,
  Sparkles,
} from 'lucide-react';

interface SettingsData {
  storeName?: string | null;
  address?: string | null;
  phone?: string | null;
  receiptMessage?: string | null;
}

export default function SettingsForm({ initialData }: { initialData: SettingsData | null }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [storeName, setStoreName] = useState(initialData?.storeName || 'SUPERMARCHÉ ZEYNAR');
  const [address, setAddress] = useState(initialData?.address || 'Abidjan, Cocody Angré 8ème Tranche');
  const [phone, setPhone] = useState(initialData?.phone || '+225 07 00 00 00 00');
  const [receiptMessage, setReceiptMessage] = useState(
    initialData?.receiptMessage || 'Merci de votre visite et à très bientôt !'
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      await updateStoreSettings({
        storeName,
        address,
        phone,
        receiptMessage,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement');
    }
    setLoading(false);
  };

  return (
    <div className="settings-layout-grid">
      {/* Form Left */}
      <div className="settings-form-main">
        <form onSubmit={handleSubmit} className="settings-card">
          <div className="card-top-icon-title">
            <div className="icon-badge-teal">
              <Store size={20} />
            </div>
            <div>
              <h2 className="card-main-title">Coordonnées & En-tête</h2>
              <p className="card-sub-title">
                Ces informations figureront sur les factures et tickets de caisse.
              </p>
            </div>
          </div>

          {success && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={18} />
              <span>Paramètres du magasin enregistrés avec succès !</span>
            </div>
          )}

          {error && (
            <div className="alert-box alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label flex-label">
              <Store size={15} color="#00796B" />
              <span>Nom Commercial du Supermarché <span className="text-req">*</span></span>
            </label>
            <input
              type="text"
              name="storeName"
              className="form-control form-control-lg"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              placeholder="Ex: SUPERMARCHÉ ZEYNAR"
            />
          </div>

          <div className="form-grid grid-2">
            <div className="form-group">
              <label className="form-label flex-label">
                <MapPin size={15} color="#00796B" />
                <span>Adresse & Ville <span className="text-req">*</span></span>
              </label>
              <input
                type="text"
                name="address"
                className="form-control"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Ex: Abidjan, Cocody Angré"
              />
            </div>

            <div className="form-group">
              <label className="form-label flex-label">
                <Phone size={15} color="#00796B" />
                <span>Téléphone Contact <span className="text-req">*</span></span>
              </label>
              <input
                type="text"
                name="phone"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Ex: +225 07 00 00 00 00"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label flex-label">
              <Receipt size={15} color="#00796B" />
              <span>Message de Remerciement (Pied de ticket)</span>
            </label>
            <textarea
              name="receiptMessage"
              className="form-control"
              rows={3}
              value={receiptMessage}
              onChange={(e) => setReceiptMessage(e.target.value)}
              required
              placeholder="Ex: Les articles achetés ne sont ni repris ni échangés. Merci de votre confiance !"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-save btn-lg"
            disabled={loading}
          >
            <Save size={18} />
            <span>{loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}</span>
          </button>
        </form>
      </div>

      {/* Live Thermal Receipt Simulator on Right */}
      <div className="settings-receipt-preview-column">
        <div className="receipt-preview-header">
          <Printer size={16} color="#00796B" />
          <span>Aperçu Réel du Ticket de Caisse</span>
        </div>

        <div className="thermal-receipt-paper">
          <div className="receipt-sawtooth-top" />
          
          <div className="receipt-inner">
            <div className="receipt-store-name">{storeName || 'NOM DU MAGASIN'}</div>
            <div className="receipt-store-address">{address}</div>
            <div className="receipt-store-phone">Tél : {phone}</div>
            <div className="receipt-divider-dashed" />

            <div className="receipt-meta-row">
              <span>Date : {new Date().toLocaleDateString('fr-FR')}</span>
              <span>14:32</span>
            </div>
            <div className="receipt-meta-row">
              <span>Ticket : #00482</span>
              <span>Caisse 01</span>
            </div>
            <div className="receipt-divider-dashed" />

            {/* Sample items */}
            <div className="receipt-items-table">
              <div className="receipt-item-line">
                <span>Riz Jasmin 5kg</span>
                <span>4 500</span>
              </div>
              <div className="receipt-item-line">
                <span>Huile Dinor 1L x 2</span>
                <span>2 400</span>
              </div>
              <div className="receipt-item-line">
                <span>Coca-Cola 33cl x 3</span>
                <span>1 500</span>
              </div>
            </div>

            <div className="receipt-divider-dashed" />

            <div className="receipt-total-row">
              <span>TOTAL TTC</span>
              <span>8 400 FCFA</span>
            </div>
            <div className="receipt-sub-row">
              <span>Espèces : 10 000 FCFA</span>
              <span>Rendu : 1 600 FCFA</span>
            </div>

            <div className="receipt-divider-dashed" />

            <div className="receipt-footer-msg">{receiptMessage}</div>
            <div className="receipt-barcode-sim">||| | |||| || ||||| |||||</div>
          </div>

          <div className="receipt-sawtooth-bottom" />
        </div>
      </div>
    </div>
  );
}
