import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { pushNotification } from '../lib/notify';

/** New listing submitted → tell the admin/moderation team. */
export const onCarCreated = onDocumentCreated('cars/{carId}', async (event) => {
  const car = event.data?.data();
  if (!car || car.status !== 'pending') return;
  await pushNotification(getFirestore(), { role: 'admin' }, {
    title: 'New listing awaiting review',
    body: `${car.year ?? ''} ${car.make ?? ''} ${car.model ?? ''} — ${car.location ?? ''}`.trim(),
    type: 'warning',
    link: '/admin/reviews',
  });
});

/** Listing moderated (pending → approved/rejected) → tell the seller. */
export const onCarStatusChanged = onDocumentUpdated('cars/{carId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.status === after.status) return;
  if (before.status !== 'pending' || !after.sellerId) return;

  const carName = `${after.year ?? ''} ${after.make ?? ''} ${after.model ?? ''}`.trim();
  if (after.status === 'approved') {
    await pushNotification(getFirestore(), { userId: after.sellerId }, {
      title: 'Your listing was approved 🎉',
      body: `${carName} is now live on AutoFlex.`,
      type: 'success',
      link: '/dashboard',
    });
  } else if (after.status === 'rejected') {
    await pushNotification(getFirestore(), { userId: after.sellerId }, {
      title: 'Your listing was rejected',
      body: after.rejectionReason ? `Reason: ${after.rejectionReason}` : `${carName} did not pass review.`,
      type: 'error',
      link: '/dashboard',
    });
  }
});

/** New complaint / contact message → tell the admin team. */
export const onComplaintCreated = onDocumentCreated('complaints/{complaintId}', async (event) => {
  const c = event.data?.data();
  if (!c) return;
  const subject = (c.subject ?? c.title ?? 'New complaint') as string;
  await pushNotification(getFirestore(), { role: 'admin' }, {
    title: 'New complaint received',
    body: subject.slice(0, 140),
    type: 'info',
    link: '/admin/complaints',
  });
});
