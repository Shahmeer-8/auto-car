import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { collection, doc, getDoc, getDocs, deleteDoc, updateDoc, addDoc, setDoc, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '../core/firebase/firebase';
import { CarListing, CreateCarListingInput, SavedCar } from '../models/car.model';

@Injectable({ providedIn: 'root' })
export class CarService {
  private readonly db = getFirebaseDb();

  // ✅ 1. BehaviorSubject — signal ki tarah kaam karta hai
  private carsUpdated = new BehaviorSubject<boolean>(false);
  carsUpdated$ = this.carsUpdated.asObservable();

  // ✅ 2. Notify function — when cars saved/changed
  notifyUpdate() {
    this.carsUpdated.next(true);
  }

  // ------------------------------
  // Approved cars stream (for Home)
  // ------------------------------
  readonly approvedCars$: Observable<CarListing[]> = this.carsUpdated$.pipe(
    switchMap(() => this.fetchApprovedCars()),
  );

  private async fetchApprovedCars(): Promise<CarListing[]> {
    const q = query(collection(this.db, 'cars'), where('status', '==', 'approved'));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CarListing, 'id'>),
    }));
  }

  // ✅ 3. Get listed cars (used elsewhere)
  async getListedCars(): Promise<CarListing[]> {
    return this.fetchApprovedCars();
  }

  // Create a new listing in Firestore. Always starts as 'pending' for admin moderation.
  async createCar(input: CreateCarListingInput): Promise<string> {
    const payload = {
      ...input,
      color: input.color ?? 'Not specified',
      status: 'pending' as const,
      submittedAt: new Date().toISOString(),
    };

    const ref = await addDoc(collection(this.db, 'cars'), payload);
    this.notifyUpdate();
    return ref.id;
  }

  // ✅ 4. Single car by ID
  async getCarById(id: string): Promise<CarListing | null> {
    if (!id) return null;
    const snap = await getDoc(doc(this.db, 'cars', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<CarListing, 'id'>) };
  }

  // ✅ 5. Car delete karo
  async deleteCar(id: string): Promise<void> {
    if (!id) return;
    await deleteDoc(doc(this.db, 'cars', id));
    this.notifyUpdate();
  }

  // ✅ 6. Car update karo (edit listing)
  async updateCar(id: string, newData: Partial<CarListing>): Promise<void> {
    if (!id) return;
    await updateDoc(doc(this.db, 'cars', id), newData as any);
    this.notifyUpdate();
  }

  // ------------------------------
  // Dashboard: user listings
  // ------------------------------
  // Dashboard passes userId (uid). Firestore listing has sellerId.
  async getUserListings(userId: string): Promise<CarListing[]> {
    if (!userId) return [];
    const q = query(collection(this.db, 'cars'), where('sellerId', '==', userId));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CarListing, 'id'>),
    }));
  }

  // Backward compatible with older method name
  async getUserCars(emailOrUserId: string): Promise<CarListing[]> {
    // If caller provides an email, older code stored that in localStorage.
    // Current Firestore shape uses sellerId/email; try sellerId first, then fallback to email.
    if (!emailOrUserId) return [];

    const bySellerId = query(collection(this.db, 'cars'), where('sellerId', '==', emailOrUserId));
    const snap1 = await getDocs(bySellerId);
    if (!snap1.empty) {
      return snap1.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CarListing, 'id'>) }));
    }

    const byEmail = query(collection(this.db, 'cars'), where('email', '==', emailOrUserId));
    const snap2 = await getDocs(byEmail);
    return snap2.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CarListing, 'id'>) }));
  }

  // ------------------------------
  // Dashboard: saved cars
  // ------------------------------
  // Firestore structure: users/{userId}/savedCars/{carId}  (matches firestore.rules)
  private savedCarsCol(userId: string) {
    return collection(this.db, 'users', userId, 'savedCars');
  }

  async getSavedCars(userId: string): Promise<SavedCar[]> {
    if (!userId) return [];
    const qSnap = await getDocs(this.savedCarsCol(userId));
    return qSnap.docs.map((d) => d.data() as SavedCar);
  }

  async addSavedCar(userId: string, car: SavedCar): Promise<void> {
    if (!userId || !car?.carId) return;
    await setDoc(doc(this.savedCarsCol(userId), car.carId), car);
    this.notifyUpdate();
  }

  async removeSavedCar(userId: string, carId: string): Promise<void> {
    if (!userId || !carId) return;
    await deleteDoc(doc(this.savedCarsCol(userId), carId));
    this.notifyUpdate();
  }
}

