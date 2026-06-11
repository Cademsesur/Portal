export const PURCHASE_REQUEST_SUBMITTED = 'purchase-request.submitted';
export const PURCHASE_REQUEST_DECIDED = 'purchase-request.decided';

export interface PurchaseRequestSubmittedEvent {
  requestId: string;
  reference: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  description: string;
}

export interface PurchaseRequestDecidedEvent {
  requestId: string;
  reference: string;
  decision: 'APPROVED' | 'REJECTED';
  comment: string | null;
  requesterId: string;
  requesterEmail: string;
  requesterName: string;
  approverName: string;
}
