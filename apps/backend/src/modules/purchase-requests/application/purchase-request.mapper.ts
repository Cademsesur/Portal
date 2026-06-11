import type { Approval, PurchaseRequest, PurchaseRequestItem } from '@prisma/client';

export interface PurchaseRequestItemDto {
  id: string;
  position: number;
  description: string;
  quantity: number;
  specifications: string;
  desiredDeadline: string;
  observations: string;
}

export interface PurchaseRequestSummary {
  id: string;
  reference: string;
  requesterName: string;
  department: string;
  description: string;
  purchaseTypes: string[];
  status: string;
  itemCount: number;
  createdAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
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

type RequestWithRelations = PurchaseRequest & {
  items: PurchaseRequestItem[];
  approvals: Approval[];
};

function latestDecision(approvals: Approval[]): Approval | undefined {
  return approvals.find((a) => a.decision !== 'PENDING' && a.decidedAt !== null);
}

export function toPurchaseRequestSummary(request: RequestWithRelations): PurchaseRequestSummary {
  const decided = latestDecision(request.approvals);
  return {
    id: request.id,
    reference: request.reference,
    requesterName: request.requesterName,
    department: request.department,
    description: request.description,
    purchaseTypes: request.purchaseTypes,
    status: request.status,
    itemCount: request.items.length,
    createdAt: request.createdAt.toISOString(),
    submittedAt: request.submittedAt?.toISOString() ?? null,
    decidedAt: decided?.decidedAt?.toISOString() ?? null,
  };
}

export function toPurchaseRequestDetail(request: RequestWithRelations): PurchaseRequestDetail {
  const decided = latestDecision(request.approvals);
  return {
    ...toPurchaseRequestSummary(request),
    jobTitle: request.jobTitle,
    lineManager: request.lineManager,
    otherTypeDetail: request.otherTypeDetail,
    objective: request.objective,
    operationalImpact: request.operationalImpact,
    endUser: request.endUser,
    estimatedBudget: request.estimatedBudget?.toString() ?? null,
    currency: request.currency,
    updatedAt: request.updatedAt.toISOString(),
    decisionComment: decided?.comment ?? null,
    items: request.items.map((item) => ({
      id: item.id,
      position: item.position,
      description: item.description,
      quantity: item.quantity,
      specifications: item.specifications,
      desiredDeadline: item.desiredDeadline,
      observations: item.observations,
    })),
  };
}
