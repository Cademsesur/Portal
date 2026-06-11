'use client';

import { useQuery } from '@tanstack/react-query';
import { getRequest } from '../api/requests.api';

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['requests', 'detail', id],
    queryFn: () => getRequest(id as string),
    enabled: Boolean(id),
  });
}
