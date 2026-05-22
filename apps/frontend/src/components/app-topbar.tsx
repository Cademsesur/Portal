'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, ChevronDown, LogOut, Search, UserRound } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { logout } from '@/features/auth/api/auth.api';
import { BRAND, ROLE_LABELS, type Role } from '@/lib/brand';

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
  // Cas particuliers : /requests/[id]
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-6 backdrop-blur lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          SESUR
        </span>
        <span className="h-4 w-px bg-slate-200" />
        <h1
          className="truncate text-base font-semibold tracking-tight"
          style={{ color: BRAND }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Rechercher…"
            className="w-64 rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
        >
          <Bell className="h-4 w-4" />
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: BRAND }}
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-left transition hover:border-slate-300"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: BRAND }}
            >
              {initials || 'U'}
            </span>
            <span className="hidden text-sm leading-tight sm:block">
              <span className="block max-w-[140px] truncate font-medium text-slate-800">
                {user?.displayName ?? 'Utilisateur'}
              </span>
              <span className="block text-[11px] text-slate-500">{roleLabel}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="text-sm font-medium text-slate-800">
                  {user?.displayName}
                </div>
                <div className="truncate text-xs text-slate-500">{user?.email}</div>
                <div
                  className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: '#EEF0F8', color: BRAND }}
                >
                  {roleLabel}
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4 text-slate-400" />
                Mon profil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50/60"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
