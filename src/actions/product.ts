'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export async function createProduct(formData: FormData) {
  let sku = formData.get('sku') as string;
  if (!sku) {
    sku = `PRD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
  
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const shortDescription = formData.get('shortDescription') as string;
  const longDescription = formData.get('longDescription') as string;
  const priceHT = parseFloat(formData.get('priceHT') as string);
  const priceTTC = parseFloat(formData.get('priceTTC') as string);
  const purchasePrice = parseFloat(formData.get('purchasePrice') as string) || null;
  const unitsPerCarton = parseInt(formData.get('unitsPerCarton') as string, 10) || 1;
  const stock = parseInt(formData.get('stock') as string, 10);
  const minStock = parseInt(formData.get('minStock') as string, 10) || 5;
  
  const images = formData.getAll('images') as File[];

  // Validation
  if (!sku || !name || !category || isNaN(priceHT) || isNaN(priceTTC) || isNaN(stock)) {
    throw new Error('Champs obligatoires manquants ou invalides');
  }

  // Check if SKU exists
  const existingProduct = await prisma.product.findUnique({ where: { sku } });
  if (existingProduct) {
    throw new Error('Un produit avec cette référence (SKU) existe déjà.');
  }

  // Process Images
  const processedImagePaths: string[] = [];
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const image of images) {
    if (image.size === 0) continue; // Skip empty files
    
    const buffer = Buffer.from(await image.arrayBuffer());
    
    // Convert to webp and resize (optimize)
    // The name will be saved locally without SKU initially, but during export we will rename them.
    // However, to make it easier, let's just save it as [SKU]_[timestamp].webp
    const filename = `${sku}_${Date.now()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    await sharp(buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    processedImagePaths.push(`/uploads/${filename}`);
  }

  // Create Product in Database
  await prisma.product.create({
    data: {
      sku,
      name,
      category,
      shortDescription,
      longDescription,
      priceHT,
      priceTTC,
      purchasePrice,
      unitsPerCarton,
      stock,
      minStock,
      images: {
        create: processedImagePaths.map((url) => ({ url })),
      },
    },
  });

  revalidatePath('/');
  redirect('/');
}

export async function updateStock(productId: string, additionalStock: number) {
  if (additionalStock <= 0) throw new Error('La quantité à ajouter doit être supérieure à 0.');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error('Produit introuvable.');

  await prisma.product.update({
    where: { id: productId },
    data: { stock: product.stock + additionalStock },
  });

  revalidatePath('/products/[id]', 'page');
  revalidatePath('/');
  return { success: true };
}
