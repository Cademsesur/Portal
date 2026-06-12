'use client';

import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  Inbox,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useMyRequests } from '@/features/requests/hooks/use-my-requests';
import { usePendingRequests } from '@/features/requests/hooks/use-pending-requests';
import { canValidate } from '@/lib/brand';
import type { PurchaseRequestSummary } from '@/features/requests/api/requests.api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const RECENT_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

interface Notification {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  when: string;
  tone: 'pending' | 'approved' | 'rejected';
}

export function NotificationBell() {
  const { data: user } = useCurrentUser();
  const isDaf = canValidate(user?.role);

  const { data: pending = [] } = usePendingRequests({ enabled: isDaf });
  const { data: myRequests = [] } = useMyRequests({ enabled: !!user && !isDaf });

  const notifications = isDaf
    ? buildDafNotifications(pending)
    : buildEmployeeNotifications(myRequests);

  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
          className="relative rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold text-primary">
              {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="h-4 w-4" />
            </span>
            <p className="mt-2 text-sm font-medium text-foreground">
              Tout est à jour
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Aucune notification pour le moment.
            </p>
          </div>
        ) : (
          <ul className="max-h-[360px] overflow-y-auto">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </ul>
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Link
              href={isDaf ? '/approvals' : '/requests'}
              className="block px-3 py-2 text-center text-xs font-medium text-primary hover:bg-muted"
            >
              {isDaf ? 'Voir toutes les validations' : 'Voir mes demandes'} →
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon: LucideIcon =
    notification.tone === 'approved'
      ? CheckCircle2
      : notification.tone === 'rejected'
        ? XCircle
        : Clock;
  const iconClass = cn(
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
    notification.tone === 'approved' && 'bg-success-soft text-success-soft-foreground',
    notification.tone === 'rejected' && 'bg-destructive-soft text-destructive-soft-foreground',
    notification.tone === 'pending' && 'bg-warning-soft text-warning-soft-foreground',
  );
  return (
    <li>
      <Link
        href={notification.href as never}
        className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60"
      >
        <span className={iconClass}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {notification.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {notification.subtitle}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {notification.when}
          </p>
        </div>
      </Link>
    </li>
  );
}

function buildDafNotifications(pending: PurchaseRequestSummary[]): Notification[] {
  return pending.map<Notification>((r) => ({
    id: r.id,
    href: `/requests/${r.id}`,
    title: `Demande à valider — ${r.reference}`,
    subtitle: `${r.requesterName} (${r.department}) — ${truncate(r.description, 50)}`,
    when: formatRelative(r.submittedAt ?? r.createdAt),
    tone: 'pending',
  }));
}

function buildEmployeeNotifications(
  requests: PurchaseRequestSummary[],
): Notification[] {
  const since = Date.now() - RECENT_WINDOW_DAYS * DAY_MS;
  return requests
    .filter((r) => {
      if (r.status !== 'APPROVED' && r.status !== 'REJECTED') return false;
      if (!r.decidedAt) return false;
      return new Date(r.decidedAt).getTime() >= since;
    })
    .map<Notification>((r) => ({
      id: r.id,
      href: `/requests/${r.id}`,
      title:
        r.status === 'APPROVED'
          ? `Demande approuvée — ${r.reference}`
          : `Demande rejetée — ${r.reference}`,
      subtitle: truncate(r.description, 60),
      when: formatRelative(r.decidedAt!),
      tone: r.status === 'APPROVED' ? 'approved' : 'rejected',
    }));
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}
