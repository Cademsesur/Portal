'use client';

import { useState } from 'react';
import { FileText, FileType2 } from 'lucide-react';
import {
  downloadRequestDocument,
  type DocumentFormat,
} from '@/features/requests/api/requests.api';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';

/**
 * Boutons d'export de la fiche pré-remplie (PDF + Word).
 * Affichés uniquement une fois la demande décidée.
 */
export function ExportButtons({
  requestId,
  reference,
}: {
  requestId: string;
  reference: string;
}) {
  const [pending, setPending] = useState<DocumentFormat | null>(null);

  const handleExport = async (format: DocumentFormat) => {
    if (pending) return;
    setPending(format);
    try {
      await downloadRequestDocument(requestId, reference, format);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Échec de l'export du document",
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        loading={pending === 'pdf'}
        disabled={pending !== null}
        onClick={() => handleExport('pdf')}
      >
        <FileText />
        Exporter PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        loading={pending === 'docx'}
        disabled={pending !== null}
        onClick={() => handleExport('docx')}
      >
        <FileType2 />
        Exporter Word
      </Button>
    </div>
  );
}
