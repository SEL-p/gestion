import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const products = await prisma.product.findMany({
      include: { images: true }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="images_produits.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const uploadsDir = path.join(process.cwd(), 'public');
    
    for (const product of products) {
      if (product.images.length > 0) {
        const image = product.images[0];
        const filePath = path.join(uploadsDir, image.url);
        
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath);
          const zipFileName = `${product.sku}${ext}`;
          archive.file(filePath, { name: zipFileName });
        }
        
        for (let i = 1; i < product.images.length; i++) {
          const extraImage = product.images[i];
          const extraPath = path.join(uploadsDir, extraImage.url);
          if (fs.existsSync(extraPath)) {
            const ext = path.extname(extraPath);
            const extraZipFileName = `${product.sku}_${i + 1}${ext}`;
            archive.file(extraPath, { name: extraZipFileName });
          }
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).send('Erreur');
    }
  }
}
