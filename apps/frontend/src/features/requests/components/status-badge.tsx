import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { RequestStatus } from '../api/requests.api';

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  SUBMITTED: { label: 'Soumise', variant: 'default' },
  UNDER_REVIEW: { label: 'En revue', variant: 'warning' },
  APPROVED: { label: 'Approuvée', variant: 'success' },
  REJECTED: { label: 'Rejetée', variant: 'destructive' },
  ORDERED: { label: 'Commandée', variant: 'accent' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
