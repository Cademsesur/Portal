'use client';

import { useMemo } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  PlusCircle,
  ShieldCheck,
  UserPlus,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useMyRequests } from '@/features/requests/hooks/use-my-requests';
import { usePendingRequests } from '@/features/requests/hooks/use-pending-requests';
import { useDecidedRequests } from '@/features/requests/hooks/use-decided-requests';
import { StatusBadge } from '@/features/requests/components/status-badge';
import type {
  PurchaseRequestSummary,
  RequestStatus,
} from '@/features/requests/api/requests.api';
import {
  ROLE_LABELS,
  canManageUsers,
  canValidate,
  isEmployeeLike,
  type Role,
} from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  const firstName = user.displayName.split(/\s+/)[0] ?? user.displayName;
  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <Hero firstName={firstName} roleLabel={roleLabel} role={user.role} />

      {canValidate(user.role) ? <DafDashboard /> : <EmployeeDashboard role={user.role} />}
    </div>
  );
}

function Hero({
  firstName,
  roleLabel,
  role,
}: {
  firstName: string;
  roleLabel: string;
  role: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 px-8 py-9 text-primary-foreground shadow-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, hsl(190 90% 60% / 0.35), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, hsl(0 0% 100% / 0.08), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur">
            {roleLabel}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Bonjour {firstName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
            {canValidate(role)
              ? 'Voici les demandes d’achat qui attendent votre arbitrage et l’activité récente de l’organisation.'
              : 'Voici l’état de vos demandes d’achat et les actions rapides à votre disposition.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isEmployeeLike(role) && (
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <Link href="/requests/new">
                <PlusCircle />
                Nouvelle demande
              </Link>
            </Button>
          )}
          {canManageUsers(role) && (
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/15"
            >
              <Link href="/admin/users">
                <UserPlus />
                Inviter un utilisateur
              </Link>
            </Button>
          )}
          {canValidate(role) && (
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <Link href="/approvals">
                <ClipboardCheck />
                Voir les validations
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function EmployeeDashboard({ role }: { role: string }) {
  const { data: requests = [], isLoading } = useMyRequests();

  const stats = useMemo(() => {
    const since30 = Date.now() - 30 * DAY_MS;
    return {
      pending: requests.filter(
        (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW',
      ).length,
      approved30: requests.filter(
        (r) => r.status === 'APPROVED' && isAfter(r.decidedAt, since30),
      ).length,
      rejected30: requests.filter(
        (r) => r.status === 'REJECTED' && isAfter(r.decidedAt, since30),
      ).length,
    };
  }, [requests]);

  const recent = requests.slice(0, 5);

  const cards: StatCardProps[] = [
    {
      label: 'Mes demandes en cours',
      value: stats.pending,
      hint: 'En attente de validation DAF',
      icon: Clock,
      tone: 'brand',
    },
    {
      label: 'Approuvées',
      value: stats.approved30,
      hint: 'Cumul des 30 derniers jours',
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Rejetées',
      value: stats.rejected30,
      hint: 'À reformuler si besoin',
      icon: XCircle,
      tone: 'danger',
    },
  ];

  return (
    <>
      <KpiGrid stats={cards} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Vos dernières demandes"
          action={
            <Link
              href="/requests"
              className="text-xs font-medium text-primary hover:underline"
            >
              Tout voir →
            </Link>
          }
        >
          {isLoading ? (
            <RequestListSkeleton />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune demande pour le moment"
              description="Initiez une demande d'achat — elle sera transmise à la DAF pour validation."
              cta={{ href: '/requests/new', label: 'Créer une demande' }}
            />
          ) : (
            <RecentRequestList rows={recent} />
          )}
        </SectionCard>

        <SectionCard title="Actions rapides">
          <div className="space-y-2">
            <QuickAction
              href="/requests/new"
              icon={PlusCircle}
              title="Nouvelle demande d'achat"
              subtitle="Matériel, logiciel ou service"
            />
            <QuickAction
              href="/requests"
              icon={FileText}
              title="Suivre mes demandes"
              subtitle="Statut, historique, approbations"
            />
            {canManageUsers(role) && (
              <QuickAction
                href="/admin/users"
                icon={UserPlus}
                title="Inviter un collaborateur"
                subtitle="Réservé aux super administrateurs"
              />
            )}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function DafDashboard() {
  const { data: pending = [], isLoading: pendingLoading } = usePendingRequests();
  const { data: decided = [], isLoading: decidedLoading } = useDecidedRequests(30);

  const stats = useMemo(() => {
    const startOfMonth = (() => {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    const inThisMonth = (r: PurchaseRequestSummary) => isAfter(r.decidedAt, startOfMonth);
    return {
      pending: pending.length,
      approvedMonth: decided.filter((r) => r.status === 'APPROVED' && inThisMonth(r)).length,
      rejectedMonth: decided.filter((r) => r.status === 'REJECTED' && inThisMonth(r)).length,
    };
  }, [pending, decided]);

  const queue = pending.slice(0, 5);
  const recentDecisions = decided.slice(0, 5);

  const cards: StatCardProps[] = [
    {
      label: 'À valider',
      value: stats.pending,
      hint: 'En attente de votre décision',
      icon: ClipboardCheck,
      tone: 'brand',
    },
    {
      label: 'Approuvées ce mois',
      value: stats.approvedMonth,
      hint: 'Toutes demandes confondues',
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Rejetées ce mois',
      value: stats.rejectedMonth,
      hint: 'Motifs disponibles dans le détail',
      icon: XCircle,
      tone: 'danger',
    },
  ];

  return (
    <>
      <KpiGrid stats={cards} isLoading={pendingLoading || decidedLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="File d'arbitrage"
          action={
            <Link
              href="/approvals"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ouvrir la file →
            </Link>
          }
        >
          {pendingLoading ? (
            <RequestListSkeleton />
          ) : queue.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Aucune demande en attente"
              description="Quand un collaborateur soumettra une demande, elle apparaîtra ici pour validation."
            />
          ) : (
            <RecentRequestList rows={queue} />
          )}
        </SectionCard>

        <SectionCard title="Activité récente">
          {decidedLoading ? (
            <RequestListSkeleton compact />
          ) : recentDecisions.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Pas encore d'activité"
              description="Les approbations et rejets récents s'afficheront ici."
              compact
            />
          ) : (
            <RecentRequestList rows={recentDecisions} dense />
          )}
        </SectionCard>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────────────────────

function isAfter(iso: string | null, sinceMs: number): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() >= sinceMs;
}

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone: 'brand' | 'success' | 'danger';
}

const TONE: Record<
  StatCardProps['tone'],
  { bg: string; fg: string }
> = {
  brand: { bg: 'bg-primary-soft', fg: 'text-primary' },
  success: { bg: 'bg-success-soft', fg: 'text-success' },
  danger: { bg: 'bg-destructive-soft', fg: 'text-destructive' },
};

function KpiGrid({
  stats,
  isLoading,
}: {
  stats: StatCardProps[];
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} isLoading={isLoading} />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  isLoading,
}: StatCardProps & { isLoading: boolean }) {
  const t = TONE[tone];
  return (
    <Card className="group relative overflow-hidden p-5 transition-all hover:-translate-y-px hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            t.bg,
            t.fg,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {isLoading ? <Skeleton className="inline-block h-8 w-12 align-middle" /> : value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}

function SectionCard({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function RecentRequestList({
  rows,
  dense,
}: {
  rows: PurchaseRequestSummary[];
  dense?: boolean;
}) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id}>
          <Link
            href={`/requests/${r.id}` as never}
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 -mx-2 transition-colors hover:bg-muted/60',
              dense ? 'py-2' : 'py-3',
            )}
          >
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {summarize(r.description)}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">{r.reference}</span>
                <span>·</span>
                <span>{r.requesterName}</span>
                <span>·</span>
                <span>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
              </span>
            </span>
            <StatusBadge status={r.status as RequestStatus} />
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/60" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RequestListSkeleton({ compact }: { compact?: boolean }) {
  const count = compact ? 3 : 4;
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function summarize(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 70) return trimmed;
  return `${trimmed.slice(0, 70)}…`;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { href: Route; label: string };
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border text-center',
        compact ? 'px-4 py-8' : 'px-6 py-12',
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      {cta && (
        <Button asChild size="sm" className="mt-4">
          <Link href={cta.href}>
            {cta.label}
            <ArrowUpRight />
          </Link>
        </Button>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: Route;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-border px-3 py-3 transition-all hover:-translate-y-px hover:border-foreground/15 hover:bg-muted/50 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
