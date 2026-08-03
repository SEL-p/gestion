import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.storeSettings.findFirst();
  const name = settings?.storeName || 'Boutique POS';
  return {
    title: name,
    description: `${name} - Logiciel de Caisse & Gestion`,
  };
}

import { ThemeProvider } from '@/components/ThemeProvider';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;

  const settings = await prisma.storeSettings.findFirst();
  const storeName = settings?.storeName || 'Boutique POS';

  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="page-layout">
            {role === 'admin' && <Sidebar userRole={role} storeName={storeName} />}
            <main className="main-content">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
