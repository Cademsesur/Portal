'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { logout } from '@/features/auth/api/auth.api';
import { ROLE_LABELS, type Role } from '@/lib/brand';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notification-bell';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/requests': 'Mes demandes',
  '/requests/new': 'Nouvelle demande',
  '/approvals': 'Validations',
  '/admin/users': 'Utilisateurs',
  '/profile': 'Mon profil',
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (/^\/requests\/[^/]+$/.test(pathname) && !pathname.endsWith('/new')) {
    return 'Détail de la demande';
  }
  const entry = Object.entries(PAGE_TITLES).find(([href]) =>
    pathname.startsWith(href + '/'),
  );
  return entry ? entry[1] : 'Espace interne';
}

export function AppTopbar() {
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const initials = user
    ? user.displayName
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const roleLabel = user ? ROLE_LABELS[user.role as Role] ?? user.role : '';
  const title = resolveTitle(pathname);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/85 px-6 backdrop-blur lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          SESUR
        </span>
        <span className="h-4 w-px bg-border" />
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 text-left transition-colors hover:border-foreground/20 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials || 'U'}
              </span>
              <span className="hidden text-sm leading-tight sm:block">
                <span className="block max-w-[140px] truncate font-medium text-foreground">
                  {user?.displayName ?? 'Utilisateur'}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {roleLabel}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2.5">
              <div className="truncate text-sm font-medium text-foreground">
                {user?.displayName}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {user?.email}
              </div>
              <Badge variant="default" className="mt-2 uppercase tracking-wider">
                {roleLabel}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserRound /> Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={handleLogout}>
              <LogOut /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
