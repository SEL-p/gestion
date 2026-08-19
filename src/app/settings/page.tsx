import { getStoreSettings } from '@/actions/settings';
import SettingsForm from './SettingsForm';
import ExportButton from './ExportButton';

export default async function SettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Paramètres de la Boutique</h1>
        <p>Gérez les informations de votre magasin qui apparaîtront sur les tickets de caisse.</p>
      </header>

      <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px' }}>
        <SettingsForm initialData={settings} />
      </div>

      <ExportButton />
    </div>
  );
}
