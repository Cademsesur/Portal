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
import { BRAND, canManageUsers } from '@/lib/brand';
import { Forbidden } from '@/components/forbidden';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import {
  useCreateInvitation,
  useInvitations,
  useResendInvitation,
  useRevokeInvitation,
} from '@/features/admin/hooks/use-invitations';
import type { InvitationStatus } from '@/features/admin/api/invitations.api';

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
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          Super administration
        </p>
        <h1
          className="mt-1 text-2xl font-semibold tracking-tight"
          style={{ color: BRAND }}
        >
          Utilisateurs &amp; invitations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Invitez de nouveaux collaborateurs et suivez le statut de leurs
          invitations.
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const create = useCreateInvitation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await create.mutateAsync({ email: email.trim(), role });
      setSuccess(`Invitation envoyée à ${email.trim()}`);
      setEmail('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue');
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: '#EEF0F8', color: BRAND }}
        >
          <UserPlus className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Inviter un utilisateur
          </h2>
          <p className="text-xs text-slate-500">
            L'invitation est envoyée par e-mail et expire après 7 jours.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-3 sm:grid-cols-[1fr_200px_auto]"
      >
        <div className="relative">
          <Mail
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@sesur.bj"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BRAND }}
        >
          {create.isPending ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          {success}
        </p>
      )}
    </section>
  );
}

function InvitationsTable() {
  const { data: invitations, isLoading } = useInvitations();
  const resend = useResendInvitation();
  const revoke = useRevokeInvitation();

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Invitations</h2>
        </div>
        <span className="text-xs text-slate-400">
          {invitations?.length ?? 0} entrée{(invitations?.length ?? 0) > 1 ? 's' : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          Chargement…
        </div>
      ) : !invitations || invitations.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <span
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: '#EEF0F8', color: BRAND }}
          >
            <Mail className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-800">
            Aucune invitation pour le moment
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Utilisez le formulaire ci-dessus pour inviter un premier
            collaborateur.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rôle</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Envois</th>
                <th className="px-6 py-3">Dernier envoi</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/40">
                  <td className="px-6 py-3 font-medium text-slate-800">{inv.email}</td>
                  <td className="px-6 py-3 text-slate-600">{inv.role}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-6 py-3 text-slate-500">{1 + inv.resendCount}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {new Date(inv.lastSentAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {inv.status === 'PENDING' ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => resend.mutate(inv.id)}
                          disabled={resend.isPending}
                          title="Relancer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Relancer
                        </button>
                        <button
                          type="button"
                          onClick={() => revoke.mutate(inv.id)}
                          disabled={revoke.isPending}
                          title="Révoquer"
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Révoquer
                        </button>
                      </div>
                    ) : (
                      <MoreHorizontal className="ml-auto h-4 w-4 text-slate-300" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: InvitationStatus }) {
  const styles: Record<InvitationStatus, { bg: string; fg: string }> = {
    PENDING: { bg: '#FEF3C7', fg: '#92400E' },
    ACCEPTED: { bg: '#D1FAE5', fg: '#065F46' },
    REVOKED: { bg: '#E2E8F0', fg: '#475569' },
    EXPIRED: { bg: '#FEE2E2', fg: '#991B1B' },
  };
  const labels: Record<InvitationStatus, string> = {
    PENDING: 'En attente',
    ACCEPTED: 'Acceptée',
    REVOKED: 'Révoquée',
    EXPIRED: 'Expirée',
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {labels[status]}
    </span>
  );
}
