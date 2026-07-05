import { initializeApp } from 'firebase-admin/app';

initializeApp();

// Auth / RBAC
export { setUserRole } from './auth/claims';
