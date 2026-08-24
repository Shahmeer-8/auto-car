import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';
import { AttributesService } from '../../core/services/attributes.service';

const DEFAULT_MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki',
  'Daihatsu', 'Lexus', 'Isuzu', 'Mercedes Benz', 'BMW', 'Volkswagen', 'Audi', 'Other'
];
const DEFAULT_BODY_TYPES = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Pickup', 'Van', 'Wagon', 'Crossover'
];
const DEFAULT_FUEL_TYPES = [
  'Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG'
];
const DEFAULT_TRANSMISSIONS = [
  'Automatic', 'Manual', 'CVT'
];

@Component({
  selector: 'app-admin-categories',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css'
})
export class AdminCategories implements OnInit {
  private db = getFirebaseDb();
  private attributes = inject(AttributesService);

  makes: string[] = [];
  bodyTypes: string[] = [];
  fuelTypes: string[] = [];
  transmissions: string[] = [];

  loading = true;
  saving = false;
  saved = false;

  newMake = '';
  newBodyType = '';
  newFuelType = '';
  newTransmission = '';

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      const snap = await getDoc(doc(this.db, 'config', 'attributes'));
      if (snap.exists()) {
        const data = snap.data() as {
          makes?: string[];
          bodyTypes?: string[];
          fuelTypes?: string[];
          transmissions?: string[];
        };
        this.makes = data.makes ?? [...DEFAULT_MAKES];
        this.bodyTypes = data.bodyTypes ?? [...DEFAULT_BODY_TYPES];
        this.fuelTypes = data.fuelTypes ?? [...DEFAULT_FUEL_TYPES];
        this.transmissions = data.transmissions ?? [...DEFAULT_TRANSMISSIONS];
      } else {
        this.makes = [...DEFAULT_MAKES];
        this.bodyTypes = [...DEFAULT_BODY_TYPES];
        this.fuelTypes = [...DEFAULT_FUEL_TYPES];
        this.transmissions = [...DEFAULT_TRANSMISSIONS];
      }
    } catch (err) {
      console.error('Error loading attributes:', err);
      this.makes = [...DEFAULT_MAKES];
      this.bodyTypes = [...DEFAULT_BODY_TYPES];
      this.fuelTypes = [...DEFAULT_FUEL_TYPES];
      this.transmissions = [...DEFAULT_TRANSMISSIONS];
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  addMake() {
    const value = this.newMake.trim();
    if (value && !this.makes.includes(value)) {
      this.makes.push(value);
    }
    this.newMake = '';
  }

  removeMake(i: number) {
    this.makes.splice(i, 1);
  }

  addBodyType() {
    const value = this.newBodyType.trim();
    if (value && !this.bodyTypes.includes(value)) {
      this.bodyTypes.push(value);
    }
    this.newBodyType = '';
  }

  removeBodyType(i: number) {
    this.bodyTypes.splice(i, 1);
  }

  addFuelType() {
    const value = this.newFuelType.trim();
    if (value && !this.fuelTypes.includes(value)) {
      this.fuelTypes.push(value);
    }
    this.newFuelType = '';
  }

  removeFuelType(i: number) {
    this.fuelTypes.splice(i, 1);
  }

  addTransmission() {
    const value = this.newTransmission.trim();
    if (value && !this.transmissions.includes(value)) {
      this.transmissions.push(value);
    }
    this.newTransmission = '';
  }

  removeTransmission(i: number) {
    this.transmissions.splice(i, 1);
  }

  async save() {
    this.saving = true;
    try {
      await setDoc(
        doc(this.db, 'config', 'attributes'),
        {
          makes: this.makes,
          bodyTypes: this.bodyTypes,
          fuelTypes: this.fuelTypes,
          transmissions: this.transmissions
        },
        { merge: true }
      );
      this.saved = true;
      await this.attributes.load();
    } catch (err) {
      console.error('Error saving attributes:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}
