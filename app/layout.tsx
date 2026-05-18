import type { Metadata } from 'next';
import { AuthProvider } from '@/components/providers/auth-provider';
import { CurrentSiteProvider } from '@/components/providers/current-site-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEO Blog — Admin',
  description: 'Painel de gestão de publicações',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground antialiased">
        <QueryProvider>
          <AuthProvider>
            <CurrentSiteProvider>{children}</CurrentSiteProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
