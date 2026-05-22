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

export const RequestType = {
  HARDWARE: 'HARDWARE',
  SOFTWARE: 'SOFTWARE',
  SERVICE: 'SERVICE',
} as const;
export type RequestType = (typeof RequestType)[keyof typeof RequestType];

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
