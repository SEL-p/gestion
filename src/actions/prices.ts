'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProductPrice(
  productId: string,
  data: { priceHT?: number; priceTTC?: number; purchasePrice?: number }
) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.priceHT !== undefined && { priceHT: data.priceHT }),
        ...(data.priceTTC !== undefined && { priceTTC: data.priceTTC }),
        ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
      },
    });

    revalidatePath('/prices');
    revalidatePath('/products');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkUpdatePrices(
  updates: Array<{ id: string; priceTTC: number; purchasePrice?: number }>
) {
  try {
    await Promise.all(
      updates.map((u) =>
        prisma.product.update({
          where: { id: u.id },
          data: {
            priceTTC: u.priceTTC,
            ...(u.purchasePrice !== undefined && { purchasePrice: u.purchasePrice }),
          },
        })
      )
    );

    revalidatePath('/prices');
    revalidatePath('/products');
    return { success: true, count: updates.length };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
