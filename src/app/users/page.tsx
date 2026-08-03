import { getUsers } from '@/actions/user';
import UserClient from './UserClient';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ backgroundColor: 'var(--accent-color)', color: 'white', padding: '0.5rem', borderRadius: '12px', display: 'flex' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            Gestion des Caissiers
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>Créez et gérez les comptes et codes PIN de votre personnel.</p>
        </div>
      </header>
      
      <UserClient initialUsers={users} />
    </div>
  );
}
