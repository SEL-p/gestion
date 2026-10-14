'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore } from 'lucide-react';
import { setProductArchived } from '@/actions/product';

interface ProductArchiveButtonProps {
  productId: string;
  productName: string;
  archived: boolean;
  redirectAfterArchive?: boolean;
}

export default function ProductArchiveButton({
  productId,
  productName,
  archived,
  redirectAfterArchive = false,
}: ProductArchiveButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const message = archived
      ? `Restaurer le produit « ${productName} » dans le catalogue et la caisse ?`
      : `Archiver « ${productName} » ? Il sera retiré du catalogue et de la caisse, mais ses ventes et retours resteront conservés.`;
    if (!window.confirm(message)) return;

    setBusy(true);
    setError(null);
    try {
      const result = await setProductArchived(productId, !archived);
      if (!result.success) {
        setError(result.error ?? 'La modification du produit a échoué.');
        return;
      }
      if (redirectAfterArchive && !archived) {
        router.push('/products/archived');
      } else {
        router.refresh();
      }
    } catch {
      setError('Impossible de modifier le produit. Réessayez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="btn btn-outline"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: archived ? 'var(--accent-color)' : 'var(--danger-color)',
          borderColor: archived ? 'var(--accent-color)' : 'var(--danger-color)',
        }}
      >
        {archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
        {busy ? 'Traitement…' : archived ? 'Restaurer' : 'Archiver le produit'}
      </button>
      {error && (
        <p role="alert" style={{ color: 'var(--danger-color)', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
