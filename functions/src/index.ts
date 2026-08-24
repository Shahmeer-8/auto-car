import { initializeApp } from 'firebase-admin/app';

initializeApp();

// Auth / RBAC
export { setUserRole } from './auth/claims';

// Notifications (Firestore triggers)
export {
  onCarCreated,
  onCarStatusChanged,
  onComplaintCreated,
  onOrderCreated,
  onOrderStatusChanged,
} from './triggers/notifications';
