import { Injectable, inject } from '@angular/core';
import {
  collection, doc, getDocs, limit, orderBy, query, updateDoc, where,
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

/** In-app notifications for the current user (admins also see role-targeted). */
@Injectable({ providedIn: 'root' })
export class NotificationData {
  private readonly db = getFirebaseDb();
  private readonly auth = inject(AuthService);

  async listForCurrentUser(max = 50): Promise<AppNotification[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return [];
    const found = new Map<string, AppNotification>();

    const mine = query(
      collection(this.db, 'notifications'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    for (const d of (await getDocs(mine)).docs) found.set(d.id, this.toModel(d.id, d.data()));

    if (this.auth.isAdmin) {
      try {
        const admins = query(
          collection(this.db, 'notifications'),
          where('role', '==', 'admin'),
          orderBy('createdAt', 'desc'),
          limit(max),
        );
        for (const d of (await getDocs(admins)).docs) found.set(d.id, this.toModel(d.id, d.data()));
      } catch {
        // missing index or rules — user-targeted list still works
      }
    }

    return [...found.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, max);
  }

  async unreadCountForCurrentUser(): Promise<number> {
    const items = await this.listForCurrentUser(50);
    return items.filter((n) => !n.read).length;
  }

  async markRead(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'notifications', id), { read: true });
  }

  private toModel(id: string, data: Record<string, unknown>): AppNotification {
    return {
      id,
      userId: data['userId'] as string | undefined,
      role: data['role'] as string | undefined,
      title: (data['title'] as string) ?? '',
      body: (data['body'] as string) ?? '',
      type: (data['type'] as AppNotification['type']) ?? 'info',
      read: (data['read'] as boolean) ?? false,
      link: (data['link'] as string) ?? undefined,
      createdAt: toIso(data['createdAt']),
    };
  }
}
