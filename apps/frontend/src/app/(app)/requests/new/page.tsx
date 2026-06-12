'use client';

import * as React from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Check,
  Plus,
  Send,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { isEmployeeLike, ROLE_LABELS, type Role } from '@/lib/brand';
import { Forbidden } from '@/components/forbidden';
import {
  EMPTY_ITEM,
  PURCHASE_TYPES,
  purchaseRequestFormSchema,
  type PurchaseRequestFormValues,
} from '@/features/requests/schemas/purchase-request-form.schema';
import { useCreateRequest } from '@/features/requests/hooks/use-create-request';
import type { CreatePurchaseRequestDto } from '@sesur/shared';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export default function NewRequestPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const createMutation = useCreateRequest();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestFormSchema),
    defaultValues: {
      requesterName: '',
      department: '',
      jobTitle: '',
      lineManager: '',
      purchaseTypes: [],
      otherTypeDetail: '',
      description: '',
      objective: '',
      operationalImpact: '',
      endUser: '',
      items: [EMPTY_ITEM],
    },
  });

  useEffect(() => {
    if (user) {
      setValue('requesterName', user.displayName);
      if (user.departmentId) setValue('department', user.departmentId);
    }
  }, [user, setValue]);

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const purchaseTypes = watch('purchaseTypes') ?? [];
  const showOtherDetail = purchaseTypes.includes('OTHER');

  if (!user) return null;
  if (!isEmployeeLike(user.role)) {
    return (
      <Forbidden
        title="Action réservée aux collaborateurs"
        message="Seuls les collaborateurs peuvent soumettre une demande d'achat. Les DAF, administrateurs et super administrateurs gèrent les validations et la configuration."
      />
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createMutation.mutateAsync(
        values as CreatePurchaseRequestDto,
      );
      toast.success('Demande soumise', {
        description: `Référence ${created.reference} — la DAF a été notifiée.`,
      });
      router.push(`/requests/${created.id}` as never);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Erreur lors de la soumission de la demande',
      );
    }
  });

  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR');

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Link
        href="/requests"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux demandes
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Fiche numérique
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Fiche de demande d&apos;achat
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Remplissez le formulaire — il sera transmis à la DAF pour validation.
          </p>
        </div>
        <Card className="px-4 py-3 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Référence
              </div>
              <div className="font-mono text-muted-foreground">automatique</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Date
              </div>
              <div className="font-medium text-foreground">{formattedDate}</div>
            </div>
          </div>
        </Card>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <Section index={1} title="Identification du demandeur" subtitle="Vos coordonnées professionnelles">
          <FormGrid>
            <FormField label="Nom et prénom" error={errors.requesterName?.message} required>
              <Input {...register('requesterName')} placeholder="Ex. Jean DUPONT" invalid={!!errors.requesterName} />
            </FormField>
            <FormField label="Service / Département" error={errors.department?.message} required>
              <Input {...register('department')} placeholder="Ex. Informatique" invalid={!!errors.department} />
            </FormField>
            <FormField label="Fonction" error={errors.jobTitle?.message} required>
              <Input {...register('jobTitle')} placeholder="Ex. Développeur" invalid={!!errors.jobTitle} />
            </FormField>
            <FormField label="Responsable hiérarchique" error={errors.lineManager?.message} required>
              <Input {...register('lineManager')} placeholder="Nom et prénom du N+1" invalid={!!errors.lineManager} />
            </FormField>
          </FormGrid>
        </Section>

        <Section index={2} title="Objet de la demande" subtitle="Type d'achat et description">
          <div>
            <Label required>Type d&apos;achat (plusieurs choix possibles)</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PURCHASE_TYPES.map((t) => (
                <CheckboxOption
                  key={t.key}
                  label={t.label}
                  value={t.key}
                  {...register('purchaseTypes')}
                />
              ))}
            </div>
            {errors.purchaseTypes && (
              <p className="mt-2 text-xs text-destructive">
                {errors.purchaseTypes.message as string}
              </p>
            )}
          </div>

          {showOtherDetail && (
            <FormField
              label="Préciser (autre)"
              error={errors.otherTypeDetail?.message}
              className="mt-4"
              required
            >
              <Input
                {...register('otherTypeDetail')}
                placeholder="Précisez la nature de l'achat"
                invalid={!!errors.otherTypeDetail}
              />
            </FormField>
          )}

          <FormField
            label="Description précise (caractéristiques techniques obligatoires)"
            error={errors.description?.message}
            className="mt-4"
            required
          >
            <Textarea
              {...register('description')}
              rows={4}
              placeholder="Décrivez précisément ce qui est demandé, modèle, marque, version, caractéristiques techniques détaillées…"
              invalid={!!errors.description}
            />
          </FormField>
        </Section>

        <Section index={3} title="Justification & impact" subtitle="Pourquoi cet achat est-il nécessaire ?">
          <FormField label="Objectif de l'achat" error={errors.objective?.message} required>
            <Textarea
              {...register('objective')}
              rows={3}
              placeholder="Quel besoin résout cet achat ?"
              invalid={!!errors.objective}
            />
          </FormField>
          <FormField
            label="Impact opérationnel"
            error={errors.operationalImpact?.message}
            className="mt-4"
            required
          >
            <Textarea
              {...register('operationalImpact')}
              rows={3}
              placeholder="Quel impact sur les activités si l'achat est refusé / approuvé ?"
              invalid={!!errors.operationalImpact}
            />
          </FormField>
          <FormField label="Utilisateur (final)" error={errors.endUser?.message} className="mt-4" required>
            <Input
              {...register('endUser')}
              placeholder="Personne ou équipe qui utilisera"
              invalid={!!errors.endUser}
            />
          </FormField>
        </Section>

        <Section
          index={4}
          title="Détail des articles"
          subtitle="Une ligne par article à acheter"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(EMPTY_ITEM)}
            >
              <Plus />
              Ajouter une ligne
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="w-10 pl-2">#</th>
                  <th className="px-2">Description</th>
                  <th className="w-24 px-2">Qté</th>
                  <th className="px-2">Spécifications techniques</th>
                  <th className="w-44 px-2">Délai souhaité</th>
                  <th className="px-2">Observations</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => (
                  <tr key={field.id} className="align-top">
                    <td className="pl-2 pt-2 font-mono text-xs text-muted-foreground">
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-1">
                      <Input
                        {...register(`items.${idx}.description` as const)}
                        placeholder="Désignation"
                        invalid={!!errors.items?.[idx]?.description}
                      />
                      {errors.items?.[idx]?.description && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.items[idx]?.description?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-1">
                      <Input
                        type="number"
                        min={1}
                        {...register(`items.${idx}.quantity` as const, { valueAsNumber: true })}
                        invalid={!!errors.items?.[idx]?.quantity}
                      />
                      {errors.items?.[idx]?.quantity && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.items[idx]?.quantity?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-1">
                      <Input
                        {...register(`items.${idx}.specifications` as const)}
                        placeholder="Marque, modèle, capacité…"
                      />
                    </td>
                    <td className="px-1">
                      <Input
                        {...register(`items.${idx}.desiredDeadline` as const)}
                        placeholder="Ex. 30/06/2026"
                      />
                    </td>
                    <td className="px-1">
                      <Input
                        {...register(`items.${idx}.observations` as const)}
                        placeholder="Notes éventuelles"
                      />
                    </td>
                    <td className="pt-2 text-right">
                      <button
                        type="button"
                        onClick={() => fields.length > 1 && remove(idx)}
                        disabled={fields.length === 1}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {typeof errors.items?.message === 'string' && (
            <p className="mt-2 text-xs text-destructive">{errors.items.message}</p>
          )}
        </Section>

        <div className="grid gap-4 sm:grid-cols-2">
          <SignatureBlock
            label="Demandeur"
            name={user.displayName}
            role={ROLE_LABELS[user.role as Role] ?? user.role}
            state="ready"
          />
          <SignatureBlock label="Approbateur (DAF)" name="—" role="DAF" state="pending" />
        </div>

        <Card className="sticky bottom-4 z-10 flex flex-col items-stretch gap-3 p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            En soumettant, la fiche est transmise à la DAF pour arbitrage. Vous
            pourrez en suivre le statut depuis « Mes demandes ».
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/requests">Annuler</Link>
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {!isSubmitting && <Send />}
              Soumettre à la DAF
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Form pieces specific to this page
// ─────────────────────────────────────────────────────────────

function Section({
  index,
  title,
  subtitle,
  children,
  action,
}: {
  index: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
            {index}
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="px-6 py-5">{children}</div>
    </Card>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function FormField({
  label,
  error,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label required={required}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

const CheckboxOption = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function CheckboxOption({ label, className, ...rest }, ref) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-colors hover:border-foreground/15 hover:bg-muted/50 has-[:checked]:border-primary/40 has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground',
        className,
      )}
    >
      <input ref={ref} type="checkbox" className="sr-only" {...rest} />
      <span className="flex h-4 w-4 items-center justify-center rounded border border-border bg-card text-primary-foreground transition-colors group-has-[:checked]:border-transparent group-has-[:checked]:bg-primary">
        <Check className="h-3 w-3 opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
      </span>
      <span>{label}</span>
    </label>
  );
});

function SignatureBlock({
  label,
  name,
  role,
  state,
}: {
  label: string;
  name: string;
  role: string;
  state: 'ready' | 'pending';
}) {
  const Icon: LucideIcon = state === 'ready' ? Check : Send;
  const ready = state === 'ready';
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full',
            ready
              ? 'bg-success-soft text-success-soft-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{name}</div>
      <div className="text-[11px] text-muted-foreground">{role}</div>
    </div>
  );
}
