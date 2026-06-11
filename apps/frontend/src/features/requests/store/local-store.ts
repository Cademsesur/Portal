'use client';

import { useSyncExternalStore } from 'react';
import type { PurchaseRequestFormValues } from '../schemas/purchase-request-form.schema';

export type RequestStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface StoredRequest extends PurchaseRequestFormValues {
  id: string;
  reference: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  decisionComment?: string;
  decidedAt?: string;
}

const KEY = 'sesur:requests:v1';
const EMPTY: StoredRequest[] = [];

let cachedRaw: string | null = null;
let cachedSnapshot: StoredRequest[] = EMPTY;

function read(): StoredRequest[] {
  if (typeof window === 'undefined') return EMPTY;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = EMPTY;
    return cachedSnapshot;
  }
  try {
    cachedSnapshot = JSON.parse(raw) as StoredRequest[];
  } catch {
    cachedSnapshot = EMPTY;
  }
  return cachedSnapshot;
}

function write(data: StoredRequest[]): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(data);
  window.localStorage.setItem(KEY, serialized);
  // Sync cache immediately so the next read() returns the new snapshot
  cachedRaw = serialized;
  cachedSnapshot = data;
  window.dispatchEvent(new Event('sesur:requests:changed'));
}

function nextReference(existing: StoredRequest[]): string {
  const year = new Date().getFullYear();
  const yearMatches = existing.filter((r) => r.reference.includes(`-${year}-`));
  const seq = (yearMatches.length + 1).toString().padStart(3, '0');
  return `DA-${year}-${seq}`;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addRequest(payload: PurchaseRequestFormValues): StoredRequest {
  const existing = read();
  const now = new Date().toISOString();
  const stored: StoredRequest = {
    ...payload,
    id: genId(),
    reference: nextReference(existing),
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };
  write([stored, ...existing]);
  return stored;
}

export function updateRequestStatus(
  id: string,
  status: RequestStatus,
  comment?: string,
): StoredRequest | null {
  const existing = read();
  const idx = existing.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const next: StoredRequest = {
    ...existing[idx],
    status,
    updatedAt: now,
    decidedAt: status === 'APPROVED' || status === 'REJECTED' ? now : existing[idx].decidedAt,
    decisionComment: comment ?? existing[idx].decisionComment,
  };
  existing[idx] = next;
  write(existing);
  return next;
}

// ─────────────────────────────────────────────────────────────
// React hooks
// ─────────────────────────────────────────────────────────────

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => callback();
  window.addEventListener('sesur:requests:changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('sesur:requests:changed', handler);
    window.removeEventListener('storage', handler);
  };
}

export function useRequests(): StoredRequest[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useRequest(id: string | undefined): StoredRequest | undefined {
  const all = useRequests();
  if (!id) return undefined;
  return all.find((r) => r.id === id);
}
