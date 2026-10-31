import { getStoreSettings } from '@/actions/settings';
import SettingsForm from './SettingsForm';
import ExportButton from './ExportButton';
import { Settings, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="settings-redesign-page">
      <div className="settings-hero-banner">
        <div className="settings-hero-top">
          <div className="settings-badge">
            <Settings size={14} />
            <span>Configuration Système</span>
          </div>
        </div>
        <h1 className="settings-hero-title">Paramètres du Supermarché</h1>
        <p className="settings-hero-subtitle">
          Personnalisez vos coordonnées, vos reçus de caisse et exportez vos données de gestion en toute sécurité.
        </p>
      </div>

      <div className="settings-content-wrapper">
        <SettingsForm initialData={settings} />

        <div style={{ marginTop: '2rem' }}>
          <ExportButton />
        </div>
      </div>
    </div>
  );
}
