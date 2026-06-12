'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { BRAND } from '@/lib/brand';

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
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPending, onClose]);

  const isApprove = decision === 'APPROVED';
  const title = isApprove ? 'Approuver la demande' : 'Rejeter la demande';
  const intro = isApprove
    ? `Vous êtes sur le point d'approuver la demande ${requestReference}. Le demandeur sera notifié par email.`
    : `Vous êtes sur le point de rejeter la demande ${requestReference}. Le demandeur sera notifié par email avec votre motif.`;
  const commentLabel = isApprove ? 'Commentaire (optionnel)' : 'Motif du rejet (optionnel)';
  const ctaLabel = isApprove ? 'Approuver' : 'Rejeter';
  const ctaIcon = isApprove ? CheckCircle2 : XCircle;
  const ctaStyle = isApprove
    ? { backgroundColor: '#047857' }
    : { backgroundColor: '#B91C1C' };

  const handleSubmit = () => {
    const trimmed = comment.trim();
    onConfirm(trimmed || undefined);
  };

  const CtaIcon = ctaIcon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Fermer"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-6">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: isApprove ? '#ECFDF5' : '#FEF2F2',
              color: isApprove ? '#047857' : '#B91C1C',
            }}
          >
            <CtaIcon className="h-5 w-5" />
          </div>
          <h2
            id="decision-modal-title"
            className="mt-4 text-lg font-semibold tracking-tight"
            style={{ color: BRAND }}
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{intro}</p>
        </div>

        <div className="px-6 pt-5">
          <label className="text-xs font-medium text-slate-700">
            {commentLabel}
          </label>
          <textarea
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
            className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            {comment.length}/2000
          </p>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            style={ctaStyle}
          >
            <CtaIcon className="h-4 w-4" />
            {isPending ? 'Envoi…' : ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
