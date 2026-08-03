import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Retour au catalogue</a>
      </div>

      <ProductForm />
    </div>
  );
}
