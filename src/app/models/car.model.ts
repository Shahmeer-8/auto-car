/** 'sold' is set when a booking on the listing is confirmed — it leaves the public listings. */
export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'sold';

export interface CarListing {
  id?: string;
  sellerId: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuelType: string;
  color: string;
  condition: string;
  bodyType: string;
  price: number;
  description: string;
  location: string;
  phone: string;
  images: string[];
  ownerName: string;
  email: string;
  submittedAt: string;
  status: ListingStatus;

  // ── New fields ──
  variant?: string;
  exteriorColor?: string;
  registrationCity?: string;
  engineDisplacement?: string;
  driveType?: string;
  previousOwners?: string;
  registeredIn?: string;
  features?: string[];
  negotiable?: string;
  installmentAvailable?: string | null;
  fullName?: string;
  whatsapp?: string;
  preferredContactTime?: string;
}

export interface SavedCar {
  carId: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image: string;
  savedAt: string;
}

export interface CreateCarListingInput {
  sellerId: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuelType: string;
  color?: string;
  condition: string;
  bodyType: string;
  price: number;
  description: string;
  location: string;
  phone: string;
  images: string[];
  ownerName: string;
  email: string;

  // ── New fields ──
  variant?: string;
  exteriorColor?: string;
  registrationCity?: string;
  engineDisplacement?: string;
  driveType?: string;
  previousOwners?: string;
  registeredIn?: string;
  features?: string[];
  negotiable?: string;
  installmentAvailable?: string | null;
  fullName?: string;
  whatsapp?: string;
  preferredContactTime?: string;
}