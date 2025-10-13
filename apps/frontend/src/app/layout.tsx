import { type Metadata } from 'next';
import { auth } from '@/auth';
import ThemeContextProvider from '../components/providers/ThemeProvider';
import { ClientLayoutShell } from './ClientLayoutShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { template: '%s | Rhesis AI', default: 'Rhesis AI' },
  description: 'Rhesis AI | OSS Gen AI Testing Platform',
  icons: { icon: '/logos/rhesis-logo-favicon.svg' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
      <html lang="en">
      <body>
      <ThemeContextProvider disableTransitionOnChange>
        <ClientLayoutShell session={session}>{children}</ClientLayoutShell>
      </ThemeContextProvider>
      </body>
      </html>
  );
}