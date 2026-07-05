import { Injectable } from '@angular/core';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/firebase';
import { AuditLog } from '../models/audit.model';

function toIso(value: unknown): string {
  const v = value as { toDate?: () => Date } | string | undefined;
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    return v.toDate().toISOString();
  }
  return typeof v === 'string' ? v : '';
}

/** Read-only access to the append-only audit trail. */
@Injectable({ providedIn: 'root' })
export class AuditData {
  private readonly db = getFirebaseDb();

  async list(max = 100): Promise<AuditLog[]> {
    const q = query(collection(this.db, 'auditLogs'), orderBy('at', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        actorUid: data['actorUid'] ?? '',
        actorName: data['actorName'] ?? '',
        action: data['action'] ?? '',
        resource: data['resource'] ?? '',
        resourceId: data['resourceId'] ?? '',
        before: data['before'] ?? null,
        after: data['after'] ?? null,
        at: toIso(data['at']),
      } as AuditLog;
    });
  }
}
