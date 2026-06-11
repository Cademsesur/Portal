export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  DAF: 'DAF',
  PROCUREMENT: 'PROCUREMENT',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RequestStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ORDERED: 'ORDERED',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const PurchaseType = {
  HARDWARE: 'HARDWARE',
  FURNITURE: 'FURNITURE',
  SUPPLIES: 'SUPPLIES',
  SERVICE: 'SERVICE',
  MAINTENANCE: 'MAINTENANCE',
  SOFTWARE: 'SOFTWARE',
  OTHER: 'OTHER',
} as const;
export type PurchaseType = (typeof PurchaseType)[keyof typeof PurchaseType];

export const ApprovalStep = {
  MANAGER: 'MANAGER',
  DAF: 'DAF',
  PROCUREMENT: 'PROCUREMENT',
} as const;
export type ApprovalStep = (typeof ApprovalStep)[keyof typeof ApprovalStep];

export const ApprovalDecision = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ApprovalDecision = (typeof ApprovalDecision)[keyof typeof ApprovalDecision];
