import { apiFetch } from '@/lib/api-client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** Récupère la signature de l'utilisateur courant (Blob), ou null si aucune. */
export async function getMySignature(): Promise<Blob | null> {
  const res = await fetch(`${API_URL}/users/me/signature`, {
    credentials: 'include',
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error('Impossible de charger la signature');
  const blob = await res.blob();
  return blob.size > 0 ? blob : null;
}

/** Enregistre / remplace la signature (PNG en data URL). */
export function setMySignature(image: string): Promise<void> {
  return apiFetch<void>('/users/me/signature', {
    method: 'PUT',
    json: { image },
  });
}

export function deleteMySignature(): Promise<void> {
  return apiFetch<void>('/users/me/signature', { method: 'DELETE' });
}
