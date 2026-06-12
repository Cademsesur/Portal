import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="animate-fade-in-up">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <Compass className="h-8 w-8" />
        </span>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Erreur 404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Page introuvable
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          La page que vous cherchez n&apos;existe plus ou n&apos;a jamais existé.
          Retournez au tableau de bord pour continuer.
        </p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">
            <ArrowLeft />
            Retour au tableau de bord
          </Link>
        </Button>
      </div>
    </main>
  );
}
