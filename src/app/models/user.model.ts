import { Permission } from '../core/models/permission.model';

export type UserType = 'buyer' | 'seller' | 'admin';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  createdAt: string;
  isActive: boolean;

  // RBAC (Phase 0). Optional during migration; set by the setUserRole Cloud Function.
  roleId?: string;
  roleName?: string;
  permissions?: Permission[];
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  userType: UserType;
}