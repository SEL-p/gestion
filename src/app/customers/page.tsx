import { getCustomers } from '@/actions/customers';
import CustomerManager from './CustomerManager';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="customers-page-container">
      <header className="page-header-standard">
        <div>
          <div className="page-badge-standard">
            <Users size={16} />
            <span>Fichier & Fidélité</span>
          </div>
          <h1 className="page-title-standard">Gestion de la Clientèle</h1>
          <p className="page-subtitle-standard">
            Suivez les habitudes d'achat de vos clients et fidélisez-les avec des points cumulables.
          </p>
        </div>
      </header>

      <CustomerManager initialCustomers={customers} />
    </div>
  );
}
