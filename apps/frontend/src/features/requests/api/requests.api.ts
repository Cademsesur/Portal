import type { CreatePurchaseRequestDto } from '@sesur/shared';
import { apiFetch } from '@/lib/api-client';

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORDERED';

export interface PurchaseRequestSummary {
  id: string;
  reference: string;
  requesterName: string;
  department: string;
  description: string;
  purchaseTypes: string[];
  status: RequestStatus;
  itemCount: number;
  createdAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
}

export interface PurchaseRequestItemDto {
  id: string;
  position: number;
  description: string;
  quantity: number;
  specifications: string;
  desiredDeadline: string;
  observations: string;
}

export interface PurchaseRequestDetail extends PurchaseRequestSummary {
  jobTitle: string;
  lineManager: string;
  otherTypeDetail: string | null;
  objective: string;
  operationalImpact: string;
  endUser: string;
  estimatedBudget: string | null;
  currency: string;
  items: PurchaseRequestItemDto[];
  decisionComment: string | null;
  updatedAt: string;
}

export function listMyRequests() {
  return apiFetch<PurchaseRequestSummary[]>('/purchase-requests/mine');
}

export function listPendingRequests() {
  return apiFetch<PurchaseRequestSummary[]>('/purchase-requests/pending');
}

export function listDecidedRequests(days = 30) {
  return apiFetch<PurchaseRequestSummary[]>(`/purchase-requests/decided?days=${days}`);
}

export function getRequest(id: string) {
  return apiFetch<PurchaseRequestDetail>(`/purchase-requests/${id}`);
}

export function createRequest(dto: CreatePurchaseRequestDto) {
  return apiFetch<PurchaseRequestDetail>('/purchase-requests', {
    method: 'POST',
    json: dto,
  });
}

export interface DecideRequestPayload {
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
}

export function decideRequest(id: string, payload: DecideRequestPayload) {
  return apiFetch<PurchaseRequestDetail>(`/purchase-requests/${id}/decision`, {
    method: 'POST',
    json: payload,
  });
}
