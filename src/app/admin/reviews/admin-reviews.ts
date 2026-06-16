import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { collection, getDocs, orderBy, query, where, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-reviews.html',
  styleUrl: './admin-reviews.css'
})
export class AdminReviews implements OnInit {
  private db = getFirebaseDb();
  cars: any[] = [];
  loading = true;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.loadPendingCars();
  }

  async loadPendingCars() {
    this.loading = true;
    try {
      const q = query(
        collection(this.db, 'cars'),
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'desc')
      );
      const snap = await getDocs(q);
      this.cars = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error loading pending cars:', err);
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  async approve(id: string) {
    await updateDoc(doc(this.db, 'cars', id), { status: 'approved' });
    await this.loadPendingCars();
  }

  async reject(id: string) {
    const reason = prompt('Rejection reason (optional):') || '';
    await updateDoc(doc(this.db, 'cars', id), { status: 'rejected', rejectionReason: reason });
    await this.loadPendingCars();
  }
}