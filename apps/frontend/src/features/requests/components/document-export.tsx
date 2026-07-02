'use client';

import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { useDocumentAvailability } from '@/features/requests/hooks/use-document-availability';
import { ExportButtons } from '@/features/requests/components/export-buttons';
import { Button } from '@/components/ui/button';

/**
 * Boutons d'export, conditionnés à la présence des deux signatures
 * (demandeur + approbateur). À défaut, indique ce qui manque et propose à
 * l'utilisateur concerné d'ajouter la sienne.
 */
export function DocumentExport({
  requestId,
  reference,
  viewerIsApprover,
}: {
  requestId: string;
  reference: string;
  viewerIsApprover: boolean;
}) {
  const { data, isLoading } = useDocumentAvailability(requestId, true);

  if (isLoading || !data) return null;
  if (data.canExport) {
    return <ExportButtons requestId={requestId} reference={reference} />;
  }

  const missing: string[] = [];
  if (!data.requesterSigned) missing.push('du demandeur');
  if (!data.approverSigned) missing.push("de l'approbateur (DAF)");

  const myselfMissing = viewerIsApprover
    ? !data.approverSigned
    : !data.requesterSigned;

  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft/40 p-3 sm:items-end">
      <p className="text-xs text-warning-soft-foreground sm:text-right">
        Signature {missing.join(' et ')} requise pour exporter le document.
      </p>
      {myselfMissing && (
        <Button asChild size="sm" variant="outline">
          <Link href="/profile">
            <PenLine />
            Ajouter ma signature
          </Link>
        </Button>
      )}
    </div>
  );
}
