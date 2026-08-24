import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';
import {
  CheckoutSettings,
  CheckoutSettingsService,
  DEFAULT_CHECKOUT_SETTINGS,
} from '../../core/services/checkout-settings.service';

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

  /** Checkout / payment settings used by the car buying flow (config/checkout). */
  checkoutModel: CheckoutSettings = { ...DEFAULT_CHECKOUT_SETTINGS };

  private readonly checkoutSettings = inject(CheckoutSettingsService);

  loading = true;
  saving = false;
  saved = false;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      const [contentSnap, checkoutSnap] = await Promise.all([
        getDoc(doc(this.db, 'config', 'content')),
        getDoc(doc(this.db, 'config', 'checkout')),
      ]);
      if (contentSnap.exists()) {
        Object.assign(this.model, contentSnap.data());
      }
      if (checkoutSnap.exists()) {
        Object.assign(this.checkoutModel, checkoutSnap.data());
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
      await Promise.all([
        setDoc(doc(this.db, 'config', 'content'), { ...this.model }, { merge: true }),
        setDoc(
          doc(this.db, 'config', 'checkout'),
          {
            ...this.checkoutModel,
            depositPercent: Number(this.checkoutModel.depositPercent) || 0,
            minDeposit: Number(this.checkoutModel.minDeposit) || 0,
            maxDeposit: Number(this.checkoutModel.maxDeposit) || 0,
          },
          { merge: true },
        ),
      ]);
      // Refresh the shared service so the storefront picks the change up immediately.
      await this.checkoutSettings.load();
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
