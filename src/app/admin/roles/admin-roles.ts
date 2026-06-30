import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-roles',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-roles.html',
  styleUrl: './admin-roles.css'
})
export class AdminRoles implements OnInit {
  private db = getFirebaseDb();
  users: any[] = [];
  loading = true;
  readonly roleOptions = ['buyer', 'seller', 'admin'];

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      const snap = await getDocs(collection(this.db, 'users'));
      this.users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error loading users:', err);
      this.users = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async changeRole(user: any, newType: string) {
    if (newType === user.userType) return;
    const prev = user.userType;
    user.userType = newType;
    try {
      await updateDoc(doc(this.db, 'users', user.id), { userType: newType });
    } catch (err) {
      console.error('Error changing role:', err);
      user.userType = prev;
      alert('Failed to change role. Please try again.');
    } finally {
      this.cdr.detectChanges();
    }
  }

  async toggleActive(user: any) {
    const newStatus = !user.isActive;
    try {
      await updateDoc(doc(this.db, 'users', user.id), { isActive: newStatus });
      user.isActive = newStatus;
    } catch (err) {
      console.error('Error toggling active status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      this.cdr.detectChanges();
    }
  }
}
