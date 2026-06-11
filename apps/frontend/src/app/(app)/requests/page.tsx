'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  FileText,
  Plus,
  Search,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { BRAND, isEmployeeLike } from '@/lib/brand';
import { useMyRequests } from '@/features/requests/hooks/use-my-requests';
import type { RequestStatus } from '@/features/requests/api/requests.api';
import { StatusBadge } from '@/features/requests/components/status-badge';

const STATUS_FILTERS: Array<{ key: 'ALL' | RequestStatus; label: string }> = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'SUBMITTED', label: 'Soumises' },
  { key: 'UNDER_REVIEW', label: 'En revue' },
  { key: 'APPROVED', label: 'Approuvées' },
  { key: 'REJECTED', label: 'Rejetées' },
];

export default function RequestsPage() {
  const { data: user } = useCurrentUser();
  const { data: requests = [] } = useMyRequests();
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
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold" style={{ color: BRAND }}>
          Cette section n'est pas disponible pour votre rôle
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Seuls les collaborateurs peuvent soumettre des demandes d'achat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Espace collaborateur
          </p>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: BRAND }}
          >
            Mes demandes d'achat
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivez l'avancement de vos demandes et leurs validations DAF.
          </p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center gap-2 self-start rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </Link>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Référence, description…"
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState hasAny={requests.length > 0} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Référence</th>
                  <th className="px-6 py-3">Objet</th>
                  <th className="px-6 py-3">Articles</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Soumise le</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-slate-700">
                      <Link href={`/requests/${r.id}` as never} className="block">
                        {r.reference}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/requests/${r.id}` as never} className="block">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {summarize(r.description)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.purchaseTypes.length} type(s) sélectionné(s)
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      <Link href={`/requests/${r.id}` as never}>
                        {r.itemCount}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/requests/${r.id}` as never}
                        className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                        style={{ color: BRAND }}
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
      </div>
    </div>
  );
}

function summarize(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 80)}…`;
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: '#EEF0F8', color: BRAND }}
      >
        <FileText className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-800">
        {hasAny ? 'Aucun résultat' : 'Aucune demande pour le moment'}
      </h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        {hasAny
          ? 'Aucune demande ne correspond aux filtres actuels.'
          : "Lancez votre première demande d'achat — elle sera transmise à la DAF pour validation."}
      </p>
      {!hasAny && (
        <Link
          href="/requests/new"
          className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          Créer une demande
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

