'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function processCheckout(
  items: { productId: string; quantity: number; discountPercent?: number }[],
  globalDiscountPercent: number = 0,
  customerId?: string
) {
  if (!items || items.length === 0) {
    throw new Error("Le panier est vide.");
  }

  // 1. Fetch current products to validate stock and prices
  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  if (products.length !== productIds.length) {
    throw new Error("Certains produits du panier n'existent plus.");
  }

  let totalHT = 0;
  let totalTTC = 0;

  const orderItemsData = items.map(item => {
    const product = products.find(p => p.id === item.productId)!;
    
    if (product.stock < item.quantity) {
      throw new Error(`Stock insuffisant pour le produit: ${product.name}`);
    }

    const itemDiscount = item.discountPercent || 0;
    const discountMultiplier = 1 - (itemDiscount / 100);

    // Apply item discount
    const itemTotalHT = (product.priceHT * item.quantity) * discountMultiplier;
    const itemTotalTTC = (product.priceTTC * item.quantity) * discountMultiplier;

    totalHT += itemTotalHT;
    totalTTC += itemTotalTTC;

    return {
      productId: product.id,
      quantity: item.quantity,
      priceHT: product.priceHT * discountMultiplier,
      priceTTC: product.priceTTC * discountMultiplier,
      discount: itemDiscount,
    };
  });

  // Apply global discount
  const globalMultiplier = 1 - (globalDiscountPercent / 100);
  const finalTotalHT = totalHT * globalMultiplier;
  const finalTotalTTC = totalTTC * globalMultiplier;

  let createdOrder;

  const cookieStore = await cookies();
  const cashierName = cookieStore.get('auth_name')?.value || 'Admin';

  // 2. Perform the transaction: Create order + order items + update stock
  await prisma.$transaction(async (tx) => {
    // Créer la commande
    createdOrder = await tx.order.create({
      data: {
        totalHT: finalTotalHT,
        totalTTC: finalTotalTTC,
        discount: globalDiscountPercent,
        cashierName: cashierName,
        customerId: customerId || null,
        items: {
          create: orderItemsData
        }
      }
    });

    // Mettre à jour les stocks
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    // Mettre à jour le client (points = 1 point pour chaque 1000 FCFA, etc)
    if (customerId) {
      const pointsEarned = Math.floor(finalTotalTTC / 1000);
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalSpent: { increment: finalTotalTTC },
          points: { increment: pointsEarned }
        }
      });
    }
  });

  revalidatePath('/');
  revalidatePath('/pos');
  
  return { success: true, orderId: createdOrder!.id };
}
