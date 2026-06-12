'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileSearch,
  ShieldAlert,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { canValidate } from '@/lib/brand';
import { useRequest } from '@/features/requests/hooks/use-request';
import { useDecideRequest } from '@/features/requests/hooks/use-decide-request';
import type {
  PurchaseRequestDetail,
} from '@/features/requests/api/requests.api';
import { PURCHASE_TYPES } from '@/features/requests/schemas/purchase-request-form.schema';
import { StatusBadge } from '@/features/requests/components/status-badge';
import { DecisionModal } from '@/features/requests/components/decision-modal';
import { ApiError } from '@/lib/api-client';
import { Forbidden } from '@/components/forbidden';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

type TimelineState = 'done' | 'current' | 'upcoming';

export default function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { data: user } = useCurrentUser();
  const { data: request, isLoading, error } = useRequest(id);
  const decideMutation = useDecideRequest(id);
  const [pendingDecision, setPendingDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);

  if (!user) return null;
  if (isLoading) return null;

  if (error instanceof ApiError && error.status === 403) {
    return (
      <Forbidden
        title="Vous n'avez pas accès à cette demande"
        message="Seul le demandeur et la DAF peuvent consulter le détail d'une demande d'achat."
        backHref={canValidate(user.role) ? '/approvals' : '/requests'}
        backLabel="Retour"
      />
    );
  }

  if (!request) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center animate-fade-in-up">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <FileSearch className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-foreground">
          Demande introuvable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette demande n&apos;existe pas ou a été supprimée.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/requests">
            <ArrowLeft />
            Retour aux demandes
          </Link>
        </Button>
      </Card>
    );
  }

  const canDecide =
    canValidate(user.role) &&
    request.status !== 'APPROVED' &&
    request.status !== 'REJECTED';
  const backHref = canValidate(user.role) ? '/approvals' : '/requests';

  const confirmDecision = (comment: string | undefined) => {
    if (!pendingDecision) return;
    decideMutation.mutate(
      { decision: pendingDecision, comment },
      {
        onSuccess: () => {
          toast.success(
            pendingDecision === 'APPROVED' ? 'Demande approuvée' : 'Demande rejetée',
            {
              description: `${request.reference} — le demandeur a été notifié.`,
            },
          );
          setPendingDecision(null);
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError ? err.message : 'Échec de la décision',
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Demande {request.reference}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Fiche de demande d&apos;achat
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Soumise par {request.requesterName} le{' '}
            {new Date(request.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <StatusBadge status={request.status} />
          {request.decidedAt && (
            <span className="text-[11px] text-muted-foreground">
              Décision le {new Date(request.decidedAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </header>

      {canDecide && (
        <Card className="border-primary/20 bg-primary-soft/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Décision DAF en attente
                </p>
                <p className="text-xs text-muted-foreground">
                  Approuvez ou rejetez cette demande. Le demandeur en sera notifié.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive-outline"
                onClick={() => setPendingDecision('REJECTED')}
              >
                <XCircle />
                Rejeter
              </Button>
              <Button
                variant="success"
                onClick={() => setPendingDecision('APPROVED')}
              >
                <CheckCircle2 />
                Approuver
              </Button>
            </div>
          </div>
        </Card>
      )}

      {pendingDecision && (
        <DecisionModal
          decision={pendingDecision}
          requestReference={request.reference}
          isPending={decideMutation.isPending}
          onConfirm={confirmDecision}
          onClose={() => {
            if (!decideMutation.isPending) setPendingDecision(null);
          }}
        />
      )}

      <Timeline request={request} />
      <RequestSheet request={request} />
    </div>
  );
}

function Timeline({ request }: { request: PurchaseRequestDetail }) {
  const isRejected = request.status === 'REJECTED';
  const isDecided = request.status === 'APPROVED' || isRejected;

  const steps: Array<{
    label: string;
    date: string | null;
    state: TimelineState;
    failure?: boolean;
  }> = [
    {
      label: 'Soumission',
      date: request.createdAt,
      state: 'done',
    },
    {
      label: 'Revue DAF',
      date: request.status === 'UNDER_REVIEW' ? request.updatedAt : null,
      state:
        request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW'
          ? 'current'
          : 'done',
    },
    {
      label: isRejected ? 'Rejetée' : request.status === 'APPROVED' ? 'Approuvée' : 'Décision',
      date: request.decidedAt ?? null,
      state: isDecided ? 'done' : 'upcoming',
      failure: isRejected,
    },
  ];

  return (
    <Card className="grid gap-2 p-4 sm:grid-cols-3">
      {steps.map((s) => {
        const Icon: LucideIcon =
          s.state === 'done'
            ? s.failure
              ? XCircle
              : CheckCircle2
            : Clock;
        const dot = cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          s.state === 'done' && !s.failure && 'bg-primary-soft text-primary',
          s.state === 'done' && s.failure && 'bg-destructive-soft text-destructive',
          s.state === 'current' && 'bg-warning-soft text-warning-soft-foreground',
          s.state === 'upcoming' && 'bg-muted text-muted-foreground',
        );
        return (
          <li key={s.label} className="flex items-center gap-3 list-none">
            <span className={dot}>
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-semibold text-foreground">
                {s.label}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {s.date ? new Date(s.date).toLocaleString('fr-FR') : '—'}
              </div>
            </div>
          </li>
        );
      })}
    </Card>
  );
}

function RequestSheet({ request }: { request: PurchaseRequestDetail }) {
  const selectedTypes = PURCHASE_TYPES.filter((t) =>
    request.purchaseTypes.includes(t.key),
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 px-6 py-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">
              Société d&apos;État SESUR
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Fiche de demande d&apos;achat
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
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Type d&apos;achat
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedTypes.map((t) => (
                <Badge key={t.key} variant="default">
                  {t.label}
                </Badge>
              ))}
              {request.otherTypeDetail && (
                <Badge variant="default">Autre : {request.otherTypeDetail}</Badge>
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
          <SheetField label="Utilisateur final" value={request.endUser} className="mt-4" />
        </SheetSection>

        <SheetSection index={4} title="Détail des articles">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-3">#</th>
                  <th className="pb-2 pr-3">Description</th>
                  <th className="pb-2 pr-3">Qté</th>
                  <th className="pb-2 pr-3">Spécifications</th>
                  <th className="pb-2 pr-3">Délai</th>
                  <th className="pb-2">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {request.items.map((item, idx) => (
                  <tr key={idx} className="text-sm text-foreground">
                    <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="py-2 pr-3 font-medium">{item.description}</td>
                    <td className="py-2 pr-3">{item.quantity}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {item.specifications || '—'}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {item.desiredDeadline || '—'}
                    </td>
                    <td className="py-2 text-muted-foreground">
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
            className={cn(
              'rounded-lg border-l-4 bg-muted/40 px-4 py-3',
              request.status === 'APPROVED'
                ? 'border-success'
                : 'border-destructive',
            )}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Commentaire de la DAF
            </div>
            <p className="mt-1 text-sm text-foreground">{request.decisionComment}</p>
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
      <header className="flex items-center gap-3 border-b border-border pb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
          {index}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
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
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 text-sm text-foreground',
          multiline && 'whitespace-pre-wrap leading-relaxed',
        )}
      >
        {value}
      </div>
    </div>
  );
}
