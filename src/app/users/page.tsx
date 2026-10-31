import { getUsers } from '@/actions/user';
import UserClient from './UserClient';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="users-redesign-page">
      <div className="users-hero-banner">
        <div className="users-hero-top">
          <div className="users-badge">
            <Users size={14} />
            <span>Équipe & Sécurité</span>
          </div>
        </div>
        <h1 className="users-hero-title">Gestion des Utilisateurs</h1>
        <p className="users-hero-subtitle">
          Créez les accès de caisse, attribuez les rôles et protégez les sessions avec des codes PIN.
        </p>
      </div>

      <div className="users-content-wrapper">
        <UserClient initialUsers={users} />
      </div>
    </div>
  );
}
