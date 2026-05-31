import { Injectable, OnDestroy } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { BehaviorSubject } from 'rxjs';
import { getFirebaseDb, getFirebaseStorage } from '../core/firebase/firebase';
import { CarListing, CreateCarListingInput, SavedCar } from '../models/car.model';

@Injectable({ providedIn: 'root' })
export class CarService implements OnDestroy {
  private readonly db = getFirebaseDb();
  private readonly storage = getFirebaseStorage();
  private readonly carsCollection = collection(this.db, 'cars');

  private readonly approvedCarsSubject = new BehaviorSubject<CarListing[]>([]);
  private approvedCarsUnsubscribe: Unsubscribe | null = null;

  readonly approvedCars$ = this.approvedCarsSubject.asObservable();
  /** @deprecated Use approvedCars$ — kept for existing subscribers */
  readonly carsUpdated$ = this.approvedCars$;

  constructor() {
    this.listenToApprovedCars();
  }

  ngOnDestroy(): void {
    this.approvedCarsUnsubscribe?.();
  }

  getListedCars(): CarListing[] {
    return this.approvedCarsSubject.value;
  }

  async getCarById(id: string): Promise<CarListing | null> {
    const snap = await getDoc(doc(this.db, 'cars', id));
    if (!snap.exists()) return null;
    return this.mapCarDoc(snap.id, snap.data());
  }

  async getUserListings(sellerId: string): Promise<CarListing[]> {
    const q = query(
      this.carsCollection,
      where('sellerId', '==', sellerId),
      orderBy('submittedAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.mapCarDoc(d.id, d.data()));
  }

  async createListing(input: CreateCarListingInput): Promise<string> {
    const docRef = await addDoc(this.carsCollection, {
      sellerId: input.sellerId,
      make: input.make,
      model: input.model,
      year: input.year,
      mileage: input.mileage,
      transmission: input.transmission,
      fuelType: input.fuelType,
      color: input.color,
      condition: input.condition,
      bodyType: input.bodyType,
      price: input.price,
      description: input.description,
      location: input.location,
      phone: input.phone,
      images: [],
      ownerName: input.ownerName,
      email: input.email,
      status: 'approved',
      submittedAt: serverTimestamp(),
    });

    const imageUrls = await this.uploadImages(input.images, input.sellerId, docRef.id);

    await updateDoc(doc(this.db, 'cars', docRef.id), { images: imageUrls });

    return docRef.id;
  }

  async deleteCar(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'cars', id));
  }

  async updateCar(id: string, data: Partial<CarListing>): Promise<void> {
    const { id: _id, ...updateData } = data as CarListing;
    await updateDoc(doc(this.db, 'cars', id), updateData);
  }

  async getSavedCars(userId: string): Promise<SavedCar[]> {
    const snapshot = await getDocs(collection(this.db, 'users', userId, 'savedCars'));
    return snapshot.docs.map((d) => d.data() as SavedCar);
  }

  async removeSavedCar(userId: string, carId: string): Promise<void> {
    await deleteDoc(doc(this.db, 'users', userId, 'savedCars', carId));
  }

  private listenToApprovedCars(): void {
    const q = query(
      this.carsCollection,
      where('status', '==', 'approved'),
      orderBy('submittedAt', 'desc'),
    );

    this.approvedCarsUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cars = snapshot.docs.map((d) => this.mapCarDoc(d.id, d.data()));
        this.approvedCarsSubject.next(cars);
      },
      (error) => console.error('Failed to load approved cars:', error),
    );
  }

  private mapCarDoc(id: string, data: Record<string, unknown>): CarListing {
    const submittedAt = data['submittedAt'];
    let submittedAtIso = '';

    if (submittedAt && typeof submittedAt === 'object' && 'toDate' in submittedAt) {
      submittedAtIso = (submittedAt as { toDate: () => Date }).toDate().toISOString();
    } else if (typeof submittedAt === 'string') {
      submittedAtIso = submittedAt;
    }

    return {
      id,
      sellerId: data['sellerId'] as string,
      make: data['make'] as string,
      model: data['model'] as string,
      year: data['year'] as number,
      mileage: data['mileage'] as number,
      transmission: data['transmission'] as string,
      fuelType: data['fuelType'] as string,
      color: data['color'] as string,
      condition: data['condition'] as string,
      bodyType: data['bodyType'] as string,
      price: data['price'] as number,
      description: data['description'] as string,
      location: data['location'] as string,
      phone: data['phone'] as string,
      images: (data['images'] as string[]) ?? [],
      ownerName: data['ownerName'] as string,
      email: data['email'] as string,
      submittedAt: submittedAtIso,
      status: data['status'] as CarListing['status'],
    };
  }

  private async uploadImages(
    base64Images: string[],
    userId: string,
    listingId: string,
  ): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < base64Images.length; i++) {
      const blob = this.base64ToBlob(base64Images[i]);
      const storageRef = ref(this.storage, `cars/${userId}/${listingId}/${i}.jpg`);
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      urls.push(await getDownloadURL(storageRef));
    }

    return urls;
  }

  private base64ToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }
}
