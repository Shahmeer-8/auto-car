import { Injectable, signal } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/firebase';

/** Checkout / payment settings, managed by admins (Firestore doc `config/checkout`). */
export interface CheckoutSettings {
  /** Booking deposit as a percentage of the car price. */
  depositPercent: number;
  /** Floor for the deposit, in the site currency. */
  minDeposit: number;
  /** Ceiling for the deposit (0 = no cap). */
  maxDeposit: number;
  currencySymbol: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  /** Digits only, used to build the wa.me link on the confirmation page. */
  whatsapp: string;
  instructions: string;
}

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  depositPercent: 5,
  minDeposit: 25000,
  maxDeposit: 0,
  currencySymbol: '$',
  bankName: 'Meezan Bank',
  accountTitle: 'AutoFlex Motors',
  accountNumber: '0123-4567890123',
  iban: 'PK00MEZN0001234567890123',
  whatsapp: '818027439931',
  instructions:
    'Transfer the booking deposit to the account above, then submit your transfer reference below. Our team verifies payments within one business day and contacts you to arrange inspection and handover. The deposit is refundable if the vehicle does not match its listing.',
};

@Injectable({ providedIn: 'root' })
export class CheckoutSettingsService {
  private readonly db = getFirebaseDb();
  readonly settings = signal<CheckoutSettings>(DEFAULT_CHECKOUT_SETTINGS);

  constructor() {
    void this.load();
  }

  /** Re-reads the admin doc (call after saving in the admin UI). */
  async load(): Promise<void> {
    try {
      const snap = await getDoc(doc(this.db, 'config', 'checkout'));
      if (!snap.exists()) return;
      const data = snap.data() as Partial<CheckoutSettings>;
      const merged: CheckoutSettings = { ...DEFAULT_CHECKOUT_SETTINGS };
      (Object.keys(merged) as (keyof CheckoutSettings)[]).forEach((k) => {
        const v = data[k];
        if (typeof merged[k] === 'number') {
          if (typeof v === 'number' && !isNaN(v)) (merged[k] as number) = v;
        } else if (typeof v === 'string' && v.trim()) {
          (merged[k] as string) = v;
        }
      });
      this.settings.set(merged);
    } catch {
      // offline / rules issue — keep defaults
    }
  }

  /** Booking deposit for a car price, honouring the configured percent/min/max. */
  depositFor(price: number): number {
    const s = this.settings();
    const raw = (Number(price) || 0) * (s.depositPercent / 100);
    let deposit = Math.max(raw, s.minDeposit);
    if (s.maxDeposit > 0) deposit = Math.min(deposit, s.maxDeposit);
    // Never ask for more than the car costs.
    deposit = Math.min(deposit, Number(price) || 0);
    return Math.round(deposit);
  }

  format(amount: number): string {
    return this.settings().currencySymbol + Number(amount || 0).toLocaleString();
  }
}
