'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import {
  BRAND,
  canManageUsers,
  canValidate,
  isEmployeeLike,
} from '@/lib/brand';

interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
}

function buildNav(role: string | undefined): {
  main: NavItem[];
  admin: NavItem[];
  account: NavItem[];
} {
  const main: NavItem[] = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  ];

  if (isEmployeeLike(role)) {
    main.push({ href: '/requests', label: 'Mes demandes', icon: FileText });
  }
  if (canValidate(role)) {
    main.push({ href: '/approvals', label: 'Validations', icon: ClipboardCheck });
  }

  const admin: NavItem[] = [];
  if (canManageUsers(role)) {
    admin.push({ href: '/admin/users', label: 'Utilisateurs', icon: Users });
  }

  const account: NavItem[] = [
    { href: '/profile', label: 'Mon profil', icon: User },
  ];

  return { main, admin, account };
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const sections = buildNav(user?.role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <Image
          src="/logos/logo.png"
          alt="SESUR"
          width={120}
          height={36}
          priority
          className="h-9 w-auto"
        />
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ color: BRAND }}
        >
          FLOW
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <SidebarGroup label="Espace de travail" items={sections.main} pathname={pathname} />
        {sections.admin.length > 0 && (
          <SidebarGroup
            label="Administration"
            items={sections.admin}
            pathname={pathname}
            className="mt-6"
          />
        )}
        <SidebarGroup
          label="Compte"
          items={sections.account}
          pathname={pathname}
          className="mt-6"
        />
      </nav>

      <div className="border-t border-slate-200 px-6 py-4 text-[11px] text-slate-400">
        SESUR FLOW · v0.1.0
      </div>
    </aside>
  );
}

function SidebarGroup({
  label,
  items,
  pathname,
  className,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <li key={href}>
              <Link
                href={href}
                className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition"
                style={
                  active
                    ? { backgroundColor: '#EEF0F8', color: BRAND }
                    : undefined
                }
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r"
                    style={{ backgroundColor: BRAND }}
                  />
                )}
                <Icon
                  className="h-4 w-4"
                  style={
                    active ? { color: BRAND } : { color: 'rgb(100, 116, 139)' }
                  }
                />
                <span
                  className={
                    active
                      ? 'font-medium'
                      : 'text-slate-600 transition group-hover:text-slate-900'
                  }
                >
                  {itemLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
