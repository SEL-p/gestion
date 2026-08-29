import { getStoreSettings } from '@/actions/settings';
import SettingsForm from './SettingsForm';
import ExportButton from './ExportButton';
import { Settings, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="settings-page-container">
      <header className="page-header-standard">
        <div>
          <div className="page-badge-standard">
            <Settings size={16} />
            <span>Configuration Système</span>
          </div>
          <h1 className="page-title-standard">Paramètres du Supermarché</h1>
          <p className="page-subtitle-standard">
            Personnalisez vos reçus de caisse, votre nom commercial et exportez vos données de gestion.
          </p>
        </div>
      </header>

      <SettingsForm initialData={settings} />

      <div style={{ marginTop: '2.5rem' }}>
        <ExportButton />
      </div>
    </div>
  );
}
