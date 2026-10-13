'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { replaceProductImage } from '@/actions/product';
import { ImagePlus, RefreshCw } from 'lucide-react';

export default function ProductImageUpload({ productId }: { productId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData(event.currentTarget);
      await replaceProductImage(productId, formData);
      formRef.current?.reset();
      setMessage('Photo du produit mise à jour.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de mettre à jour la photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem', maxWidth: '360px' }}
    >
      <label htmlFor="product-image" className="form-label">
        Ajouter ou remplacer la photo
      </label>
      <input
        id="product-image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="form-control"
      />
      <button type="submit" className="btn btn-outline" disabled={loading}>
        {loading ? <RefreshCw size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        <span>{loading ? 'Envoi de la photo…' : 'Enregistrer la photo'}</span>
      </button>
      {message && <span role="status" style={{ color: 'var(--success-color)' }}>{message}</span>}
      {error && <span role="alert" style={{ color: 'var(--danger-color)' }}>{error}</span>}
    </form>
  );
}
