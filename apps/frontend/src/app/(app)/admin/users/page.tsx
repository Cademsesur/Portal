'use client';

import { useState } from 'react';
import {
  Mail,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { canManageUsers } from '@/lib/brand';
import { Forbidden } from '@/components/forbidden';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import {
  useCreateInvitation,
  useInvitations,
  useResendInvitation,
  useRevokeInvitation,
} from '@/features/admin/hooks/use-invitations';
import type { InvitationStatus } from '@/features/admin/api/invitations.api';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toaster';

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employé' },
  { value: 'DAF', label: 'DAF' },
] as const;

export default function AdminUsersPage() {
  const { data: me } = useCurrentUser();
  if (!me) return null;

  if (!canManageUsers(me.role)) {
    return (
      <Forbidden
        title="Espace réservé aux super administrateurs"
        message="Seuls les super administrateurs peuvent gérer les invitations et les utilisateurs."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Super administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Utilisateurs &amp; invitations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invitez de nouveaux collaborateurs et suivez le statut de leurs invitations.
        </p>
      </header>

      <InviteForm />
      <InvitationsTable />
    </div>
  );
}

function InviteForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('EMPLOYEE');
  const create = useCreateInvitation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({ email: email.trim(), role });
      toast.success('Invitation envoyée', {
        description: `Un email a été envoyé à ${email.trim()}.`,
      });
      setEmail('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur inattendue');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
          <UserPlus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Inviter un utilisateur
          </h2>
          <p className="text-xs text-muted-foreground">
            L&apos;invitation est envoyée par e-mail et expire après 7 jours.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]"
      >
        <div>
          <Label htmlFor="invite-email" className="sr-only">
            Email
          </Label>
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@sesur.bj"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="invite-role" className="sr-only">
            Rôle
          </Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={create.isPending}>
          Envoyer
        </Button>
      </form>
    </Card>
  );
}

function InvitationsTable() {
  const { data: invitations, isLoading } = useInvitations();
  const resend = useResendInvitation();
  const revoke = useRevokeInvitation();

  const handleResend = async (id: string, email: string) => {
    try {
      await resend.mutateAsync(id);
      toast.success('Invitation relancée', { description: email });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur inattendue');
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    try {
      await revoke.mutateAsync(id);
      toast.success('Invitation révoquée', { description: email });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erreur inattendue');
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <h2 className="text-sm font-semibold text-foreground">Invitations</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {invitations?.length ?? 0} entrée{(invitations?.length ?? 0) > 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !invitations || invitations.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
            <Mail className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">
            Aucune invitation pour le moment
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Utilisez le formulaire ci-dessus pour inviter un premier collaborateur.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rôle</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Envois</th>
                <th className="px-6 py-3">Dernier envoi</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invitations.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-6 py-3 font-medium text-foreground">
                    {inv.email}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{inv.role}</td>
                  <td className="px-6 py-3">
                    <InvitationStatusBadge status={inv.status} />
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {1 + inv.resendCount}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {new Date(inv.lastSentAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {inv.status === 'PENDING' ? (
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(inv.id, inv.email)}
                          disabled={resend.isPending}
                        >
                          <RefreshCw />
                          Relancer
                        </Button>
                        <Button
                          variant="destructive-outline"
                          size="sm"
                          onClick={() => handleRevoke(inv.id, inv.email)}
                          disabled={revoke.isPending}
                        >
                          <Trash2 />
                          Révoquer
                        </Button>
                      </div>
                    ) : (
                      <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground/50" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const INVITATION_STATUS: Record<
  InvitationStatus,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  ACCEPTED: { label: 'Acceptée', variant: 'success' },
  REVOKED: { label: 'Révoquée', variant: 'secondary' },
  EXPIRED: { label: 'Expirée', variant: 'destructive' },
};

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const config = INVITATION_STATUS[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}
