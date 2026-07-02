import type { CreatePurchaseRequestDto } from '@sesur/shared';
import { apiFetch, apiFetchBlob } from '@/lib/api-client';

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

export interface DocumentAvailability {
  decided: boolean;
  requesterSigned: boolean;
  approverSigned: boolean;
  canExport: boolean;
}

export function getDocumentAvailability(id: string) {
  return apiFetch<DocumentAvailability>(
    `/purchase-requests/${id}/document/availability`,
  );
}

export type DocumentFormat = 'pdf' | 'docx';

/**
 * Récupère la fiche pré-remplie (PDF ou Word) puis déclenche le téléchargement
 * navigateur. Le backend ne l'expose qu'après décision (approuvée/rejetée).
 */
export async function downloadRequestDocument(
  id: string,
  reference: string,
  format: DocumentFormat,
): Promise<void> {
  const blob = await apiFetchBlob(
    `/purchase-requests/${id}/document?format=${format}`,
  );
  const safeRef = reference.replace(/[^A-Za-z0-9._-]+/g, '-');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Demande_${safeRef}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
