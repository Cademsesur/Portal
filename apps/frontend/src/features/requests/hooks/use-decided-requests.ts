'use client';

import { useQuery } from '@tanstack/react-query';
import { listDecidedRequests } from '../api/requests.api';

export function useDecidedRequests(
  days = 30,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['requests', 'decided', days],
    queryFn: () => listDecidedRequests(days),
    enabled: options.enabled ?? true,
  });
}
