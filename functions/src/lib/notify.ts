import { Firestore, FieldValue } from 'firebase-admin/firestore';

export type NotificationTarget = { userId: string } | { role: string };

/** Creates an in-app notification for a user or a role. Called by Functions on key events. */
export async function pushNotification(
  db: Firestore,
  target: NotificationTarget,
  n: { title: string; body: string; type?: 'info' | 'success' | 'warning' | 'error'; link?: string },
): Promise<void> {
  await db.collection('notifications').add({
    ...target,
    title: n.title,
    body: n.body,
    type: n.type ?? 'info',
    link: n.link ?? null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}
