'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getStoreSettings() {
  let settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        storeName: 'ZEYNARMARKET',
        address: '123 Rue du Commerce, Ville',
        phone: '+225 00 00 00 00',
        receiptMessage: 'Merci de votre visite et à bientôt !'
      }
    });
  }
  return settings;
}

export async function updateStoreSettings(data: { storeName: string, address: string, phone: string, receiptMessage: string }) {
  let settings = await prisma.storeSettings.findFirst();
  if (settings) {
    await prisma.storeSettings.update({
      where: { id: settings.id },
      data
    });
  } else {
    await prisma.storeSettings.create({
      data
    });
  }
  revalidatePath('/');
  revalidatePath('/settings');
  revalidatePath('/pos/invoice/[id]', 'page');
  return { success: true };
}
