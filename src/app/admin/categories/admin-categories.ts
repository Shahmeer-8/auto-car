import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';
import {
  AttributesService,
  DEFAULT_ATTRIBUTES,
  SiteAttributes,
} from '../../core/services/attributes.service';

/** One editable list on the page; `key` is the field inside config/attributes. */
interface AttributeList {
  key: keyof SiteAttributes;
  title: string;
  hint: string;
  placeholder: string;
  values: string[];
  draft: string;
}

@Component({
  selector: 'app-admin-categories',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css'
})
export class AdminCategories implements OnInit {
  private db = getFirebaseDb();
  private attributes = inject(AttributesService);

  /** Every list rendered on the page — add one entry here to add a new attribute list. */
  lists: AttributeList[] = [
    {
      key: 'makes',
      title: 'Car Makes',
      hint: 'Shown in the home page brand cards, the /cars filter and the Sell Your Car form.',
      placeholder: 'Add make...',
      values: [],
      draft: '',
    },
    {
      key: 'bodyTypes',
      title: 'Body Types',
      hint: 'Drives the header/footer "Shop by Type" menus and the body type filter.',
      placeholder: 'Add body type...',
      values: [],
      draft: '',
    },
    {
      key: 'fuelTypes',
      title: 'Fuel Types',
      hint: 'Choosing an electric/hybrid fuel type asks the seller for battery range.',
      placeholder: 'Add fuel type...',
      values: [],
      draft: '',
    },
    {
      key: 'transmissions',
      title: 'Transmissions',
      hint: 'Options for the transmission dropdown on the listing form.',
      placeholder: 'Add transmission...',
      values: [],
      draft: '',
    },
    {
      key: 'features',
      title: 'Vehicle Features',
      hint: 'Tick-boxes the seller picks from, e.g. CarPlay, heated seats, sat nav.',
      placeholder: 'Add feature...',
      values: [],
      draft: '',
    },
    {
      key: 'conditions',
      title: 'Vehicle Conditions',
      hint: 'Condition choices on the listing form, e.g. Excellent / Write-Off.',
      placeholder: 'Add condition...',
      values: [],
      draft: '',
    },
  ];

  loading = true;
  saving = false;
  saved = false;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    let data: Partial<SiteAttributes> = {};
    try {
      const snap = await getDoc(doc(this.db, 'config', 'attributes'));
      if (snap.exists()) data = snap.data() as Partial<SiteAttributes>;
    } catch (err) {
      console.error('Error loading attributes:', err);
    }

    for (const list of this.lists) {
      const stored = data[list.key];
      list.values = Array.isArray(stored) && stored.length
        ? [...stored]
        : [...DEFAULT_ATTRIBUTES[list.key]];
    }

    this.loading = false;
    // Firestore resolves outside Angular's zone — force the view to update.
    this.cdr.detectChanges();
  }

  add(list: AttributeList) {
    const value = list.draft.trim();
    if (value && !list.values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      list.values.push(value);
      this.saved = false;
    }
    list.draft = '';
  }

  remove(list: AttributeList, index: number) {
    list.values.splice(index, 1);
    this.saved = false;
  }

  async save() {
    this.saving = true;
    try {
      const payload: Partial<SiteAttributes> = {};
      for (const list of this.lists) {
        payload[list.key] = list.values;
      }

      await setDoc(doc(this.db, 'config', 'attributes'), payload, { merge: true });
      this.saved = true;
      // Refresh the shared service so the storefront picks the change up at once.
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
