'use client';

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
import { BRAND, isEmployeeLike, ROLE_LABELS, type Role } from '@/lib/brand';
import {
  EMPTY_ITEM,
  PURCHASE_TYPES,
  purchaseRequestFormSchema,
  type PurchaseRequestFormValues,
} from '@/features/requests/schemas/purchase-request-form.schema';
import { addRequest } from '@/features/requests/store/local-store';

export default function NewRequestPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

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

  // Pré-remplissage depuis l'utilisateur courant
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
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold" style={{ color: BRAND }}>
          Action non autorisée
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Seuls les collaborateurs peuvent soumettre une demande d'achat.
        </p>
      </div>
    );
  }

  const onSubmit = handleSubmit((values) => {
    const created = addRequest(values);
    router.push(`/requests/${created.id}` as never);
  });

  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR');

  return (
    <div className="space-y-6">
      <Link
        href="/requests"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux demandes
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Fiche numérique
          </p>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: BRAND }}
          >
            Fiche de demande d'achat
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Remplissez le formulaire — il sera transmis à la DAF pour validation.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Référence
              </div>
              <div className="font-mono text-slate-600">automatique</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Date
              </div>
              <div className="font-medium text-slate-700">{formattedDate}</div>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* 1. Identification du demandeur */}
        <Section
          index={1}
          title="Identification du demandeur"
          subtitle="Vos coordonnées professionnelles"
        >
          <Grid>
            <Field label="Nom et prénom" error={errors.requesterName?.message} required>
              <Input {...register('requesterName')} placeholder="Ex. Jean DUPONT" />
            </Field>
            <Field
              label="Service / Département"
              error={errors.department?.message}
              required
            >
              <Input {...register('department')} placeholder="Ex. Informatique" />
            </Field>
            <Field label="Fonction" error={errors.jobTitle?.message} required>
              <Input {...register('jobTitle')} placeholder="Ex. Développeur" />
            </Field>
            <Field
              label="Responsable hiérarchique"
              error={errors.lineManager?.message}
              required
            >
              <Input
                {...register('lineManager')}
                placeholder="Nom et prénom du N+1"
              />
            </Field>
          </Grid>
        </Section>

        {/* 2. Objet de la demande */}
        <Section
          index={2}
          title="Objet de la demande"
          subtitle="Type d'achat et description"
        >
          <div>
            <Label required>Type d'achat (plusieurs choix possibles)</Label>
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
              <p className="mt-2 text-xs text-rose-600">
                {errors.purchaseTypes.message as string}
              </p>
            )}
          </div>

          {showOtherDetail && (
            <Field
              label="Préciser (autre)"
              error={errors.otherTypeDetail?.message}
              className="mt-4"
              required
            >
              <Input
                {...register('otherTypeDetail')}
                placeholder="Précisez la nature de l'achat"
              />
            </Field>
          )}

          <Field
            label="Description précise (caractéristiques techniques obligatoires)"
            error={errors.description?.message}
            className="mt-4"
            required
          >
            <Textarea
              {...register('description')}
              rows={4}
              placeholder="Décrivez précisément ce qui est demandé, modèle, marque, version, caractéristiques techniques détaillées…"
            />
          </Field>
        </Section>

        {/* 3. Justification & impact */}
        <Section
          index={3}
          title="Justification & impact"
          subtitle="Pourquoi cet achat est-il nécessaire ?"
        >
          <Field
            label="Objectif de l'achat"
            error={errors.objective?.message}
            required
          >
            <Textarea
              {...register('objective')}
              rows={3}
              placeholder="Quel besoin résout cet achat ?"
            />
          </Field>
          <Field
            label="Impact opérationnel"
            error={errors.operationalImpact?.message}
            className="mt-4"
            required
          >
            <Textarea
              {...register('operationalImpact')}
              rows={3}
              placeholder="Quel impact sur les activités si l'achat est refusé / approuvé ?"
            />
          </Field>
          <Field
            label="Utilisateur (final)"
            error={errors.endUser?.message}
            className="mt-4"
            required
          >
            <Input
              {...register('endUser')}
              placeholder="Personne ou équipe qui utilisera"
            />
          </Field>
        </Section>

        {/* 4. Tableau des articles */}
        <Section
          index={4}
          title="Détail des articles"
          subtitle="Une ligne par article à acheter"
          action={
            <button
              type="button"
              onClick={() => append(EMPTY_ITEM)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une ligne
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
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
                    <td className="pl-2 pt-2 text-xs font-mono text-slate-400">
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-1">
                      <Input
                        {...register(`items.${idx}.description` as const)}
                        placeholder="Désignation"
                      />
                      {errors.items?.[idx]?.description && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.items[idx]?.description?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-1">
                      <Input
                        type="number"
                        min={1}
                        {...register(`items.${idx}.quantity` as const)}
                      />
                      {errors.items?.[idx]?.quantity && (
                        <p className="mt-1 text-xs text-rose-600">
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
                    <td className="pt-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => fields.length > 1 && remove(idx)}
                        disabled={fields.length === 1}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
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
            <p className="mt-2 text-xs text-rose-600">{errors.items.message}</p>
          )}
        </Section>

        {/* Signatures + submit */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SignatureBlock
            label="Demandeur"
            name={user.displayName}
            role={ROLE_LABELS[user.role as Role] ?? user.role}
            state="ready"
          />
          <SignatureBlock label="Approbateur (DAF)" name="—" role="DAF" state="pending" />
        </div>

        <div className="sticky bottom-4 z-10 flex flex-col items-stretch gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            En soumettant, la fiche est transmise à la DAF pour arbitrage. Vous
            pourrez en suivre le statut depuis « Mes demandes ».
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/requests"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: BRAND }}
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Envoi…' : 'Soumettre à la DAF'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Form primitives
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
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#EEF0F8', color: BRAND }}
          >
            {index}
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
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
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-medium text-slate-700">
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100';

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const { className, ...rest } = props;
  return <input className={`${inputClass} ${className ?? ''}`} {...rest} />;
};

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const { className, ...rest } = props;
  return (
    <textarea
      className={`${inputClass} resize-y leading-relaxed ${className ?? ''}`}
      {...rest}
    />
  );
};

const CheckboxOption = function CheckboxOption(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, className, ...rest } = props;
  return (
    <label
      className={`group flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 has-[:checked]:border-transparent has-[:checked]:bg-[#EEF0F8] has-[:checked]:text-[#243064] ${className ?? ''}`}
    >
      <input type="checkbox" className="sr-only" {...rest} />
      <span
        className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-white text-white transition group-has-[:checked]:border-transparent group-has-[:checked]:bg-[#243064]"
      >
        <Check className="h-3 w-3 opacity-0 transition group-has-[:checked]:opacity-100" />
      </span>
      <span>{label}</span>
    </label>
  );
};

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
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{
            backgroundColor: state === 'ready' ? '#ECFDF5' : '#F1F5F9',
            color: state === 'ready' ? '#047857' : '#64748B',
          }}
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-slate-800">{name}</div>
      <div className="text-xs text-slate-500">{role}</div>
    </div>
  );
}
