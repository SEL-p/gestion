'use client';

import { useState } from 'react';
import { updateStoreSettings } from '@/actions/settings';

export default function SettingsForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    await updateStoreSettings({
      storeName: formData.get('storeName') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      receiptMessage: formData.get('receiptMessage') as string,
    });

    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit}>
      {success && <div style={{ color: 'var(--success-color)', marginBottom: '1rem', fontWeight: 'bold' }}>Paramètres mis à jour avec succès !</div>}
      
      <div className="form-group">
        <label className="form-label">Nom de la Boutique</label>
        <input type="text" name="storeName" className="form-control" defaultValue={initialData?.storeName} required />
      </div>

      <div className="form-group">
        <label className="form-label">Adresse Physique</label>
        <input type="text" name="address" className="form-control" defaultValue={initialData?.address} required />
      </div>

      <div className="form-group">
        <label className="form-label">Numéro de Téléphone</label>
        <input type="text" name="phone" className="form-control" defaultValue={initialData?.phone} required />
      </div>

      <div className="form-group">
        <label className="form-label">Message de fin sur le Ticket de Caisse</label>
        <textarea name="receiptMessage" className="form-control" defaultValue={initialData?.receiptMessage} required />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
      </button>
    </form>
  );
}
