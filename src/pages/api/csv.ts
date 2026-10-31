import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const products = await prisma.product.findMany({
      where: { archivedAt: null },
      include: { images: true }
    });

    const headers = [
      'Référence (SKU)',
      'Nom du produit',
      'Catégorie',
      'Coût d\'Achat Unitaire',
      'Prix HT',
      'Prix TTC',
      'Unités par Pack / Colis',
      'Stock Total (Pièces)',
      'Packs Complets',
      'Pièces Détachées',
      'Description Courte',
      'Nom Fichier Image'
    ];

    const rows = products.map((product) => {
      const mainImageName = product.images.length > 0 ? `${product.sku}.webp` : '';
      const unitsInPack = product.unitsPerCarton && product.unitsPerCarton > 1 ? product.unitsPerCarton : 1;
      const fullPacks = Math.floor(product.stock / unitsInPack);
      const looseUnits = product.stock % unitsInPack;

      return [
        product.sku,
        product.name,
        product.category,
        product.purchasePrice !== null && product.purchasePrice !== undefined ? product.purchasePrice : '',
        product.priceHT,
        product.priceTTC,
        product.unitsPerCarton || 1,
        product.stock,
        fullPacks,
        looseUnits,
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
