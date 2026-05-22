import { BRAND } from '@/lib/brand';
import type { RequestStatus } from '../store/local-store';

export function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, { bg: string; fg: string; label: string }> = {
    SUBMITTED: { bg: '#EEF0F8', fg: BRAND, label: 'Soumise' },
    UNDER_REVIEW: { bg: '#FEF3C7', fg: '#92400E', label: 'En revue' },
    APPROVED: { bg: '#D1FAE5', fg: '#065F46', label: 'Approuvée' },
    REJECTED: { bg: '#FEE2E2', fg: '#991B1B', label: 'Rejetée' },
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
