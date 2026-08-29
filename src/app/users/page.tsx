import { getUsers } from '@/actions/user';
import UserClient from './UserClient';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="users-page-container">
      <header className="page-header-standard">
        <div>
          <div className="page-badge-standard">
            <Users size={16} />
            <span>Équipe & Sécurité</span>
          </div>
          <h1 className="page-title-standard">Gestion des Utilisateurs & Caissiers</h1>
          <p className="page-subtitle-standard">
            Créez les accès de caisse, attribuez les rôles et protégez les sessions avec des codes PIN.
          </p>
        </div>
      </header>

      <UserClient initialUsers={users} />
    </div>
  );
}
