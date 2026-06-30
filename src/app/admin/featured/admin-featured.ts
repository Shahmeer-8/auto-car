import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-featured',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-featured.html',
  styleUrl: './admin-featured.css'
})
export class AdminFeatured implements OnInit {
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
      const q = query(collection(this.db, 'cars'), where('status', '==', 'approved'));
      const snap = await getDocs(q);
      this.cars = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error loading cars:', err);
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  get featuredCars(): any[] {
    return this.cars.filter(c => c.featured === true);
  }

  get otherCars(): any[] {
    return this.cars.filter(c => !c.featured);
  }

  async toggleFeatured(car: any) {
    try {
      await updateDoc(doc(this.db, 'cars', car.id), { featured: !car.featured });
      car.featured = !car.featured;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error updating featured status:', err);
      alert('Failed to update. Please try again.');
    }
  }
}
