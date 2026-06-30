import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-complaints',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-complaints.html',
  styleUrl: './admin-complaints.css'
})
export class AdminComplaints implements OnInit {
  private db = getFirebaseDb();
  complaints: any[] = [];
  loading = true;
  filter: 'all' | 'open' | 'resolved' = 'all';

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.loadComplaints();
  }

  async loadComplaints() {
    this.loading = true;
    try {
      const snap = await getDocs(collection(this.db, 'complaints'));
      this.complaints = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.complaints.sort((a, b) => this.getTime(b.createdAt) - this.getTime(a.createdAt));
    } catch (err) {
      console.error('Error loading complaints:', err);
      this.complaints = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private getTime(field: any): number {
    if (!field) {
      return 0;
    }
    const fromTimestamp = field?.toDate?.();
    if (fromTimestamp) {
      return fromTimestamp.getTime();
    }
    if (typeof field === 'string') {
      const parsed = new Date(field).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  get filtered(): any[] {
    if (this.filter === 'all') {
      return this.complaints;
    }
    return this.complaints.filter(c => {
      const status = c.status === 'resolved' ? 'resolved' : 'open';
      return status === this.filter;
    });
  }

  setFilter(f: 'all' | 'open' | 'resolved') {
    this.filter = f;
  }

  async markResolved(c: any) {
    try {
      await updateDoc(doc(this.db, 'complaints', c.id), { status: 'resolved' });
      c.status = 'resolved';
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error resolving complaint:', err);
      alert('Failed to resolve complaint.');
    }
  }

  async reopen(c: any) {
    try {
      await updateDoc(doc(this.db, 'complaints', c.id), { status: 'open' });
      c.status = 'open';
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error reopening complaint:', err);
      alert('Failed to reopen complaint.');
    }
  }

  async remove(c: any) {
    if (!confirm('Delete this complaint?')) {
      return;
    }
    try {
      await deleteDoc(doc(this.db, 'complaints', c.id));
      this.complaints = this.complaints.filter(x => x.id !== c.id);
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error deleting complaint:', err);
      alert('Failed to delete complaint.');
    }
  }
}
