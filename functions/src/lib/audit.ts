import { Firestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Appends an immutable audit-log entry. Called by every mutating Function.
 * auditLogs is write-protected in security rules; only the Admin SDK (here) can write.
 */
export async function writeAudit(
  db: Firestore,
  actorUid: string,
  actorName: string,
  action: string,
  resource: string,
  resourceId: string,
  before: unknown,
  after: unknown,
): Promise<void> {
  await db.collection('auditLogs').add({
    actorUid,
    actorName,
    action,
    resource,
    resourceId,
    before: before ?? null,
    after: after ?? null,
    at: FieldValue.serverTimestamp(),
  });
}
