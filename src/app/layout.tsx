import type { Metadata } from 'next';
import './globals.css';
import ResponsiveNavigation from '@/components/ResponsiveNavigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  let name = 'Supermarché POS';
  try {
    const settings = await prisma.storeSettings.findFirst();
    if (settings?.storeName) name = settings.storeName;
  } catch (e) {
    // Database connection fallback
  }

  return {
    title: name,
    description: `${name} - Logiciel de Caisse & Gestion Supermarché`,
    icons: {
      icon: [
        { url: '/logo.png', type: 'image/png' },
        { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      ],
      apple: '/icon-192.png',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;
  const userName = cookieStore.get('auth_name')?.value || 'Admin';

  let storeName = 'SUPERMARCHÉ ZEYNAR';
  try {
    const settings = await prisma.storeSettings.findFirst();
    if (settings?.storeName) {
      storeName = settings.storeName;
    }
  } catch (e) {
    // Database connection fallback
  }

  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#004D40" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body>
        <ThemeProvider>
          <div className="page-layout">
            {role && (
              <ResponsiveNavigation
                userRole={role}
                storeName={storeName}
                userName={userName}
              />
            )}
            <main className="main-content">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
