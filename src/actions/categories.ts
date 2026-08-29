'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function addCategory(name: string) {
  if (!name.trim()) return { success: false, error: 'Nom invalide' };
  try {
    await prisma.category.create({ data: { name: name.trim() } });
    revalidatePath('/categories');
    return { success: true };
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Cette catégorie existe déjà' };
    return { success: false, error: 'Erreur lors de la création' };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath('/categories');
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Impossible de supprimer cette catégorie' };
  }
}
