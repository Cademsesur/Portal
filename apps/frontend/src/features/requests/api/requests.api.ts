import type { CreatePurchaseRequestDto } from '@sesur/shared';
import { apiFetch } from '@/lib/api-client';

export interface PurchaseRequestSummary {
  id: string;
  reference: string;
  title: string;
  status: string;
  estimatedBudget: number;
  currency: string;
  createdAt: string;
}

export function listMyRequests() {
  return apiFetch<PurchaseRequestSummary[]>('/purchase-requests/mine');
}

export function createRequest(dto: CreatePurchaseRequestDto) {
  return apiFetch<PurchaseRequestSummary>('/purchase-requests', {
    method: 'POST',
    json: dto,
  });
}
