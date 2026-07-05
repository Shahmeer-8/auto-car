import { hasPermission, groupPermissions, PERMISSIONS } from './permissions';

describe('hasPermission', () => {
  it('returns true when the exact permission is present', () => {
    expect(hasPermission(['ads.moderate'], 'ads.moderate')).toBe(true);
  });

  it('returns false when the permission is missing', () => {
    expect(hasPermission(['ads.view'], 'ads.moderate')).toBe(false);
  });

  it('grants everything for the wildcard "*"', () => {
    expect(hasPermission(['*'], 'anything.here')).toBe(true);
  });

  it('returns false for undefined/empty permission lists', () => {
    expect(hasPermission(undefined, 'ads.view')).toBe(false);
    expect(hasPermission([], 'ads.view')).toBe(false);
  });
});

describe('catalogue', () => {
  it('contains core permissions', () => {
    expect(PERMISSIONS).toContain('users.manage');
    expect(PERMISSIONS).toContain('roles.manage');
    expect(PERMISSIONS).toContain('ads.moderate');
  });

  it('groups permissions by resource', () => {
    const groups = groupPermissions();
    expect(groups['ads']).toContain('ads.create');
    expect(groups['sales']).toContain('sales.approve');
  });
});
