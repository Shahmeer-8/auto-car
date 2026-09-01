import { Injectable, computed, signal } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/firebase';

export interface SiteAttributes {
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  /** Ticked by the seller on the listing form and shown on the car detail page. */
  features: string[];
  conditions: string[];
}

/** Fallbacks used until the admin doc loads (and if it is missing/empty). */
export const DEFAULT_ATTRIBUTES: SiteAttributes = {
  makes: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Daihatsu', 'Lexus', 'Isuzu', 'Mercedes Benz', 'BMW', 'Volkswagen', 'Audi', 'Other'],
  bodyTypes: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Pickup', 'Van', 'Wagon', 'Crossover'],
  fuelTypes: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG'],
  transmissions: ['Automatic', 'Manual', 'CVT'],
  features: [
    'Apple CarPlay / Android Auto',
    'Heated Seats',
    'Sat Nav',
    'Parking Sensors',
    'Panoramic Roof',
    'Cruise Control',
  ],
  conditions: ['Excellent', 'Good', 'Fair', 'Write-Off / Salvage'],
};

/** Site-wide car attribute lists, managed by admins at /admin/categories (Firestore config/attributes). */
@Injectable({ providedIn: 'root' })
export class AttributesService {
  private readonly db = getFirebaseDb();
  readonly attributes = signal<SiteAttributes>(DEFAULT_ATTRIBUTES);

  readonly makes = computed(() => this.attributes().makes);
  readonly bodyTypes = computed(() => this.attributes().bodyTypes);
  readonly fuelTypes = computed(() => this.attributes().fuelTypes);
  readonly transmissions = computed(() => this.attributes().transmissions);
  readonly features = computed(() => this.attributes().features);
  readonly conditions = computed(() => this.attributes().conditions);

  constructor() {
    void this.load();
  }

  /** Re-reads the admin doc (call after saving in the admin UI). */
  async load(): Promise<void> {
    try {
      const snap = await getDoc(doc(this.db, 'config', 'attributes'));
      if (!snap.exists()) return;
      const data = snap.data() as Partial<SiteAttributes>;
      const merged: SiteAttributes = { ...DEFAULT_ATTRIBUTES };
      (Object.keys(merged) as (keyof SiteAttributes)[]).forEach((k) => {
        const v = data[k];
        if (Array.isArray(v) && v.length) merged[k] = v.filter((s) => typeof s === 'string' && s.trim());
      });
      this.attributes.set(merged);
    } catch {
      // offline / rules issue — keep defaults
    }
  }
}
