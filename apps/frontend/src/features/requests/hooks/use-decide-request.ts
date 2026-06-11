'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { decideRequest, type DecideRequestPayload } from '../api/requests.api';

export function useDecideRequest(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DecideRequestPayload) => decideRequest(id as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
