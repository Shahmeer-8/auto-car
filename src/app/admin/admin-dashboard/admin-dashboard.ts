import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { collection, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit, OnDestroy {
  private db = getFirebaseDb();
  loading = true;

  private allCars: any[] = [];
  private allUsers: any[] = [];
  private unsubCars?: Unsubscribe;
  private unsubUsers?: Unsubscribe;

  stats = [
    { label: 'Total cars',  value: '0',  icon: 'directions_car', color: '#3b82f6', change: '', changeUp: true },
    { label: 'Total users', value: '0',  icon: 'people',         color: '#22c55e', change: '', changeUp: true },
    { label: 'Active ads',  value: '0',  icon: 'campaign',       color: '#f97316', change: '', changeUp: true },
    { label: 'Revenue',     value: 'PKR 0', icon: 'attach_money',   color: '#a855f7', change: '', changeUp: true },
  ];

  recentAds: { car: string; user: string; status: string }[] = [];
  recentUsers: { name: string; ads: number; status: string }[] = [];

  chartData = [
    { month: 'Jan', value: '0', percent: 10, active: false },
    { month: 'Feb', value: '0', percent: 10, active: false },
    { month: 'Mar', value: '0', percent: 10, active: false },
    { month: 'Apr', value: '0', percent: 10, active: false },
    { month: 'May', value: '0', percent: 10, active: false },
    { month: 'Jun', value: '0', percent: 10, active: true  },
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Real-time listener for cars
    this.unsubCars = onSnapshot(collection(this.db, 'cars'), (snap) => {
      this.allCars = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.recompute();
    }, (err) => {
      console.error('Cars listener error:', err);
      this.loading = false;
      this.cdr.detectChanges();
    });

    // Real-time listener for users
    this.unsubUsers = onSnapshot(collection(this.db, 'users'), (snap) => {
      this.allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.recompute();
    }, (err) => {
      console.error('Users listener error:', err);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.unsubCars?.();
    this.unsubUsers?.();
  }

  private getTime(field: any): number {
    if (field?.toDate) return field.toDate().getTime();
    if (typeof field === 'string') return new Date(field).getTime();
    return 0;
  }

private recompute() {
  this.stats[0].value = this.allCars.length.toString();
  this.stats[1].value = this.allUsers.length.toString();

  const approvedCars = this.allCars.filter(c => c.status === 'approved');
  this.stats[2].value = approvedCars.length.toString();

  const total = approvedCars.reduce((sum, c) => sum + (c.price || 0), 0);
  this.stats[3].value = 'PKR ' + total.toLocaleString();

  this.recentAds = [...this.allCars]
    .sort((a, b) => this.getTime(b.submittedAt) - this.getTime(a.submittedAt))
    .slice(0, 5)
    .map(c => ({
      car: `${c.year || ''} ${c.make || ''} ${c.model || ''}`.trim() || 'Unknown',
      user: c.ownerName || '—',
      status: c.status || 'pending'
    }));

  this.recentUsers = [...this.allUsers]
    .sort((a, b) => this.getTime(b.createdAt) - this.getTime(a.createdAt))
    .slice(0, 5)
    .map(u => {
      const userId = u.uid || u.id;
      const adsCount = this.allCars.filter(c => c.sellerId === userId).length;
      return {
        name: u.name || 'Unknown',
        ads: adsCount,
        status: u.isActive === false ? 'banned' : 'active'
      };
    });

  this.loading = false;
  this.cdr.detectChanges();
}
}