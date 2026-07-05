export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  action: string; // e.g. 'role.update', 'sale.create'
  resource: string; // e.g. 'roles', 'sales'
  resourceId: string;
  before?: unknown;
  after?: unknown;
  at: string;
}
