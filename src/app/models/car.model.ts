export type ListingStatus = 'pending' | 'approved' | 'rejected';

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
  sellerId: string;
}
