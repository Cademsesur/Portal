import { z, ZodIssueCode } from 'zod';

/**
 * Error map Zod en français — couvre les messages par défaut que Zod
 * émettrait en anglais. Les messages explicites passés en arguments
 * (`min(2, 'Requis')`, etc.) prévalent toujours sur cette map.
 */
export const frenchErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type: {
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: 'Champ requis' };
      }
      const expected = TYPE_LABELS[issue.expected] ?? issue.expected;
      return { message: `Type attendu : ${expected}` };
    }
    case ZodIssueCode.too_small: {
      if (issue.type === 'string') {
        if (issue.minimum === 1) return { message: 'Champ requis' };
        return { message: `Au moins ${issue.minimum} caractères` };
      }
      if (issue.type === 'array') {
        if (issue.minimum === 1) return { message: 'Sélectionnez au moins une valeur' };
        return { message: `Au moins ${issue.minimum} éléments` };
      }
      if (issue.type === 'number' || issue.type === 'bigint') {
        if (issue.exact) return { message: `Doit valoir exactement ${issue.minimum}` };
        if (issue.inclusive) return { message: `Doit être ≥ ${issue.minimum}` };
        return { message: `Doit être > ${issue.minimum}` };
      }
      return { message: ctx.defaultError };
    }
    case ZodIssueCode.too_big: {
      if (issue.type === 'string') {
        return { message: `Au plus ${issue.maximum} caractères` };
      }
      if (issue.type === 'array') {
        return { message: `Au plus ${issue.maximum} éléments` };
      }
      if (issue.type === 'number' || issue.type === 'bigint') {
        if (issue.inclusive) return { message: `Doit être ≤ ${issue.maximum}` };
        return { message: `Doit être < ${issue.maximum}` };
      }
      return { message: ctx.defaultError };
    }
    case ZodIssueCode.invalid_enum_value:
      return { message: 'Valeur non autorisée' };
    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'Email invalide' };
      if (issue.validation === 'url') return { message: 'URL invalide' };
      if (issue.validation === 'uuid') return { message: 'UUID invalide' };
      if (issue.validation === 'cuid') return { message: 'Identifiant invalide' };
      return { message: 'Format invalide' };
    case ZodIssueCode.invalid_date:
      return { message: 'Date invalide' };
    case ZodIssueCode.not_finite:
      return { message: 'Nombre invalide' };
    case ZodIssueCode.invalid_literal:
      return { message: 'Valeur incorrecte' };
    case ZodIssueCode.unrecognized_keys:
      return { message: 'Champs non reconnus' };
    case ZodIssueCode.invalid_arguments:
      return { message: 'Arguments invalides' };
    default:
      return { message: ctx.defaultError };
  }
};

const TYPE_LABELS: Record<string, string> = {
  string: 'texte',
  number: 'nombre',
  bigint: 'nombre entier',
  boolean: 'booléen',
  date: 'date',
  array: 'liste',
  object: 'objet',
  integer: 'nombre entier',
  float: 'nombre',
  nan: 'nombre',
  undefined: 'défini',
  null: 'non nul',
};

export function installFrenchZodErrorMap(): void {
  z.setErrorMap(frenchErrorMap);
}
