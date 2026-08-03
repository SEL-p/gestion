'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const MASTER_PIN = process.env.MASTER_PIN || '9999';

export async function loginWithPin(pin: string) {
  let role = '';
  let userName = 'Admin';
  let userId = 'admin';

  // Vérification du PIN Maître (Toujours valide pour l'Admin)
  if (pin === MASTER_PIN) {
    role = 'admin';
  } else {
    // Vérification en base de données
    const user = await prisma.user.findUnique({
      where: { pin }
    });

    if (!user) {
      throw new Error("Code PIN incorrect");
    }
    role = user.role;
    userName = user.name;
    userId = user.id;
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });
  
  if (userName) {
    cookieStore.set('auth_name', userName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
  }
  
  cookieStore.set('auth_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
  
  return { success: true, role };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_role');
  redirect('/login');
}
