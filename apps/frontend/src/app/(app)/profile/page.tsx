'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { logout } from '@/features/auth/api/auth.api';
import { ROLE_LABELS, type Role } from '@/lib/brand';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in-up">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Mon compte
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Profil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos informations de compte SESUR.
        </p>
      </header>

      <Card className="relative overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-primary text-xl font-semibold text-primary-foreground shadow-md">
              {initials || '?'}
            </div>
            <Badge variant="default" className="mb-1 uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3" />
              {roleLabel}
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-lg font-semibold text-foreground">
              {user.displayName}
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground">
          Informations détaillées
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field icon={Mail} label="Email professionnel" value={user.email} />
          <Field icon={ShieldCheck} label="Rôle" value={roleLabel} />
          {user.lastLoginAt && (
            <Field
              icon={Calendar}
              label="Dernière connexion"
              value={new Date(user.lastLoginAt).toLocaleString('fr-FR')}
            />
          )}
        </dl>
      </Card>

      <div className="flex justify-end">
        <Button variant="destructive-outline" onClick={handleLogout}>
          <LogOut />
          Se déconnecter
        </Button>
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
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
