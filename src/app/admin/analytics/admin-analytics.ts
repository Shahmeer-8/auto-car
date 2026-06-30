import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

interface StatusBreakdownItem {
  label: string;
  count: number;
  percent: number;
  color: string;
}

interface TopMake {
  make: string;
  count: number;
}

@Component({
  selector: 'app-admin-analytics',
  imports: [CommonModule, MatCardModule],
  templateUrl: './admin-analytics.html',
  styleUrl: './admin-analytics.css'
})
export class AdminAnalytics implements OnInit {
  private db = getFirebaseDb();

  loading = true;
  error = false;

  totalCars = 0;
  approvedCount = 0;
  pendingCount = 0;
  rejectedCount = 0;

  totalUsers = 0;
  buyerCount = 0;
  sellerCount = 0;
  adminCount = 0;

  totalValue = 0;

  statusBreakdown: StatusBreakdownItem[] = [];
  topMakes: TopMake[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      const [carsSnap, usersSnap] = await Promise.all([
        getDocs(collection(this.db, 'cars')),
        getDocs(collection(this.db, 'users'))
      ]);

      const cars: any[] = carsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const users: any[] = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Cars by status
      this.totalCars = cars.length;
      this.approvedCount = cars.filter((c) => c.status === 'approved').length;
      this.pendingCount = cars.filter((c) => c.status === 'pending').length;
      this.rejectedCount = cars.filter((c) => c.status === 'rejected').length;

      // Users by type
      this.totalUsers = users.length;
      this.buyerCount = users.filter((u) => u.userType === 'buyer').length;
      this.sellerCount = users.filter((u) => u.userType === 'seller').length;
      this.adminCount = users.filter((u) => u.userType === 'admin').length;

      // Total value of approved cars
      this.totalValue = cars
        .filter((c) => c.status === 'approved')
        .reduce((sum: number, c: any) => sum + (Number(c.price) || 0), 0);

      // Status breakdown (guard divide-by-zero)
      const pct = (count: number): number =>
        this.totalCars > 0 ? (count / this.totalCars) * 100 : 0;
      this.statusBreakdown = [
        { label: 'Approved', count: this.approvedCount, percent: pct(this.approvedCount), color: '#22c55e' },
        { label: 'Pending', count: this.pendingCount, percent: pct(this.pendingCount), color: '#f97316' },
        { label: 'Rejected', count: this.rejectedCount, percent: pct(this.rejectedCount), color: '#ef4444' }
      ];

      // Top 5 makes
      const makeCounts = new Map<string, number>();
      for (const c of cars) {
        const make = (c.make || '').toString().trim();
        if (!make) {
          continue;
        }
        makeCounts.set(make, (makeCounts.get(make) || 0) + 1);
      }
      this.topMakes = Array.from(makeCounts.entries())
        .map(([make, count]) => ({ make, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      this.error = true;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
