interface InvitationEmailVars {
  inviteUrl: string;
}

export function renderInvitationEmail({ inviteUrl }: InvitationEmailVars): {
  html: string;
  text: string;
} {
  const text = [
    'Bonjour,',
    '',
    "Vous avez été invité à rejoindre Portal, la plateforme interne SESUR de gestion des demandes d'achat.",
    '',
    'Pour activer votre compte, cliquez sur ce lien et connectez-vous avec votre compte professionnel (Microsoft) ou votre compte Google :',
    inviteUrl,
    '',
    "Ce lien expire dans 7 jours.",
    '',
    '— L\'équipe SESUR',
  ].join('\n');

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.55; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
  <div style="font-size: 22px; font-weight: 700; color: #243064; margin-bottom: 24px;">Portal</div>
  <p>Bonjour,</p>
  <p>Vous avez été invité à rejoindre <strong>Portal</strong>, la plateforme interne SESUR de gestion des demandes d'achat.</p>
  <p>Cliquez sur le bouton ci-dessous puis connectez-vous avec votre <strong>compte professionnel Microsoft</strong> ou votre <strong>compte Google</strong> — selon ce que vous utilisez.</p>
  <p style="margin: 28px 0;">
    <a href="${inviteUrl}" style="display: inline-block; background: #243064; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600;">Activer mon compte</a>
  </p>
  <p style="font-size: 13px; color: #6b7280;">Ou copiez ce lien dans votre navigateur :<br/><a href="${inviteUrl}" style="color: #243064; word-break: break-all;">${inviteUrl}</a></p>
  <p style="font-size: 13px; color: #6b7280; margin-top: 32px;">Ce lien expire dans 7 jours.</p>
  <p style="font-size: 13px; color: #6b7280;">— L'équipe SESUR</p>
</body></html>`;

  return { html, text };
}
