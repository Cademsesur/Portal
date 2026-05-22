'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Mail, ShieldCheck } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { logout } from '@/features/auth/api/auth.api';
import { BRAND, ROLE_LABELS, type Role } from '@/lib/brand';

export default function ProfilePage() {
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!user) return null;

  const initials = user.displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = ROLE_LABELS[user.role as Role] ?? user.role;

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          Mon compte
        </p>
        <h1
          className="mt-1 text-2xl font-semibold tracking-tight"
          style={{ color: BRAND }}
        >
          Profil
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Vos informations de compte SESUR.
        </p>
      </header>

      <section
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <div
          aria-hidden
          className="h-24"
          style={{
            background: `linear-gradient(135deg, ${BRAND} 0%, #1A2350 100%)`,
          }}
        />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-xl font-semibold text-white shadow-sm"
              style={{ backgroundColor: BRAND }}
            >
              {initials || '?'}
            </div>
            <span
              className="mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: '#EEF0F8', color: BRAND }}
            >
              <ShieldCheck className="h-3 w-3" />
              {roleLabel}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-semibold text-slate-900">
              {user.displayName}
            </div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-800">
          Informations détaillées
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field icon={Mail} label="Email professionnel" value={user.email} />
          <Field icon={ShieldCheck} label="Rôle" value={roleLabel} />
        </dl>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-slate-800">{value}</dd>
    </div>
  );
}
