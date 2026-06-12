'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, FileText, Plus, Search } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { isEmployeeLike } from '@/lib/brand';
import { useMyRequests } from '@/features/requests/hooks/use-my-requests';
import type { RequestStatus } from '@/features/requests/api/requests.api';
import { StatusBadge } from '@/features/requests/components/status-badge';
import { Forbidden } from '@/components/forbidden';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: Array<{ key: 'ALL' | RequestStatus; label: string }> = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'SUBMITTED', label: 'Soumises' },
  { key: 'UNDER_REVIEW', label: 'En revue' },
  { key: 'APPROVED', label: 'Approuvées' },
  { key: 'REJECTED', label: 'Rejetées' },
];

export default function RequestsPage() {
  const { data: user } = useCurrentUser();
  const { data: requests = [], isLoading } = useMyRequests();
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]['key']>('ALL');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter !== 'ALL' && r.status !== filter) return false;
      if (!term) return true;
      return (
        r.reference.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.requesterName.toLowerCase().includes(term)
      );
    });
  }, [requests, filter, search]);

  if (!user) return null;
  if (!isEmployeeLike(user.role)) {
    return (
      <Forbidden
        title="Section réservée aux collaborateurs"
        message="Seuls les collaborateurs peuvent consulter et soumettre des demandes d'achat."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Espace collaborateur
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Mes demandes d&apos;achat
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez l&apos;avancement de vos demandes et leurs validations DAF.
          </p>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <Plus />
            Nouvelle demande
          </Link>
        </Button>
      </header>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    active
                      ? 'bg-primary-soft text-primary-soft-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Référence, description…"
              className="h-9 w-64 pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={requests.length > 0} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Référence</th>
                  <th className="px-6 py-3">Objet</th>
                  <th className="px-6 py-3">Articles</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Soumise le</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                      <Link href={`/requests/${r.id}` as never} className="block">
                        {r.reference}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/requests/${r.id}` as never} className="block">
                        <div className="font-medium text-foreground line-clamp-1">
                          {summarize(r.description)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.purchaseTypes.length} type(s) sélectionné(s)
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      <Link href={`/requests/${r.id}` as never}>{r.itemCount}</Link>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/requests/${r.id}` as never}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Voir
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function summarize(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 80)}…`;
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-3">
          <Skeleton className="h-3 w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <FileText className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-foreground">
        {hasAny ? 'Aucun résultat' : 'Aucune demande pour le moment'}
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {hasAny
          ? 'Aucune demande ne correspond aux filtres actuels.'
          : "Lancez votre première demande d'achat — elle sera transmise à la DAF pour validation."}
      </p>
      {!hasAny && (
        <Button asChild className="mt-5">
          <Link href="/requests/new">
            Créer une demande
            <ArrowUpRight />
          </Link>
        </Button>
      )}
    </div>
  );
}
