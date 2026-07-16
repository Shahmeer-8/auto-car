import { Injectable, signal } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/firebase';

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  contactEmail: string;
  contactPhone: string;
  footerText: string;
}

/** Defaults mirror the current hardcoded site copy so nothing changes visually
 *  until the admin saves values in /admin/content. */
export const DEFAULT_CONTENT: SiteContent = {
  heroTitle: '',
  heroSubtitle: '1,200+ Quality JDM Vehicles — Low Mileage, Inspected & Ready to Ship',
  aboutText: '',
  contactEmail: '',
  contactPhone: '+81 48 990 6633',
  footerText: '© 2025 AutoFlex — Motors Co., Ltd. All rights reserved.',
};

/** Public-site reader for the CMS document `config/content` (edited in /admin/content). */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly db = getFirebaseDb();
  readonly content = signal<SiteContent>(DEFAULT_CONTENT);
  /** Only the fields actually saved in Firestore (non-empty) — lets pages
   *  distinguish admin-provided values from built-in defaults. */
  readonly saved = signal<Partial<SiteContent>>({});

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const snap = await getDoc(doc(this.db, 'config', 'content'));
      if (!snap.exists()) return;
      const data = snap.data() as Partial<SiteContent>;
      const merged: SiteContent = { ...DEFAULT_CONTENT };
      const savedFields: Partial<SiteContent> = {};
      (Object.keys(merged) as (keyof SiteContent)[]).forEach((k) => {
        const v = data[k];
        if (typeof v === 'string' && v.trim()) {
          merged[k] = v;
          savedFields[k] = v;
        }
      });
      this.saved.set(savedFields);
      this.content.set(merged);
    } catch {
      // offline or rules issue: keep defaults
    }
  }
}
