'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function openCashSession(cashierId: string, cashierName: string, openingBalance: number) {
  try {
    // Vérifier si une session est déjà ouverte
    const existing = await prisma.cashSession.findFirst({
      where: { cashierId, status: 'OPEN' }
    });
    if (existing) return { success: false, error: 'Une session est déjà ouverte.' };

    await prisma.cashSession.create({
      data: {
        cashierId,
        cashierName,
        openingBalance,
        status: 'OPEN'
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Erreur lors de l\'ouverture de caisse' };
  }
}

export async function getOpenSession(cashierId: string) {
  return prisma.cashSession.findFirst({
    where: { cashierId, status: 'OPEN' }
  });
}

export async function closeCashSession(sessionId: string, actualClosingBalance: number) {
  try {
    const session = await prisma.cashSession.findUnique({ where: { id: sessionId } });
    if (!session) return { success: false, error: 'Session introuvable' };

    // Calculer l'attendu: openingBalance + (totalTTC de toutes les commandes faites par ce cashier pendant la session) - retours ?
    // Pour l'instant on va juste enregistrer le montant déclaré, on améliorera le calcul attendu plus tard.
    const expectedClosingBalance = session.openingBalance; // TODO: + Ventes - Retours

    await prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
        actualClosingBalance,
        expectedClosingBalance, // Simplification pour le moment
        difference: actualClosingBalance - expectedClosingBalance
      }
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: 'Erreur lors de la fermeture de caisse' };
  }
}
