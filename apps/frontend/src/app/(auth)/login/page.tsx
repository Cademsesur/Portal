import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const BRAND = '#243064';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      {/* Left column — white, SSO-only */}
      <section className="relative flex flex-col bg-white px-8 py-10 sm:px-14 lg:px-20 xl:px-28">
        <header className="flex items-center gap-3">
          <Image
            src="/logos/logo.png"
            alt="SESUR"
            width={160}
            height={48}
            priority
            className="h-12 w-auto"
          />
          <div
            className="text-xl font-semibold tracking-tight"
            style={{ color: BRAND }}
          >
            SESUR
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-16">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
            Bienvenue
          </p>
          <h1
            className="mt-3 text-5xl font-bold leading-[1.05] tracking-tight"
            style={{ color: BRAND }}
          >
            Portal
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-500">
            Connectez-vous avec votre compte professionnel SESUR pour accéder à
            vos demandes d&apos;achat et approbations.
          </p>

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
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Authentification SSO
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </div>

        <footer className="text-xs text-slate-400">
          © {new Date().getFullYear()} SESUR — Accès réservé aux collaborateurs.
        </footer>
      </section>

      {/* Right column — full-bleed hero image */}
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
          className="absolute inset-0"
          style={{ backgroundColor: BRAND, opacity: 0.35, mixBlendMode: 'multiply' }}
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
      className="group flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50/60"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
        aria-hidden
      >
        <path d="M5 12h14" />
        <path d="M13 5l7 7-7 7" />
      </svg>
    </a>
  );
}
