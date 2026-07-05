import { Injectable } from '@angular/core';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseDb, getFirebaseFunctions } from '../firebase/firebase';
import { AppUser } from '../../models/user.model';

/** Firestore + callable data-access for user management. */
@Injectable({ providedIn: 'root' })
export class UsersData {
  private readonly db = getFirebaseDb();

  async listUsers(): Promise<AppUser[]> {
    const snap = await getDocs(collection(this.db, 'users'));
    return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, 'uid'>) }));
  }

  /**
   * Assigns a role via the setUserRole Cloud Function. Claims are set server-side —
   * the client never writes roleId/permissions directly (prevents privilege escalation).
   */
  async assignRole(uid: string, roleId: string): Promise<void> {
    const callable = httpsCallable<{ uid: string; roleId: string }, { ok: boolean }>(
      getFirebaseFunctions(),
      'setUserRole',
    );
    await callable({ uid, roleId });
  }

  async setActive(uid: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(this.db, 'users', uid), { isActive });
  }
}
