'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCustomers() {
  return prisma.customer.findMany({
    orderBy: { totalSpent: 'desc' },
  });
}

export async function addCustomer(data: { name: string; phone?: string; code?: string }) {
  if (!data.name.trim()) return { success: false, error: 'Nom requis' };

  let customerCode = data.code?.trim()?.toUpperCase();
  if (!customerCode) {
    // Generate automatic unique loyalty card code e.g. CLT-8492
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    customerCode = `CLT-${randomNum}`;
  }

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        code: customerCode,
      },
    });

    revalidatePath('/customers');
    revalidatePath('/pos');
    return { success: true, customer: newCustomer };
  } catch (e: any) {
    if (e.code === 'P2002') {
      const target = e.meta?.target || [];
      if (Array.isArray(target) && target.includes('code')) {
        return { success: false, error: 'Ce code client / numéro de carte est déjà attribué.' };
      }
      return { success: false, error: 'Ce numéro de téléphone ou code est déjà utilisé.' };
    }
    return { success: false, error: 'Erreur lors de la création du client.' };
  }
}
