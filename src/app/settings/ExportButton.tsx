'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    // Add a slight delay to allow the UI to update and then reset after download starts
    setTimeout(() => {
      window.location.href = '/api/export';
      setTimeout(() => setLoading(false), 2000); // Reset button after a short delay
    }, 100);
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', marginTop: '2rem' }}>
      <h2>Sauvegarde & Exportation</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--text-color)', opacity: 0.8 }}>
        Téléchargez une archive contenant l'intégralité de la base de données (au format JSON et CSV) ainsi que toutes les images de vos produits. Idéal pour traiter les données sur Excel ou faire une sauvegarde manuelle.
      </p>
      <button 
        onClick={handleExport} 
        disabled={loading}
        className="btn btn-secondary" 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Download size={20} />
        {loading ? 'Préparation de l\'archive...' : 'Télécharger toutes les données (ZIP)'}
      </button>
    </div>
  );
}
