'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { BRAND } from '@/lib/brand';

interface ForbiddenProps {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function Forbidden({
  title = 'Accès non autorisé',
  message = "Votre rôle ne vous permet pas d'accéder à cette section. Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur SESUR.",
  backHref = '/dashboard',
  backLabel = 'Retour au tableau de bord',
}: ForbiddenProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}
      >
        <ShieldAlert className="h-8 w-8" />
      </span>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600">
        Erreur 403
      </p>
      <h1
        className="mt-2 text-2xl font-semibold tracking-tight"
        style={{ color: BRAND }}
      >
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
        {message}
      </p>
      <Link
        href={backHref as never}
        className="mt-8 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: BRAND }}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
    </div>
  );
}
