export const BRAND = '#243064';
export const BRAND_SOFT = '#EEF0F8';
export const BRAND_RING = 'rgba(36, 48, 100, 0.12)';

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'EMPLOYEE'
  | 'MANAGER'
  | 'DAF'
  | 'PROCUREMENT';

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  EMPLOYEE: 'Employé',
  MANAGER: 'Manager',
  DAF: 'DAF',
  PROCUREMENT: 'Achats',
};

export function isEmployeeLike(role: string | undefined | null): boolean {
  return role === 'EMPLOYEE' || role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'ADMIN';
}

export function canValidate(role: string | undefined | null): boolean {
  return role === 'DAF';
}

export function canManageUsers(role: string | undefined | null): boolean {
  return role === 'SUPER_ADMIN';
}
