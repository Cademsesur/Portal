interface SubmittedVars {
  reference: string;
  requesterName: string;
  department: string;
  description: string;
  requestUrl: string;
}

interface DecidedVars {
  reference: string;
  decision: 'APPROVED' | 'REJECTED';
  comment: string | null;
  approverName: string;
  requestUrl: string;
}

const BRAND = '#243064';

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.55; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
  <div style="font-size: 22px; font-weight: 700; color: ${BRAND}; margin-bottom: 24px;">Portal</div>
  <h1 style="font-size: 18px; color: ${BRAND}; margin: 0 0 16px;">${title}</h1>
  ${bodyHtml}
  <p style="font-size: 13px; color: #6b7280; margin-top: 32px;">— L'équipe SESUR</p>
</body></html>`;
}

export function renderSubmittedEmail(vars: SubmittedVars): { html: string; text: string } {
  const summary = vars.description.length > 240 ? `${vars.description.slice(0, 240)}…` : vars.description;
  const text = [
    `Une nouvelle demande d'achat est à valider.`,
    ``,
    `Référence : ${vars.reference}`,
    `Demandeur : ${vars.requesterName} (${vars.department})`,
    ``,
    `Objet :`,
    summary,
    ``,
    `Examiner la demande :`,
    vars.requestUrl,
  ].join('\n');

  const html = shell(
    `Demande ${vars.reference} à valider`,
    `
    <p>Une nouvelle demande d'achat vient d'être soumise par <strong>${vars.requesterName}</strong> (${vars.department}).</p>
    <p style="margin: 16px 0; padding: 12px 14px; background: #F8FAFC; border-left: 3px solid ${BRAND}; color: #334155; font-size: 14px;">
      ${summary.replace(/\n/g, '<br/>')}
    </p>
    <p style="margin: 28px 0;">
      <a href="${vars.requestUrl}" style="display: inline-block; background: ${BRAND}; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600;">Examiner la demande</a>
    </p>
    <p style="font-size: 13px; color: #6b7280;">Référence : <strong>${vars.reference}</strong></p>
    `,
  );
  return { html, text };
}

export function renderDecidedEmail(vars: DecidedVars): { html: string; text: string } {
  const approved = vars.decision === 'APPROVED';
  const verb = approved ? 'approuvée' : 'rejetée';
  const accent = approved ? '#047857' : '#B91C1C';

  const text = [
    `Votre demande d'achat ${vars.reference} a été ${verb} par ${vars.approverName}.`,
    ...(vars.comment ? [``, `Commentaire :`, vars.comment] : []),
    ``,
    `Voir la demande :`,
    vars.requestUrl,
  ].join('\n');

  const commentBlock = vars.comment
    ? `<p style="margin: 16px 0; padding: 12px 14px; background: #F8FAFC; border-left: 3px solid ${accent}; color: #334155; font-size: 14px;">
        <strong style="display:block; margin-bottom: 4px;">Commentaire de la DAF :</strong>${vars.comment.replace(/\n/g, '<br/>')}
      </p>`
    : '';

  const html = shell(
    `Demande ${vars.reference} ${verb}`,
    `
    <p>Votre demande d'achat <strong>${vars.reference}</strong> a été <strong style="color:${accent};">${verb}</strong> par ${vars.approverName}.</p>
    ${commentBlock}
    <p style="margin: 28px 0;">
      <a href="${vars.requestUrl}" style="display: inline-block; background: ${BRAND}; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600;">Voir la demande</a>
    </p>
    `,
  );
  return { html, text };
}
