'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';

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
    const filename = `${randomUUID()}.webp`;
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

export async function replaceProductImage(productId: string, formData: FormData) {
  const cookieStore = await cookies();
  if (cookieStore.get('auth_role')?.value !== 'admin') {
    throw new Error('Seul un administrateur peut modifier la photo d’un produit.');
  }

  if (!productId) throw new Error('Produit introuvable.');

  const image = formData.get('image');
  if (!(image instanceof File) || image.size === 0) {
    throw new Error('Sélectionnez une image à envoyer.');
  }
  if (image.size > 8 * 1024 * 1024) {
    throw new Error('La photo doit faire moins de 8 Mo.');
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
    throw new Error('Choisissez une image au format JPEG, PNG ou WebP.');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) throw new Error('Produit introuvable.');

  const filename = `${randomUUID()}.webp`;
  const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
  const buffer = Buffer.from(await image.arrayBuffer());

  await sharp(buffer)
    .rotate()
    .resize({ width: 1024, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.create({ data: { productId, url: `/uploads/${filename}` } });
    });
  } catch (error) {
    try {
      await fs.promises.unlink(filepath);
    } catch (cleanupError) {
      console.error('Impossible de supprimer une image produit non enregistrée :', cleanupError);
    }
    throw error;
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');
  revalidatePath('/products/list');
  revalidatePath('/pos');
  revalidatePath('/alerts');

  return { success: true };
}
