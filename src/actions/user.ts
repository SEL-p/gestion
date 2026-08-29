'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createUser(data: { name: string, pin: string, role: string }) {
  try {
    const existing = await prisma.user.findUnique({ where: { pin: data.pin } });
    if (existing) {
      return { success: false, error: 'Ce code PIN est déjà utilisé.' };
    }

    await prisma.user.create({
      data: {
        name: data.name,
        pin: data.pin,
        role: data.role
      }
    });

    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la création' };
  }
}

export async function updateUserPin(id: string, newPin: string) {
  try {
    const existing = await prisma.user.findUnique({ where: { pin: newPin } });
    if (existing && existing.id !== id) {
      return { success: false, error: 'Ce code PIN est déjà utilisé par un autre utilisateur.' };
    }

    await prisma.user.update({
      where: { id },
      data: { pin: newPin }
    });

    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la modification' };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la suppression' };
  }
}
