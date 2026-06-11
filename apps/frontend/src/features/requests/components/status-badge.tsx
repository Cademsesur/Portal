import { BRAND } from '@/lib/brand';
import type { RequestStatus } from '../api/requests.api';

const STYLES: Record<RequestStatus, { bg: string; fg: string; label: string }> = {
  DRAFT: { bg: '#F1F5F9', fg: '#475569', label: 'Brouillon' },
  SUBMITTED: { bg: '#EEF0F8', fg: BRAND, label: 'Soumise' },
  UNDER_REVIEW: { bg: '#FEF3C7', fg: '#92400E', label: 'En revue' },
  APPROVED: { bg: '#D1FAE5', fg: '#065F46', label: 'Approuvée' },
  REJECTED: { bg: '#FEE2E2', fg: '#991B1B', label: 'Rejetée' },
  ORDERED: { bg: '#E0E7FF', fg: '#3730A3', label: 'Commandée' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const s = STYLES[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
