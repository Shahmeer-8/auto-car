import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-cars',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-cars.html',
  styleUrl: './admin-cars.css'
})
export class AdminCars implements OnInit {
  private db = getFirebaseDb();
  cars: any[] = [];
  loading = true;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.loadCars();
  }

  async loadCars() {
    this.loading = true;
    try {
      const q = query(collection(this.db, 'cars'), orderBy('submittedAt', 'desc'));
      const snap = await getDocs(q);
      this.cars = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error loading cars:', err);
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  async deleteCar(id: string) {
    if (confirm('Are you sure you want to delete this listing?')) {
      await deleteDoc(doc(this.db, 'cars', id));
      await this.loadCars();
    }
  }

  async updateStatus(id: string, status: string) {
    await updateDoc(doc(this.db, 'cars', id), { status });
    await this.loadCars();
  }
}