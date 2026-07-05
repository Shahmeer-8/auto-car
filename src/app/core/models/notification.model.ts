export interface AppNotification {
  id: string;
  userId?: string;
  role?: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}
