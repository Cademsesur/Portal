'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Search,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { canValidate } from '@/lib/brand';
import { Forbidden } from '@/components/forbidden';
import { useDecidedRequests } from '@/features/requests/hooks/use-decided-requests';
import { usePendingRequests } from '@/features/requests/hooks/use-pending-requests';
import type {
  PurchaseRequestSummary,
  RequestStatus,
} from '@/features/requests/api/requests.api';
import { StatusBadge } from '@/features/requests/components/status-badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type TabKey = 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: 'PENDING', label: 'À valider', icon: Clock },
  { key: 'APPROVED', label: 'Approuvées', icon: CheckCircle2 },
  { key: 'REJECTED', label: 'Rejetées', icon: XCircle },
];

export default function ApprovalsPage() {
  const { data: user } = useCurrentUser();
  const { data: pending = [], isLoading: pendingLoading } = usePendingRequests();
  const { data: decided = [], isLoading: decidedLoading } = useDecidedRequests(90);
  const [tab, setTab] = useState<TabKey>('PENDING');
  const [search, setSearch] = useState('');

  const approved = useMemo(
    () => decided.filter((r) => r.status === 'APPROVED'),
    [decided],
  );
  const rejected = useMemo(
    () => decided.filter((r) => r.status === 'REJECTED'),
    [decided],
  );

  const counts = {
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
  };

  const buckets: Record<TabKey, PurchaseRequestSummary[]> = {
    PENDING: pending,
    APPROVED: approved,
    REJECTED: rejected,
  };

  const filterRows = (rows: PurchaseRequestSummary[]): PurchaseRequestSummary[] => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.reference.toLowerCase().includes(term) ||
        r.requesterName.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term),
    );
  };

  if (!user) return null;
  if (!canValidate(user.role)) {
    return (
      <Forbidden
        title="Espace réservé à la DAF"
        message="Seul le Directeur Administratif et Financier peut consulter, approuver ou rejeter les demandes d'achat de l'organisation."
      />
    );
  }

  const loading = pendingLoading || decidedLoading;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          DAF · File de validation
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Validations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toutes les demandes d&apos;achat soumises par les collaborateurs SESUR.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="À valider"
          value={counts.pending}
          tone="brand"
          icon={Clock}
          loading={loading}
        />
        <MetricCard
          label="Approuvées"
          value={counts.approved}
          tone="success"
          icon={CheckCircle2}
          loading={loading}
        />
        <MetricCard
          label="Rejetées"
          value={counts.rejected}
          tone="danger"
          icon={XCircle}
          loading={loading}
        />
      </div>

      <Card>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              {TABS.map(({ key, label, icon: Icon }) => (
                <TabsTrigger key={key} value={key}>
                  <Icon />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Référence, demandeur…"
                className="h-9 w-60 pl-9"
              />
            </div>
          </div>

          {TABS.map(({ key }) => (
            <TabsContent key={key} value={key} className="mt-0">
              {loading ? (
                <TableSkeleton />
              ) : (
                <RequestsBucket
                  bucketKey={key}
                  rows={filterRows(buckets[key])}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}

function RequestsBucket({
  bucketKey,
  rows,
}: {
  bucketKey: TabKey;
  rows: PurchaseRequestSummary[];
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <ClipboardCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {bucketKey === 'PENDING'
            ? 'Aucune demande à valider'
            : bucketKey === 'APPROVED'
              ? 'Aucune demande approuvée'
              : 'Aucune demande rejetée'}
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {bucketKey === 'PENDING'
            ? 'Les demandes soumises par les collaborateurs apparaîtront ici.'
            : "L'historique apparaîtra dès la première décision."}
        </p>
      </div>
    );
  }
  return <RequestList rows={rows} />;
}

function RequestList({ rows }: { rows: PurchaseRequestSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-6 py-3">Référence</th>
            <th className="px-6 py-3">Demandeur</th>
            <th className="px-6 py-3">Service</th>
            <th className="px-6 py-3">Objet</th>
            <th className="px-6 py-3">Articles</th>
            <th className="px-6 py-3">Statut</th>
            <th className="px-6 py-3">Soumise le</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-muted/50">
              <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                <Link href={`/requests/${r.id}` as never}>{r.reference}</Link>
              </td>
              <td className="px-6 py-3 text-foreground">
                <Link href={`/requests/${r.id}` as never}>{r.requesterName}</Link>
              </td>
              <td className="px-6 py-3 text-muted-foreground">{r.department}</td>
              <td className="px-6 py-3 text-muted-foreground">
                <span className="line-clamp-1">{summarize(r.description)}</span>
              </td>
              <td className="px-6 py-3 text-muted-foreground">{r.itemCount}</td>
              <td className="px-6 py-3">
                <StatusBadge status={r.status as RequestStatus} />
              </td>
              <td className="px-6 py-3 text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-6 py-3 text-right">
                <Link
                  href={`/requests/${r.id}` as never}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Examiner
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function summarize(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 60)}…`;
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  tone: 'brand' | 'success' | 'danger';
  icon: LucideIcon;
  loading: boolean;
}) {
  const colors = {
    brand: 'bg-primary-soft text-primary-soft-foreground',
    success: 'bg-success-soft text-success-soft-foreground',
    danger: 'bg-destructive-soft text-destructive-soft-foreground',
  };

  return (
    <Card className="p-5 transition-all hover:-translate-y-px hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', colors[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {loading ? <Skeleton className="inline-block h-8 w-12 align-middle" /> : value}
      </div>
    </Card>
  );
}
