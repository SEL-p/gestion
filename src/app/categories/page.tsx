import { getCategories } from '@/actions/categories';
import CategoryManager from './CategoryManager';
import { Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="categories-page-container">
      <header className="page-header-standard">
        <div>
          <div className="page-badge-standard">
            <Layers size={16} />
            <span>Organisation du Magasin</span>
          </div>
          <h1 className="page-title-standard">Gestion des Rayons & Départements</h1>
          <p className="page-subtitle-standard">
            Structurez votre catalogue par rayons pour faciliter la recherche en caisse et l'inventaire.
          </p>
        </div>
      </header>

      <CategoryManager initialCategories={categories} />
    </div>
  );
}
