'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-20 text-center animate-fade-in-up">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive-soft text-destructive-soft-foreground">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-destructive">
        Erreur 403
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      <Button asChild className="mt-8">
        <Link href={backHref as never}>
          <ArrowLeft />
          {backLabel}
        </Link>
      </Button>
    </div>
  );
}
