import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CarService {

  // ✅ 1. BehaviorSubject — signal ki tarah kaam karta hai
  private carsUpdated = new BehaviorSubject<boolean>(false);
  carsUpdated$ = this.carsUpdated.asObservable();

  // ✅ 2. Notify function — jab car save ho tab call karo
  notifyUpdate() {
    this.carsUpdated.next(true);
  }

  // ✅ 3. localStorage se approved cars lao
  getListedCars() {
    const stored = localStorage.getItem('carListings');
    if (!stored) return [];
    return JSON.parse(stored).filter((c: any) => c.status === 'approved');
  }

  // ✅ 4. Single car by ID
  getCarById(id: string) {
    const stored = localStorage.getItem('carListings');
    if (!stored) return null;
    const all = JSON.parse(stored);
    return all.find((c: any) => c.id === id) || null;
  }

  // ✅ 5. Car delete karo
  deleteCar(id: string) {
    const stored = localStorage.getItem('carListings');
    if (!stored) return;
    const all = JSON.parse(stored);
    const updated = all.filter((c: any) => c.id !== id);
    localStorage.setItem('carListings', JSON.stringify(updated));
    this.notifyUpdate(); // ✅ delete ke baad bhi notify
  }

  // ✅ 6. Car update karo (edit listing)
  updateCar(id: string, newData: any) {
    const stored = localStorage.getItem('carListings');
    if (!stored) return;
    const all = JSON.parse(stored);
    const index = all.findIndex((c: any) => c.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...newData };
      localStorage.setItem('carListings', JSON.stringify(all));
      this.notifyUpdate(); // ✅ update ke baad bhi notify
    }
  }

  // ✅ 7. User ki apni cars
  getUserCars(email: string) {
    const stored = localStorage.getItem('carListings');
    if (!stored) return [];
    return JSON.parse(stored).filter((c: any) => c.email === email);
  }
}
