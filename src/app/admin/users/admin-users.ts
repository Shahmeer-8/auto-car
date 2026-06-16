import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  private db = getFirebaseDb();
  users: any[] = [];
  loading = true;

  // For viewing a specific seller's cars
  selectedUser: any = null;
  userCars: any[] = [];
  loadingCars = false;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      const snap = await getDocs(collection(this.db, 'users'));
      this.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // For each user, count their cars
      for (const user of this.users) {
        const q = query(collection(this.db, 'cars'), where('sellerId', '==', user.uid));
        const carsSnap = await getDocs(q);
        user.carsCount = carsSnap.size;
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  async viewListings(user: any) {
  this.selectedUser = user;
  this.loadingCars = true;
  this.userCars = [];
  this.cdr.detectChanges();

  try {
    const q = query(
      collection(this.db, 'cars'),
      where('sellerId', '==', user.uid)
    );
    const snap = await getDocs(q);
    this.userCars = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error loading user cars:', err);
  }
  this.loadingCars = false;
  this.cdr.detectChanges();
}

  closeListings() {
    this.selectedUser = null;
    this.userCars = [];
  }

  async updateCarStatus(carId: string, status: string) {
    await updateDoc(doc(this.db, 'cars', carId), { status });
    // refresh
    const idx = this.userCars.findIndex(c => c.id === carId);
    if (idx !== -1) this.userCars[idx].status = status;
    this.cdr.detectChanges();
  }

  async toggleUserActive(user: any) {
    const newStatus = !user.isActive;
    await updateDoc(doc(this.db, 'users', user.id), { isActive: newStatus });
    user.isActive = newStatus;
    this.cdr.detectChanges();
  }
}