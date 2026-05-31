export type UserType = 'buyer' | 'seller';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  userType: UserType;
  createdAt: string;
  isActive: boolean;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  userType: UserType;
}
