import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/firebase';
import { Role } from '../models/role.model';

/** Firestore data-access for RBAC roles. No component talks to Firestore directly. */
@Injectable({ providedIn: 'root' })
export class RolesData {
  private readonly db = getFirebaseDb();

  async listRoles(): Promise<Role[]> {
    const snap = await getDocs(collection(this.db, 'roles'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Role, 'id'>) }));
  }

  async getRole(id: string): Promise<Role | null> {
    const snap = await getDoc(doc(this.db, 'roles', id));
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Role, 'id'>) }) : null;
  }

  /** Creates or updates a role. Uses the role id as the document id. */
  async saveRole(role: Role): Promise<void> {
    const now = new Date().toISOString();
    await setDoc(
      doc(this.db, 'roles', role.id),
      {
        id: role.id,
        name: role.name,
        description: role.description ?? '',
        permissions: role.permissions ?? [],
        isSystem: role.isSystem ?? false,
        createdAt: role.createdAt || now,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  async deleteRole(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'roles', id));
  }
}
