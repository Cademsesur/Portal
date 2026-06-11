'use client';

import { useQuery } from '@tanstack/react-query';
import { listPendingRequests } from '../api/requests.api';

export function usePendingRequests() {
  return useQuery({
    queryKey: ['requests', 'pending'],
    queryFn: listPendingRequests,
  });
}
