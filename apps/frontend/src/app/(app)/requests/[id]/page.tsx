'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileSearch,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { BRAND, canValidate } from '@/lib/brand';
import {
  updateRequestStatus,
  useRequest,
  type RequestStatus,
  type StoredRequest,
} from '@/features/requests/store/local-store';
import { PURCHASE_TYPES } from '@/features/requests/schemas/purchase-request-form.schema';
import { StatusBadge } from '@/features/requests/components/status-badge';

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const request = useRequest(id);

  if (!user) return null;

  if (!request) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-10 text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: '#EEF0F8', color: BRAND }}
        >
          <FileSearch className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold" style={{ color: BRAND }}>
          Demande introuvable
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cette demande n'existe pas ou a été supprimée.
        </p>
        <Link
          href="/requests"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: BRAND }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux demandes
        </Link>
      </div>
    );
  }

  const canDecide = canValidate(user.role) && request.status !== 'APPROVED' && request.status !== 'REJECTED';
  const backHref = canValidate(user.role) ? '/approvals' : '/requests';

  const handleDecision = (decision: 'APPROVED' | 'REJECTED') => {
    const comment =
      decision === 'REJECTED'
        ? window.prompt('Motif du rejet (optionnel) :') ?? undefined
        : window.prompt('Commentaire (optionnel) :') ?? undefined;
    updateRequestStatus(request.id, decision, comment);
  };

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Demande {request.reference}
          </p>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: BRAND }}
          >
            Fiche de demande d'achat
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Soumise par {request.requesterName} le{' '}
            {new Date(request.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <StatusBadge status={request.status} />
          {request.decidedAt && (
            <span className="text-[11px] text-slate-400">
              Décision le{' '}
              {new Date(request.decidedAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </header>

      {canDecide && (
        <div
          className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: '#EEF0F8' }}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#EEF0F8', color: BRAND }}
            >
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">
                Décision DAF en attente
              </p>
              <p className="text-xs text-slate-500">
                Approuvez ou rejetez cette demande. Le demandeur en sera notifié.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDecision('REJECTED')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
            >
              <XCircle className="h-4 w-4" />
              Rejeter
            </button>
            <button
              type="button"
              onClick={() => handleDecision('APPROVED')}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: '#047857' }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approuver
            </button>
          </div>
        </div>
      )}

      <Timeline request={request} />

      <RequestSheet request={request} />
    </div>
  );
}

function Timeline({ request }: { request: StoredRequest }) {
  const steps: Array<{ label: string; date: string | null; state: 'done' | 'current' | 'upcoming' }> = [
    {
      label: 'Soumission',
      date: request.createdAt,
      state: 'done',
    },
    {
      label: 'Revue DAF',
      date: request.status === 'UNDER_REVIEW' ? request.updatedAt : null,
      state:
        request.status === 'SUBMITTED'
          ? 'current'
          : request.status === 'UNDER_REVIEW'
            ? 'current'
            : 'done',
    },
    {
      label:
        request.status === 'REJECTED'
          ? 'Rejetée'
          : request.status === 'APPROVED'
            ? 'Approuvée'
            : 'Décision',
      date: request.decidedAt ?? null,
      state:
        request.status === 'APPROVED' || request.status === 'REJECTED'
          ? 'done'
          : 'upcoming',
    },
  ];

  return (
    <ol className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
      {steps.map((s, idx) => {
        const color =
          s.state === 'done'
            ? request.status === 'REJECTED' && idx === 2
              ? '#B91C1C'
              : BRAND
            : s.state === 'current'
              ? BRAND
              : '#94A3B8';
        const Icon =
          s.state === 'done'
            ? request.status === 'REJECTED' && idx === 2
              ? XCircle
              : CheckCircle2
            : Clock;
        return (
          <li key={s.label} className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  s.state === 'done'
                    ? request.status === 'REJECTED' && idx === 2
                      ? '#FEE2E2'
                      : '#EEF0F8'
                    : s.state === 'current'
                      ? '#EEF0F8'
                      : '#F1F5F9',
                color,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-semibold text-slate-700">{s.label}</div>
              <div className="text-[11px] text-slate-500">
                {s.date ? new Date(s.date).toLocaleString('fr-FR') : '—'}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function RequestSheet({ request }: { request: StoredRequest }) {
  const selectedTypes = PURCHASE_TYPES.filter((t) =>
    request.purchaseTypes.includes(t.key),
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header
        className="px-6 py-5"
        style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #1A2350 100%)` }}
      >
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">
              Société d'État SESUR
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Fiche de demande d'achat
            </h2>
          </div>
          <div className="text-right text-[11px] text-white/80">
            <div>
              Référence :{' '}
              <span className="font-mono text-white">{request.reference}</span>
            </div>
            <div>
              Date :{' '}
              <span className="text-white">
                {new Date(request.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-6">
        <SheetSection index={1} title="Identification du demandeur">
          <SheetGrid>
            <SheetField label="Nom et prénom" value={request.requesterName} />
            <SheetField label="Service / Département" value={request.department} />
            <SheetField label="Fonction" value={request.jobTitle} />
            <SheetField label="Responsable hiérarchique" value={request.lineManager} />
          </SheetGrid>
        </SheetSection>

        <SheetSection index={2} title="Objet de la demande">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Type d'achat
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedTypes.map((t) => (
                <span
                  key={t.key}
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: '#EEF0F8', color: BRAND }}
                >
                  {t.label}
                </span>
              ))}
              {request.otherTypeDetail && (
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: '#EEF0F8', color: BRAND }}
                >
                  Autre : {request.otherTypeDetail}
                </span>
              )}
            </div>
          </div>
          <SheetField
            label="Description précise"
            value={request.description}
            multiline
            className="mt-4"
          />
        </SheetSection>

        <SheetSection index={3} title="Justification & impact">
          <SheetField label="Objectif de l'achat" value={request.objective} multiline />
          <SheetField
            label="Impact opérationnel"
            value={request.operationalImpact}
            multiline
            className="mt-4"
          />
          <SheetField
            label="Utilisateur final"
            value={request.endUser}
            className="mt-4"
          />
        </SheetSection>

        <SheetSection index={4} title="Détail des articles">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-3">#</th>
                  <th className="pb-2 pr-3">Description</th>
                  <th className="pb-2 pr-3">Qté</th>
                  <th className="pb-2 pr-3">Spécifications</th>
                  <th className="pb-2 pr-3">Délai</th>
                  <th className="pb-2">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {request.items.map((item, idx) => (
                  <tr key={idx} className="text-sm text-slate-700">
                    <td className="py-2 pr-3 font-mono text-xs text-slate-400">
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {item.description}
                    </td>
                    <td className="py-2 pr-3">{item.quantity}</td>
                    <td className="py-2 pr-3 text-slate-600">
                      {item.specifications || '—'}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {item.desiredDeadline || '—'}
                    </td>
                    <td className="py-2 text-slate-600">
                      {item.observations || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SheetSection>

        {request.decisionComment && (
          <div
            className="rounded-lg border-l-4 bg-slate-50 px-4 py-3"
            style={{
              borderColor: request.status === 'APPROVED' ? '#047857' : '#B91C1C',
            }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Commentaire de la DAF
            </div>
            <p className="mt-1 text-sm text-slate-700">{request.decisionComment}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function SheetSection({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
          style={{ backgroundColor: '#EEF0F8', color: BRAND }}
        >
          {index}
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </header>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function SheetGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function SheetField({
  label,
  value,
  multiline,
  className,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div
        className={`mt-1 text-sm text-slate-800 ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
