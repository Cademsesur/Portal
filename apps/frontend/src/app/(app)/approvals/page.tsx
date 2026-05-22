'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Search,
  ShieldAlert,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { BRAND, canValidate } from '@/lib/brand';
import {
  useRequests,
  type RequestStatus,
  type StoredRequest,
} from '@/features/requests/store/local-store';
import { StatusBadge } from '@/features/requests/components/status-badge';

type TabKey = 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: 'PENDING', label: 'À valider', icon: Clock },
  { key: 'APPROVED', label: 'Approuvées', icon: CheckCircle2 },
  { key: 'REJECTED', label: 'Rejetées', icon: XCircle },
];

export default function ApprovalsPage() {
  const { data: user } = useCurrentUser();
  const requests = useRequests();
  const [tab, setTab] = useState<TabKey>('PENDING');
  const [search, setSearch] = useState('');

  const counts = useMemo(
    () => ({
      pending: requests.filter(
        (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW',
      ).length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
    }),
    [requests],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const byTab = requests.filter((r) => {
      if (tab === 'PENDING') return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW';
      return r.status === tab;
    });
    if (!term) return byTab;
    return byTab.filter(
      (r) =>
        r.reference.toLowerCase().includes(term) ||
        r.requesterName.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term),
    );
  }, [requests, tab, search]);

  if (!user) return null;

  if (!canValidate(user.role)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-10 text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: '#EEF0F8', color: BRAND }}
        >
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold" style={{ color: BRAND }}>
          Espace réservé à la DAF
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Seul le Directeur Administratif et Financier peut consulter, approuver
          ou rejeter les demandes d'achat de l'organisation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            DAF · File de validation
          </p>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: BRAND }}
          >
            Validations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Toutes les demandes d'achat soumises par les collaborateurs SESUR.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="À valider" value={String(counts.pending)} tone="brand" icon={Clock} />
        <MetricCard label="Approuvées" value={String(counts.approved)} tone="success" icon={CheckCircle2} />
        <MetricCard label="Rejetées" value={String(counts.rejected)} tone="danger" icon={XCircle} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
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
              placeholder="Référence, demandeur…"
              className="w-60 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: '#EEF0F8', color: BRAND }}
            >
              <ClipboardCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-slate-800">
              {tab === 'PENDING'
                ? 'Aucune demande à valider'
                : tab === 'APPROVED'
                  ? 'Aucune demande approuvée'
                  : 'Aucune demande rejetée'}
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              {tab === 'PENDING'
                ? 'Les demandes soumises par les collaborateurs apparaîtront ici.'
                : 'L\'historique apparaîtra dès la première décision.'}
            </p>
          </div>
        ) : (
          <RequestList rows={filtered} />
        )}
      </div>
    </div>
  );
}

function RequestList({ rows }: { rows: StoredRequest[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
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
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/60">
              <td className="px-6 py-3 font-mono text-xs text-slate-700">
                <Link href={`/requests/${r.id}` as never}>{r.reference}</Link>
              </td>
              <td className="px-6 py-3 text-slate-800">
                <Link href={`/requests/${r.id}` as never}>{r.requesterName}</Link>
              </td>
              <td className="px-6 py-3 text-slate-600">{r.department}</td>
              <td className="px-6 py-3 text-slate-600">
                <span className="line-clamp-1">{summarize(r.description)}</span>
              </td>
              <td className="px-6 py-3 text-slate-600">{r.items.length}</td>
              <td className="px-6 py-3">
                <StatusBadge status={r.status as RequestStatus} />
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

function MetricCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: 'brand' | 'success' | 'danger';
  icon: LucideIcon;
}) {
  const styles =
    tone === 'success'
      ? { bg: '#ECFDF5', fg: '#047857' }
      : tone === 'danger'
        ? { bg: '#FEF2F2', fg: '#B91C1C' }
        : { bg: '#EEF0F8', fg: BRAND };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: styles.bg, color: styles.fg }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}
