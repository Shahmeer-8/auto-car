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

  // ── Vehicle detail fields (collected on the Sell Your Car form) ──
  /** Vehicle Registration Number — the number plate itself, e.g. "AB12 CDE" / "LEA-1234". */
  vrn?: string;
  /** Where/how the car is registered, e.g. "Lahore", "Punjab", "private plate". */
  registrationPlate?: string;
  variant?: string;
  /** Engine capacity, e.g. "1300 cc" / "2.0L". */
  engineDisplacement?: string;
  doorsCount?: number;
  seatingCapacity?: number;
  /** Range on a full charge, in km — only meaningful for electric/hybrid cars. */
  batteryRange?: number;
  /** Postcode / ZIP, alongside the free-text `location` (area or city). */
  postcode?: string;
  features?: string[];

  // ── Legacy optional fields kept for older listings ──
  exteriorColor?: string;
  registrationCity?: string;
  driveType?: string;
  previousOwners?: string;
  registeredIn?: string;
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

  // ── Vehicle detail fields (collected on the Sell Your Car form) ──
  vrn?: string;
  registrationPlate?: string;
  variant?: string;
  engineDisplacement?: string;
  doorsCount?: number;
  seatingCapacity?: number;
  batteryRange?: number;
  postcode?: string;
  features?: string[];

  // ── Legacy optional fields ──
  exteriorColor?: string;
  registrationCity?: string;
  driveType?: string;
  previousOwners?: string;
  registeredIn?: string;
  negotiable?: string;
  installmentAvailable?: string | null;
  fullName?: string;
  whatsapp?: string;
  preferredContactTime?: string;
}