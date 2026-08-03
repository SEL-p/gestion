'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCustomers() {
  return prisma.customer.findMany({
    orderBy: { totalSpent: 'desc' }
  });
}

export async function addCustomer(data: { name: string, phone: string }) {
  if (!data.name.trim()) return { success: false, error: 'Nom requis' };
  try {
    await prisma.customer.create({ 
      data: { 
        name: data.name.trim(),
        phone: data.phone.trim() || null
      } 
    });
    revalidatePath('/customers');
    return { success: true };
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Ce numéro de téléphone est déjà utilisé.' };
    return { success: false, error: 'Erreur lors de la création du client.' };
  }
}
