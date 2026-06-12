'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { useCurrentUser } from '../hooks/use-current-user';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, error, isLoading } = useCurrentUser();

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      router.replace('/login');
    }
  }, [error, router]);

  if (isLoading || !data) {
    return <AuthSplash />;
  }
  return <>{children}</>;
}

function AuthSplash() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          SESUR FLOW
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Vérification de votre session…
        </p>
      </div>
    </div>
  );
}
