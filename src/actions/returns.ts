'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const MASTER_PIN = process.env.MASTER_PIN || '9999';

export async function processReturn(
  orderId: string,
  productId: string,
  quantityToReturn: number,
  adminPin: string,
  reason: string = ''
) {
  if (quantityToReturn <= 0) {
    return { success: false, error: 'La quantité doit être supérieure à 0.' };
  }

  // 1. Validate Admin PIN
  let approvedBy = 'Admin Master';
  if (adminPin !== MASTER_PIN) {
    const adminUser = await prisma.user.findUnique({ where: { pin: adminPin } });
    if (!adminUser || adminUser.role !== 'admin') {
      return { success: false, error: 'Code PIN invalide ou privilèges insuffisants.' };
    }
    approvedBy = adminUser.name;
  }

  try {
    // 2. Fetch the order item
    const orderItem = await prisma.orderItem.findFirst({
      where: { orderId, productId }
    });

    if (!orderItem) {
      return { success: false, error: 'Ce produit ne fait pas partie de cette commande.' };
    }

    // 3. Check already returned quantity for this product in this order
    const previousReturns = await prisma.return.findMany({
      where: { orderId, productId }
    });
    const alreadyReturnedQuantity = previousReturns.reduce((acc, ret) => acc + ret.quantity, 0);

    if (quantityToReturn + alreadyReturnedQuantity > orderItem.quantity) {
      return { success: false, error: `Impossible de retourner plus que la quantité achetée (${orderItem.quantity - alreadyReturnedQuantity} restants).` };
    }

    // Calculate refund amount based on the discounted priceTTC of the order item
    // Note: orderItem.priceTTC is the price per unit after item discount (as saved in POS checkout). Wait, let's verify POS checkout.
    // In POS checkout, priceTTC is product.priceTTC * discountMultiplier. So it is the unit price.
    // Also we need to apply the global order discount if any. Let's fetch the order.
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
       return { success: false, error: 'Commande introuvable.' };
    }
    
    const globalMultiplier = 1 - (order.discount / 100);
    const amountRefunded = (orderItem.priceTTC * globalMultiplier) * quantityToReturn;

    // 4. Perform Transaction
    await prisma.$transaction(async (tx) => {
      // Create Return Record
      await tx.return.create({
        data: {
          orderId,
          productId,
          quantity: quantityToReturn,
          amountTTC: amountRefunded,
          reason,
          approvedBy
        }
      });

      // Put stock back
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: quantityToReturn }
        }
      });
      
      // We don't change the Order total because it acts as the original receipt, but we have a Return record linked to it.
    });

    revalidatePath('/history');
    revalidatePath('/');
    revalidatePath('/products');
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors du traitement du retour.' };
  }
}

export async function processBlindReturn(
  productSku: string,
  quantityToReturn: number,
  adminPin: string,
  reason: string = ''
) {
  if (quantityToReturn <= 0) {
    return { success: false, error: 'La quantité doit être supérieure à 0.' };
  }

  // 1. Validate Admin PIN
  let approvedBy = 'Admin Master';
  if (adminPin !== MASTER_PIN) {
    const adminUser = await prisma.user.findUnique({ where: { pin: adminPin } });
    if (!adminUser || adminUser.role !== 'admin') {
      return { success: false, error: 'Code PIN invalide ou privilèges insuffisants.' };
    }
    approvedBy = adminUser.name;
  }

  try {
    // 2. Fetch the product by SKU
    const product = await prisma.product.findUnique({
      where: { sku: productSku }
    });

    if (!product) {
      return { success: false, error: 'Produit introuvable avec ce code (SKU).' };
    }

    // 3. Calculate refund amount based on current priceTTC
    const amountRefunded = product.priceTTC * quantityToReturn;

    // 4. Perform Transaction
    await prisma.$transaction(async (tx) => {
      // Create Return Record (without orderId)
      await tx.return.create({
        data: {
          productId: product.id,
          quantity: quantityToReturn,
          amountTTC: amountRefunded,
          reason,
          approvedBy
        }
      });

      // Put stock back
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: { increment: quantityToReturn }
        }
      });
    });

    revalidatePath('/history');
    revalidatePath('/');
    revalidatePath('/products');
    
    return { success: true, product: { name: product.name, amountRef: amountRefunded } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors du traitement du retour.' };
  }
}
