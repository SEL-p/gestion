import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ArchivedProductsClient from '@/components/ArchivedProductsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Produits archivés',
};

export default async function ArchivedProductsPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('auth_role')?.value !== 'admin') {
    redirect('/products/list');
  }

  const products = await prisma.product.findMany({
    where: { archivedAt: { not: null } },
    include: { images: true },
    orderBy: { archivedAt: 'desc' },
  });

  return <ArchivedProductsClient products={products} />;
}
