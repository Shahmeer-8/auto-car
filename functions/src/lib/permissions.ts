/**
 * SHARED permission catalogue + check. Kept in sync with the Angular copy at
 * src/app/core/auth/permissions.ts (single source of truth for what permissions exist).
 */
export const PERMISSIONS = [
  'dashboard.view',
  'ads.view', 'ads.create', 'ads.edit', 'ads.delete', 'ads.moderate', 'ads.feature',
  'inventory.view', 'inventory.edit', 'inventory.adjust',
  'sales.view', 'sales.create', 'sales.approve', 'sales.void',
  'purchase.view', 'purchase.create', 'purchase.approve',
  'customers.view', 'customers.manage',
  'leads.view', 'leads.manage', 'leads.assign',
  'cms.view', 'cms.edit', 'media.view', 'media.manage',
  'reports.view',
  'users.view', 'users.manage', 'roles.manage',
  'settings.manage', 'audit.view', 'notifications.view',
] as const;

export type Permission = (typeof PERMISSIONS)[number] | string;

/** True if the user's permission list satisfies the required permission ('*' = all). */
export function hasPermission(userPerms: string[] | undefined, required: string): boolean {
  if (!userPerms) return false;
  return userPerms.includes('*') || userPerms.includes(required);
}
