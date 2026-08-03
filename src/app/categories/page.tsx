import { getCategories } from '@/actions/categories';
import CategoryManager from './CategoryManager';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ backgroundColor: 'var(--accent-color)', color: 'white', padding: '0.5rem', borderRadius: '12px', display: 'flex' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.22-1.82A2 2 0 0 0 8.53 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
            </span>
            Gestion des Catégories
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>Organisez vos produits en créant des rayons et catégories.</p>
        </div>
      </header>

      <CategoryManager initialCategories={categories} />
    </div>
  );
}
