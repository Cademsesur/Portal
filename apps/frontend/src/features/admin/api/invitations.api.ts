import { apiFetch } from '@/lib/api-client';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface InvitationDto {
  id: string;
  email: string;
  role: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  lastSentAt: string;
  resendCount: number;
  createdAt: string;
  invitedBy: { id: string; email: string; displayName: string };
}

export interface CreateInvitationInput {
  email: string;
  role: string;
}

export function listInvitations() {
  return apiFetch<InvitationDto[]>('/invitations');
}

export function createInvitation(input: CreateInvitationInput) {
  return apiFetch<InvitationDto>('/invitations', { method: 'POST', json: input });
}

export function resendInvitation(id: string) {
  return apiFetch<InvitationDto>(`/invitations/${id}/resend`, { method: 'POST' });
}

export function revokeInvitation(id: string) {
  return apiFetch<InvitationDto>(`/invitations/${id}`, { method: 'DELETE' });
}
