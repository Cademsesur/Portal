'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
  type CreateInvitationInput,
} from '../api/invitations.api';

const QUERY_KEY = ['invitations'];

export function useInvitations() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listInvitations,
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvitationInput) => createInvitation(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useResendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
