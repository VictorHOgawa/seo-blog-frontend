'use client';

import { cn } from '@/lib/utils';
import {
  Calendar,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Lightbulb,
  MessagesSquare,
  Send,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: string;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ideias', label: 'Ideias', icon: Lightbulb },
  { href: '/conteudos', label: 'Conteúdos', icon: FileText },
  { href: '/revisao', label: 'Revisão', icon: CheckSquare },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/publicacoes', label: 'Publicações', icon: Send },
  { href: '/prompts', label: 'Prompts', icon: MessagesSquare },
  { href: '/custos', label: 'Custos IA', icon: MessagesSquare },
  { href: '/sites', label: 'Sites', icon: Settings },
  { href: '/content-types', label: 'Tipos de Conteúdo', icon: Settings },
  { href: '/users', label: 'Usuários', icon: Users, adminOnly: true },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="px-6 py-4 border-b">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          SEO Blog
        </Link>
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items
          .filter((i) => !i.adminOnly || isAdmin)
          .map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.soon && (
                  <span className="text-[10px] uppercase tracking-wide opacity-60">
                    {item.soon}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">v0.1.0 · Fase 7</div>
    </aside>
  );
}
