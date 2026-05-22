import { apiFetch } from '@/lib/api-client';

export interface CurrentUserDto {
  id: string;
  email: string;
  displayName: string;
  role: string;
  departmentId: string | null;
  lastLoginAt: string | null;
}

export function fetchCurrentUser() {
  return apiFetch<CurrentUserDto>('/auth/me');
}

export function logout() {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}
