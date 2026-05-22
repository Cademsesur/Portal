'use client';

import { useQuery } from '@tanstack/react-query';
import { listMyRequests } from '../api/requests.api';

export function useMyRequests() {
  return useQuery({
    queryKey: ['requests', 'mine'],
    queryFn: listMyRequests,
  });
}
