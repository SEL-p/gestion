import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const products = await prisma.product.findMany({
      include: { images: true }
    });

    const headers = [
      'Référence (SKU)',
      'Nom du produit',
      'Catégorie',
      'Prix HT',
      'Prix TTC',
      'Stock',
      'Description Courte',
      'Nom Fichier Image'
    ];

    const rows = products.map((product) => {
      const mainImageName = product.images.length > 0 ? `${product.sku}.webp` : '';
      return [
        product.sku,
        product.name,
        product.category,
        product.priceHT,
        product.priceTTC,
        product.stock,
        product.shortDescription || '',
        mainImageName
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename="catalogue_produits.csv"');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.status(200).send("\uFEFF" + csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur');
  }
}
