'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DecisionModalProps {
  decision: 'APPROVED' | 'REJECTED';
  requestReference: string;
  isPending: boolean;
  onConfirm: (comment: string | undefined) => void;
  onClose: () => void;
}

export function DecisionModal({
  decision,
  requestReference,
  isPending,
  onConfirm,
  onClose,
}: DecisionModalProps) {
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, []);

  const isApprove = decision === 'APPROVED';
  const Icon = isApprove ? CheckCircle2 : XCircle;
  const title = isApprove ? 'Approuver la demande' : 'Rejeter la demande';
  const intro = isApprove
    ? `Vous êtes sur le point d'approuver la demande ${requestReference}. Le demandeur sera notifié par email.`
    : `Vous êtes sur le point de rejeter la demande ${requestReference}. Le demandeur sera notifié par email avec votre motif.`;
  const commentLabel = isApprove
    ? 'Commentaire (optionnel)'
    : 'Motif du rejet (optionnel)';
  const ctaLabel = isApprove ? 'Approuver' : 'Rejeter';
  const ctaVariant = isApprove ? 'success' : 'destructive';

  const handleSubmit = () => {
    const trimmed = comment.trim();
    onConfirm(trimmed || undefined);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div
            className={
              isApprove
                ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-success-soft text-success-soft-foreground'
                : 'flex h-11 w-11 items-center justify-center rounded-xl bg-destructive-soft text-destructive-soft-foreground'
            }
          >
            <Icon className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-3">{title}</DialogTitle>
          <DialogDescription>{intro}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-1.5">
          <Label htmlFor="decision-comment">{commentLabel}</Label>
          <Textarea
            id="decision-comment"
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isPending}
            rows={4}
            maxLength={2000}
            placeholder={
              isApprove
                ? 'Précisez les conditions, le budget alloué, etc.'
                : "Expliquez la raison du refus pour aider le demandeur à reformuler."
            }
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {comment.length}/2000
          </p>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            variant={ctaVariant}
            loading={isPending}
            onClick={handleSubmit}
          >
            {!isPending && <Icon />}
            {ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
