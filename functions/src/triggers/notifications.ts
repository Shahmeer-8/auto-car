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

/** Car booking placed → tell the admin team, and the seller their car is reserved. */
export const onOrderCreated = onDocumentCreated('orders/{orderId}', async (event) => {
  const order = event.data?.data();
  if (!order) return;
  const db = getFirestore();

  await pushNotification(db, { role: 'admin' }, {
    title: 'New car booking',
    body: `${order.buyerName ?? 'A buyer'} reserved ${order.carTitle ?? 'a car'} (ref ${order.reference ?? ''})`.trim(),
    type: 'success',
    link: '/admin/orders',
  });

  if (order.sellerId) {
    await pushNotification(db, { userId: order.sellerId }, {
      title: 'Your car has a booking! 🎉',
      body: `${order.carTitle ?? 'Your listing'} has been reserved. Our team is verifying the buyer's deposit.`,
      type: 'success',
      link: '/dashboard',
    });
  }
});

/** Booking status moved → keep the buyer (and the seller on a sale) informed. */
export const onOrderStatusChanged = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.status === after.status) return;

  const db = getFirestore();
  const car = (after.carTitle as string) ?? 'your car';
  const orderId = event.params.orderId;

  const buyerMessage: Record<string, { title: string; body: string; type: 'info' | 'success' | 'warning' | 'error' }> = {
    payment_review: {
      title: 'Payment received — verifying',
      body: `We're checking your transfer for ${car}. You'll hear from us shortly.`,
      type: 'info',
    },
    confirmed: {
      title: 'Booking confirmed 🎉',
      body: `Your deposit for ${car} is verified. Our team will contact you to arrange handover.`,
      type: 'success',
    },
    completed: {
      title: 'Purchase completed',
      body: `Enjoy your ${car}! Thanks for buying with AutoFlex.`,
      type: 'success',
    },
    cancelled: {
      title: 'Booking cancelled',
      body: after.statusNote ? `${car}: ${after.statusNote}` : `Your booking for ${car} was cancelled.`,
      type: 'warning',
    },
  };

  const message = buyerMessage[after.status as string];
  if (message && after.buyerId) {
    await pushNotification(db, { userId: after.buyerId }, {
      ...message,
      link: `/order/${orderId}`,
    });
  }

  if (after.status === 'confirmed' && after.sellerId) {
    await pushNotification(db, { userId: after.sellerId }, {
      title: 'Your car is sold ✅',
      body: `The booking for ${car} is confirmed. Our team will coordinate the handover with you.`,
      type: 'success',
      link: '/dashboard',
    });
  }
});
