/**
 * SHARED permission catalogue + check (Angular side). Kept in sync with
 * functions/src/lib/permissions.ts — the single source of truth for what permissions exist.
 */
export const PERMISSIONS = [
  'dashboard.view',
  'ads.view', 'ads.create', 'ads.edit', 'ads.delete', 'ads.moderate', 'ads.feature',
  'inventory.view', 'inventory.edit', 'inventory.adjust',
  'sales.view', 'sales.create', 'sales.approve', 'sales.void',
  'purchase.view', 'purchase.create', 'purchase.approve',
  'customers.view', 'customers.manage',
  'orders.view', 'orders.manage',
  'leads.view', 'leads.manage', 'leads.assign',
  'cms.view', 'cms.edit', 'media.view', 'media.manage',
  'reports.view',
  'users.view', 'users.manage', 'roles.manage',
  'settings.manage', 'audit.view', 'notifications.view',
] as const;

export type Permission = (typeof PERMISSIONS)[number] | string;

/** Groups permissions by their `resource` prefix — used to render the permission matrix. */
export function groupPermissions(): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const p of PERMISSIONS) {
    const resource = p.split('.')[0];
    (groups[resource] ??= []).push(p);
  }
  return groups;
}

/** True if the user's permission list satisfies the required permission ('*' = all). */
export function hasPermission(userPerms: string[] | undefined, required: string): boolean {
  if (!userPerms) return false;
  return userPerms.includes('*') || userPerms.includes(required);
}
