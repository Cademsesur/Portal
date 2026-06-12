import Image from 'next/image';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const PROVIDER_LABEL: Record<string, string> = {
  microsoft: 'Microsoft',
  google: 'Google',
};

const REASON_MESSAGE: Record<string, string> = {
  state_invalid:
    "Lien de connexion expiré ou déjà utilisé. Recommencez en cliquant à nouveau sur l'un des boutons ci-dessous.",
  missing_params:
    'La réponse du fournisseur SSO est incomplète. Réessayez ; si le problème persiste, contactez votre administrateur.',
  provider_error:
    'Le fournisseur SSO a refusé la connexion. Vérifiez votre compte et réessayez.',
  no_invitation:
    "Aucune invitation n'existe pour ce compte. Demandez à votre administrateur SESUR de vous inviter avant de vous connecter.",
  invitation_expired:
    'Votre invitation a expiré. Demandez à votre administrateur de la renvoyer.',
  account_disabled:
    'Votre compte a été désactivé. Contactez votre administrateur SESUR.',
  domain_forbidden:
    "Le domaine de votre adresse email n'est pas autorisé pour la connexion Microsoft. Utilisez votre compte SESUR officiel.",
  token_exchange_failed:
    "L'échange de jetons avec le fournisseur SSO a échoué. Réessayez dans un instant.",
  profile_incomplete:
    "Le profil renvoyé par le fournisseur SSO est incomplet. Contactez votre administrateur.",
  email_unverified:
    "L'adresse email Google associée à ce compte n'a pas été vérifiée. Vérifiez-la depuis votre compte Google puis réessayez.",
  unexpected:
    "Une erreur inattendue est survenue pendant la connexion. Réessayez dans un instant.",
};

function describeSsoError(provider?: string, reason?: string): string | null {
  if (!provider && !reason) return null;
  const providerLabel = provider ? PROVIDER_LABEL[provider] ?? provider : 'SSO';
  const message =
    reason && REASON_MESSAGE[reason]
      ? REASON_MESSAGE[reason]
      : 'Connexion impossible. Réessayez ou contactez votre administrateur.';
  return `Échec de connexion ${providerLabel}. ${message}`;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; provider?: string; reason?: string };
}) {
  const errorMessage =
    searchParams.error === 'sso'
      ? describeSsoError(searchParams.provider, searchParams.reason)
      : null;

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <section className="relative flex flex-col bg-background px-8 py-10 sm:px-14 lg:px-20 xl:px-28">
        <header className="flex items-center gap-3">
          <Image
            src="/logos/logo.png"
            alt="SESUR"
            width={160}
            height={48}
            priority
            className="h-12 w-auto"
          />
          <div className="text-xl font-semibold tracking-tight text-primary">
            SESUR
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-16 animate-fade-in-up">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Bienvenue
          </p>
          <h1 className="mt-3 text-5xl font-bold leading-[1.05] tracking-tight text-primary">
            Portal
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Connectez-vous avec votre compte professionnel SESUR pour accéder à
            vos demandes d&apos;achat et approbations.
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mt-8 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive-soft-foreground animate-fade-in"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="mt-12 space-y-3">
            <SsoButton
              href={`${API_URL}/auth/microsoft`}
              label="Continuer avec Microsoft"
              icon={
                <svg viewBox="0 0 23 23" className="h-5 w-5" aria-hidden>
                  <path fill="#f25022" d="M1 1h10v10H1z" />
                  <path fill="#7fba00" d="M12 1h10v10H12z" />
                  <path fill="#00a4ef" d="M1 12h10v10H1z" />
                  <path fill="#ffb900" d="M12 12h10v10H12z" />
                </svg>
              }
            />
            <SsoButton
              href={`${API_URL}/auth/google`}
              label="Continuer avec Google"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                  />
                </svg>
              }
            />
          </div>

          <div className="mt-10 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Authentification SSO
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <footer className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SESUR — Accès réservé aux collaborateurs.
        </footer>
      </section>

      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/signi_picture_2.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-primary mix-blend-multiply opacity-40"
        />
      </aside>
    </main>
  );
}

interface SsoButtonProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SsoButton({ href, label, icon }: SsoButtonProps) {
  return (
    <a
      href={href}
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[13px] font-medium text-foreground shadow-xs transition-all hover:-translate-y-px hover:border-foreground/15 hover:bg-muted/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </a>
  );
}
