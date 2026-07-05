import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/firebase';
import { AuthService } from '../../services/auth.service';
import { AppNotification } from '../models/notification.model';

function toIso(value: unknown): string {
  const v = value as { toDate?: () => Date } | string | undefined;
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    return v.toDate().toISOString();
  }
  return typeof v === 'string' ? v : '';
}

/** In-app notifications for the current user. */
@Injectable({ providedIn: 'root' })
export class NotificationData {
  private readonly db = getFirebaseDb();
  private readonly auth = inject(AuthService);

  async listForCurrentUser(max = 50): Promise<AppNotification[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(
      collection(this.db, 'notifications'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data['userId'],
        role: data['role'],
        title: data['title'] ?? '',
        body: data['body'] ?? '',
        type: data['type'] ?? 'info',
        read: data['read'] ?? false,
        link: data['link'] ?? undefined,
        createdAt: toIso(data['createdAt']),
      } as AppNotification;
    });
  }

  async markRead(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'notifications', id), { read: true });
  }
}
