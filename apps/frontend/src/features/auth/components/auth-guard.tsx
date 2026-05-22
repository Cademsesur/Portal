'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
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
    return null;
  }
  return <>{children}</>;
}
