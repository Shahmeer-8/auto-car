import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-content',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-content.html',
  styleUrl: './admin-content.css'
})
export class AdminContent implements OnInit {
  private db = getFirebaseDb();

  model = {
    heroTitle: '',
    heroSubtitle: '',
    aboutText: '',
    contactEmail: '',
    contactPhone: '',
    footerText: ''
  };

  loading = true;
  saving = false;
  saved = false;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      const snap = await getDoc(doc(this.db, 'config', 'content'));
      if (snap.exists()) {
        Object.assign(this.model, snap.data());
      }
    } catch (err) {
      console.error('Error loading content:', err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async save() {
    this.saving = true;
    this.saved = false;
    try {
      await setDoc(doc(this.db, 'config', 'content'), { ...this.model }, { merge: true });
      this.saved = true;
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Failed to save. Please try again.');
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }

  onChange() {
    this.saved = false;
  }
}
