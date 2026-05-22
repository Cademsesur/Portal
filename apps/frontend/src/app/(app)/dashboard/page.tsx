'use client';

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
import {
  BRAND,
  ROLE_LABELS,
  canManageUsers,
  canValidate,
  isEmployeeLike,
  type Role,
} from '@/lib/brand';

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  const firstName = user.displayName.split(/\s+/)[0] ?? user.displayName;
  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role;

  return (
    <div className="space-y-8">
      <Hero firstName={firstName} roleLabel={roleLabel} role={user.role} />

      {canValidate(user.role) ? (
        <DafDashboard />
      ) : (
        <EmployeeDashboard role={user.role} />
      )}
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
    <section
      className="relative overflow-hidden rounded-2xl px-8 py-9 text-white shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${BRAND} 0%, #1A2350 60%, #0F1838 100%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(126,158,255,0.35), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.08), transparent 70%)' }}
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
            <Link
              href="/requests/new"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-white/90"
              style={{ color: BRAND }}
            >
              <PlusCircle className="h-4 w-4" />
              Nouvelle demande
            </Link>
          )}
          {canManageUsers(role) && (
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              <UserPlus className="h-4 w-4" />
              Inviter un utilisateur
            </Link>
          )}
          {canValidate(role) && (
            <Link
              href="/approvals"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-white/90"
              style={{ color: BRAND }}
            >
              <ClipboardCheck className="h-4 w-4" />
              Voir les validations
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function EmployeeDashboard({ role }: { role: string }) {
  const stats: StatCardProps[] = [
    {
      label: 'Mes demandes en cours',
      value: '—',
      hint: 'En attente de validation DAF',
      icon: Clock,
      tone: 'brand',
    },
    {
      label: 'Approuvées',
      value: '—',
      hint: 'Cumul des 30 derniers jours',
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Rejetées',
      value: '—',
      hint: 'À reformuler si besoin',
      icon: XCircle,
      tone: 'danger',
    },
  ];

  return (
    <>
      <KpiGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Vos dernières demandes" action={
          <Link href="/requests" className="text-xs font-medium hover:underline" style={{ color: BRAND }}>
            Tout voir →
          </Link>
        }>
          <EmptyState
            icon={FileText}
            title="Aucune demande pour le moment"
            description="Initiez une demande d'achat — elle sera transmise à la DAF pour validation."
            cta={{ href: '/requests/new', label: 'Créer une demande' }}
          />
        </Card>

        <Card title="Actions rapides">
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
        </Card>
      </div>
    </>
  );
}

function DafDashboard() {
  const stats: StatCardProps[] = [
    {
      label: 'À valider',
      value: '—',
      hint: 'En attente de votre décision',
      icon: ClipboardCheck,
      tone: 'brand',
    },
    {
      label: 'Approuvées ce mois',
      value: '—',
      hint: 'Toutes demandes confondues',
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Rejetées ce mois',
      value: '—',
      hint: 'Motifs disponibles dans le détail',
      icon: XCircle,
      tone: 'danger',
    },
  ];

  return (
    <>
      <KpiGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="File d'arbitrage" action={
          <Link href="/approvals" className="text-xs font-medium hover:underline" style={{ color: BRAND }}>
            Ouvrir la file →
          </Link>
        }>
          <EmptyState
            icon={ClipboardCheck}
            title="Aucune demande en attente"
            description="Quand un collaborateur soumettra une demande, elle apparaîtra ici pour validation."
          />
        </Card>

        <Card title="Activité récente">
          <EmptyState
            icon={ShieldCheck}
            title="Pas encore d'activité"
            description="Les approbations et rejets récents s'afficheront ici."
            compact
          />
        </Card>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: 'brand' | 'success' | 'danger' | 'neutral';
}

const TONE_STYLES: Record<StatCardProps['tone'], { bg: string; fg: string }> = {
  brand: { bg: '#EEF0F8', fg: BRAND },
  success: { bg: '#ECFDF5', fg: '#047857' },
  danger: { bg: '#FEF2F2', fg: '#B91C1C' },
  neutral: { bg: '#F1F5F9', fg: '#334155' },
};

function KpiGrid({ stats }: { stats: StatCardProps[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone }: StatCardProps) {
  const t = TONE_STYLES[tone];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: t.bg, color: t.fg }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

function Card({
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
    <section
      className={`rounded-xl border border-slate-200 bg-white p-6 ${className ?? ''}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
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
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-center ${
        compact ? 'px-4 py-8' : 'px-6 py-12'
      }`}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: '#EEF0F8', color: BRAND }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          {cta.label}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
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
      className="group flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: '#EEF0F8', color: BRAND }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        <span className="block text-xs text-slate-500">{subtitle}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </Link>
  );
}
