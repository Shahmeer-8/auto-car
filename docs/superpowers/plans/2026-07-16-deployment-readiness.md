# AutoFlex Deployment Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AutoFlex marketplace fully functional and deployable: working /cars browse page with filters, CMS content rendered on the public site, working admin notifications, dynamic brand counts, persisted contact/newsletter forms, no dead links, and images stored in Firebase Storage.

**Architecture:** Angular 21 standalone components + Firebase (Auth/Firestore/Storage/Hosting). All fixes are client-side + Firestore security rules changes — no new Cloud Functions (notifications are written client-side under validated rules, so nothing depends on a Blaze-plan Functions deploy). New shared services: `ContentService` (reads `config/content`), extended `NotificationData` (push + role-targeted reads).

**Tech Stack:** Angular 21 (standalone, signals where new code is written), firebase JS SDK v-latest (`firebase/firestore`, `firebase/storage`), Firebase Hosting.

## Global Constraints

- Working directory: `d:\Auto-car\autocar` (git branch `shahmeer`; commit after every task).
- Follow `.claude/CLAUDE.md`: new components use signals, `inject()`, `ChangeDetectionStrategy.OnPush`, native control flow (`@if`/`@for`), no `ngClass`/`ngStyle`. Existing components keep their current style when only lightly edited.
- Never remove existing working behavior; all Firestore writes must keep passing current security rules (rules changes are included where needed).
- Verification per task: `npm run build` must succeed (run from `d:\Auto-car\autocar`). Unit tests (`ng test --watch=false --browsers=ChromeHeadless`) only for the two pure-logic modules (Task 3 filter engine, Task 7 calculator); everything else is verified by build + runtime smoke in Task 10.
- Brand voice: site is "AutoFlex" (Japan JDM import). Do not change branding/theme.
- Firestore collections in play: `cars`, `config/content`, `notifications`, `complaints`, `newsletterSubscribers` (new).

---

### Task 1: ContentService + render CMS content on the public site

The admin CMS (`/admin/content`) edits `config/content` ({heroTitle, heroSubtitle, aboutText, contactEmail, contactPhone, footerText}) but no public page reads it. Create a read service and bind it in the hero, about page, contact page, and footer.

**Files:**
- Create: `src/app/core/services/content.service.ts`
- Modify: `src/app/components/hero-slider/hero-slider.ts` + `hero-slider.html` (hero title/subtitle, lines 20-21 of html)
- Modify: `src/app/about/about.ts` + `about.html` (aboutText)
- Modify: `src/app/contact/contact.ts` + `contact.html` (contactEmail/contactPhone display)
- Modify: `src/app/components/layout/footer/footer.ts` + `footer.html` (contact rows lines 42-55, copyright line 126)

**Interfaces:**
- Produces: `ContentService` (root) with `readonly content: Signal<SiteContent>` and `interface SiteContent { heroTitle: string; heroSubtitle: string; aboutText: string; contactEmail: string; contactPhone: string; footerText: string; }`. Later tasks (Task 2 footer edits) assume `footer.ts` already injects `ContentService` as `content`.

- [ ] **Step 1: Create the service**

```ts
// src/app/core/services/content.service.ts
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

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const snap = await getDoc(doc(this.db, 'config', 'content'));
      if (!snap.exists()) return;
      const data = snap.data() as Partial<SiteContent>;
      const merged: SiteContent = { ...DEFAULT_CONTENT };
      (Object.keys(merged) as (keyof SiteContent)[]).forEach((k) => {
        const v = data[k];
        if (typeof v === 'string' && v.trim()) merged[k] = v;
      });
      this.content.set(merged);
    } catch {
      // offline or rules issue: keep defaults
    }
  }
}
```

- [ ] **Step 2: Hero slider** — in `hero-slider.ts` add `readonly content = inject(ContentService).content;` (import `inject` from `@angular/core` and `ContentService`). In `hero-slider.html` replace lines 20-21:

```html
@if (content().heroTitle) {
  <h1 class="hero-title">{{ content().heroTitle }}</h1>
} @else {
  <h1 class="hero-title">Find Your Perfect<br><span class="hero-highlight">Japanese Car</span></h1>
}
<p class="hero-subtitle">{{ content().heroSubtitle }}</p>
```

(The template already uses `*ngFor` — CommonModule is imported, `@if` works in Angular 21 without extra imports.)

- [ ] **Step 3: About page** — in `about.ts` add `readonly content = inject(ContentService).content;`. In `about.html`, find the main intro/mission paragraph (first substantive `<p>` under the page hero) and wrap it:

```html
@if (content().aboutText) {
  <p>{{ content().aboutText }}</p>
} @else {
  <!-- existing hardcoded paragraph stays here -->
}
```

- [ ] **Step 4: Contact page** — in `contact.ts` add `readonly content = inject(ContentService).content;`. In `contact.html`, find the contact-info sidebar (email/phone display); bind email and phone the same `@if (content().contactEmail) { ... } @else { existing }` way. If the template has no contact-info block, add a small one above the form:

```html
@if (content().contactEmail || content().contactPhone) {
  <div class="cms-contact-info">
    @if (content().contactEmail) { <p>📧 <a href="mailto:{{ content().contactEmail }}">{{ content().contactEmail }}</a></p> }
    @if (content().contactPhone) { <p>📞 {{ content().contactPhone }}</p> }
  </div>
}
```

- [ ] **Step 5: Footer** — in `footer.ts`:

```ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class Footer {
  readonly content = inject(ContentService).content;
}
```

In `footer.html`: phone row (line 49) becomes `<span>{{ content().contactPhone }}</span>`; after the phone row add an email row shown only when set:

```html
@if (content().contactEmail) {
  <div class="bc-row">
    <span class="ico">📧</span>
    <a href="mailto:{{ content().contactEmail }}">{{ content().contactEmail }}</a>
  </div>
}
```

Copyright (line 126) becomes: `<p class="copy">{{ content().footerText }}</p>`.

- [ ] **Step 6: Build** — Run: `npm run build`. Expected: success, no template errors.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(cms): render config/content on hero, about, contact, footer"`

---

### Task 2: Footer cleanup + Privacy/Terms pages + remove dead legal links

**Files:**
- Modify: `src/app/components/layout/footer/footer.html` (Quick Links lines 81-92, Company lines 108-118, bottom bar lines 123-133)
- Create: `src/app/legal/privacy.ts`, `src/app/legal/terms.ts` (standalone, inline template, static content)
- Modify: `src/app/app.routes.ts`

**Interfaces:**
- Produces: routes `/privacy` and `/terms` with components `PrivacyPage`, `TermsPage`.

- [ ] **Step 1: Quick Links** — remove the `Home` and `Cars for Sale` `<li>` entries (user request). Result:

```html
<!-- Quick Links -->
<div class="nav-col">
  <h4>Quick Links</h4>
  <ul>
    <li><a routerLink="/guides">JDM Guides</a></li>
    <li><a routerLink="/cars" [queryParams]="{sort: 'ranking'}">Car Rankings</a></li>
    <li><a routerLink="/cars" [queryParams]="{compare: 'true'}">Comparisons</a></li>
    <li><a routerLink="/guides">Popular Studies</a></li>
  </ul>
</div>
```

- [ ] **Step 2: Company column** — remove the Sitemap `<li>` (no such page); keep About/Contact/Privacy/Terms. In the bottom bar remove the `Cookies` dead link (`<a href="#">Cookies</a>`).

- [ ] **Step 3: Create legal pages** (content is standard boilerplate adapted to AutoFlex; static):

```ts
// src/app/legal/privacy.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <h1>Privacy Policy</h1>
      <p class="updated">Last updated: July 2026</p>
      <section>
        <h2>Information We Collect</h2>
        <p>When you create an account, list a vehicle, or contact us, we collect the information you provide: name, email address, phone number, and vehicle listing details (including photos).</p>
      </section>
      <section>
        <h2>How We Use It</h2>
        <p>Your information is used to operate the AutoFlex marketplace: displaying your listings to buyers, moderating content, responding to enquiries, and sending service notifications you have opted into.</p>
      </section>
      <section>
        <h2>Data Storage</h2>
        <p>Data is stored securely on Google Firebase infrastructure. We do not sell your personal information to third parties.</p>
      </section>
      <section>
        <h2>Your Rights</h2>
        <p>You may edit or delete your listings and account data from your dashboard at any time, or <a routerLink="/contact">contact us</a> to request removal of your data.</p>
      </section>
    </div>
  `,
  styles: `
    .legal-page { max-width: 800px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 2rem; margin-bottom: 4px; }
    .updated { color: #6b7280; margin-bottom: 32px; }
    section { margin-bottom: 24px; }
    h2 { font-size: 1.2rem; margin-bottom: 8px; }
    p { line-height: 1.7; color: #374151; }
  `,
})
export class PrivacyPage {}
```

```ts
// src/app/legal/terms.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="legal-page">
      <h1>Terms of Service</h1>
      <p class="updated">Last updated: July 2026</p>
      <section>
        <h2>Use of the Marketplace</h2>
        <p>AutoFlex provides a platform for listing and browsing used vehicles. You must provide accurate information in your listings. All new listings are reviewed by our team before publication.</p>
      </section>
      <section>
        <h2>Listings &amp; Content</h2>
        <p>You retain ownership of the content you post but grant AutoFlex the right to display it on the platform. Listings that are fraudulent, misleading, or inappropriate will be rejected or removed.</p>
      </section>
      <section>
        <h2>Transactions</h2>
        <p>AutoFlex connects buyers and sellers. Unless explicitly stated, AutoFlex is not a party to transactions between users; verify vehicle condition and documentation before purchase.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about these terms? <a routerLink="/contact">Contact us</a>.</p>
      </section>
    </div>
  `,
  styles: `
    .legal-page { max-width: 800px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 2rem; margin-bottom: 4px; }
    .updated { color: #6b7280; margin-bottom: 32px; }
    section { margin-bottom: 24px; }
    h2 { font-size: 1.2rem; margin-bottom: 8px; }
    p { line-height: 1.7; color: #374151; }
  `,
})
export class TermsPage {}
```

- [ ] **Step 4: Routes** — in `app.routes.ts` add before the `**` wildcard:

```ts
{ path: 'privacy', loadComponent: () => import('./legal/privacy').then((m) => m.PrivacyPage) },
{ path: 'terms', loadComponent: () => import('./legal/terms').then((m) => m.TermsPage) },
```

- [ ] **Step 5: Build** — `npm run build` → success.
- [ ] **Step 6: Commit** — `git commit -am "feat: privacy/terms pages; footer quick-links + dead-link cleanup"`

---

### Task 3: Rebuild /cars browse page with working filters

`CarsPage` is a stub (no data, no filters, reads path params instead of query params). Rebuild it: load approved cars, apply filters from query params AND on-page controls, render a card grid. Pure filter logic goes in a testable module.

**Files:**
- Create: `src/app/cars/cars.filters.ts` (pure functions)
- Create: `src/app/cars/cars.filters.spec.ts`
- Rewrite: `src/app/cars/cars.ts`, `src/app/cars/cars.html`, `src/app/cars/cars.css`

**Interfaces:**
- Consumes: `CarService.getListedCars()`, `CarService.approvedCars$`, `CarListing` model.
- Produces: `interface CarFilters { make: string; model: string; body: string; maxPrice: number | null; minYear: number | null; transmission: string; fuelType: string; search: string; sort: SortKey; }`, `type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'year-desc' | 'mileage-asc'`, `function applyFilters(cars: CarListing[], f: CarFilters): CarListing[]`, `function slugify(s: string): string`, `const EMPTY_FILTERS: CarFilters`. Query params consumed: `make`, `model`, `year`, `maxPrice`, `body`, `sort` (plus legacy `/cars/:type` path param mapped to `body`); the sentinel `'all'` and empty strings mean "no filter"; `sort=ranking` maps to `'price-desc'`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/app/cars/cars.filters.spec.ts
import { applyFilters, slugify, EMPTY_FILTERS } from './cars.filters';
import { CarListing } from '../models/car.model';

function car(over: Partial<CarListing>): CarListing {
  return {
    sellerId: 's1', make: 'Toyota', model: 'Corolla', year: 2018, mileage: 50000,
    transmission: 'Automatic', fuelType: 'Petrol', color: 'White', condition: 'Used',
    bodyType: 'Sedan', price: 10000, description: '', location: 'Tokyo', phone: '',
    images: [], ownerName: '', email: '', submittedAt: '2026-01-01T00:00:00.000Z',
    status: 'approved', ...over,
  };
}

describe('slugify', () => {
  it('normalizes spaces, hyphens and case', () => {
    expect(slugify('Sports Car')).toBe('sports-car');
    expect(slugify('sports-car')).toBe('sports-car');
    expect(slugify('  SUV ')).toBe('suv');
  });
});

describe('applyFilters', () => {
  const cars = [
    car({ id: 'a', make: 'Toyota', model: 'Corolla', bodyType: 'Sedan', price: 10000, year: 2018 }),
    car({ id: 'b', make: 'Honda', model: 'Civic', bodyType: 'Sports Car', price: 25000, year: 2022 }),
    car({ id: 'c', make: 'toyota', model: 'Aqua', bodyType: 'Hatchback', price: 8000, year: 2015, mileage: 90000 }),
  ];

  it('no filters returns everything', () => {
    expect(applyFilters(cars, EMPTY_FILTERS).length).toBe(3);
  });

  it('filters by make case-insensitively and treats "all" as no-op', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, make: 'TOYOTA' }).map(c => c.id)).toEqual(['a', 'c']);
    expect(applyFilters(cars, { ...EMPTY_FILTERS, make: 'all' }).length).toBe(3);
  });

  it('matches body type by slug (sports-car ↔ Sports Car)', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, body: 'sports-car' }).map(c => c.id)).toEqual(['b']);
  });

  it('coerces numeric filters (string query params)', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, maxPrice: Number('10000') }).map(c => c.id)).toEqual(['a', 'c']);
    expect(applyFilters(cars, { ...EMPTY_FILTERS, minYear: 2018 }).map(c => c.id)).toEqual(['a', 'b']);
  });

  it('free-text search matches make/model/location', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, search: 'civ' }).map(c => c.id)).toEqual(['b']);
  });

  it('sorts by price ascending', () => {
    expect(applyFilters(cars, { ...EMPTY_FILTERS, sort: 'price-asc' }).map(c => c.id)).toEqual(['c', 'a', 'b']);
  });

  it('sorts newest first by submittedAt by default', () => {
    const list = [
      car({ id: 'old', submittedAt: '2025-01-01T00:00:00.000Z' }),
      car({ id: 'new', submittedAt: '2026-06-01T00:00:00.000Z' }),
    ];
    expect(applyFilters(list, EMPTY_FILTERS).map(c => c.id)).toEqual(['new', 'old']);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail** — `ng test --watch=false --browsers=ChromeHeadless --include="**/cars.filters.spec.ts"`. Expected: FAIL (module not found). If ChromeHeadless is unavailable on this machine, note it and rely on the implementation + build (do not delete the spec).

- [ ] **Step 3: Implement the filter engine**

```ts
// src/app/cars/cars.filters.ts
import { CarListing } from '../models/car.model';

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'year-desc' | 'mileage-asc';

export interface CarFilters {
  make: string;
  model: string;
  body: string;
  maxPrice: number | null;
  minYear: number | null;
  transmission: string;
  fuelType: string;
  search: string;
  sort: SortKey;
}

export const EMPTY_FILTERS: CarFilters = {
  make: '', model: '', body: '', maxPrice: null, minYear: null,
  transmission: '', fuelType: '', search: '', sort: 'newest',
};

/** 'Sports Car' / 'sports-car' / ' SUV ' → 'sports-car' / 'suv' */
export function slugify(s: string): string {
  return (s || '').toLowerCase().trim().replace(/[\s_-]+/g, '-');
}

function isSet(v: string): boolean {
  return !!v && v.toLowerCase() !== 'all';
}

export function applyFilters(cars: CarListing[], f: CarFilters): CarListing[] {
  const out = cars.filter((c) => {
    if (isSet(f.make) && slugify(c.make) !== slugify(f.make)) return false;
    if (isSet(f.model) && slugify(c.model) !== slugify(f.model)) return false;
    if (isSet(f.body) && slugify(c.bodyType) !== slugify(f.body)) return false;
    if (isSet(f.transmission) && slugify(c.transmission) !== slugify(f.transmission)) return false;
    if (isSet(f.fuelType) && slugify(c.fuelType) !== slugify(f.fuelType)) return false;
    if (f.maxPrice != null && Number(c.price) > f.maxPrice) return false;
    if (f.minYear != null && Number(c.year) < f.minYear) return false;
    if (f.search.trim()) {
      const hay = `${c.make} ${c.model} ${c.location} ${c.bodyType}`.toLowerCase();
      if (!hay.includes(f.search.trim().toLowerCase())) return false;
    }
    return true;
  });

  const by = {
    'newest': (a: CarListing, b: CarListing) => (b.submittedAt || '').localeCompare(a.submittedAt || ''),
    'price-asc': (a: CarListing, b: CarListing) => Number(a.price) - Number(b.price),
    'price-desc': (a: CarListing, b: CarListing) => Number(b.price) - Number(a.price),
    'year-desc': (a: CarListing, b: CarListing) => Number(b.year) - Number(a.year),
    'mileage-asc': (a: CarListing, b: CarListing) => Number(a.mileage) - Number(b.mileage),
  }[f.sort] ?? ((a: CarListing, b: CarListing) => 0);

  return [...out].sort(by);
}
```

- [ ] **Step 4: Run tests, verify they pass** — same command as Step 2. Expected: PASS.

- [ ] **Step 5: Rewrite the component**

```ts
// src/app/cars/cars.ts
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CarService } from '../services/car.service';
import { CarListing } from '../models/car.model';
import { CarFilters, EMPTY_FILTERS, SortKey, applyFilters, slugify } from './cars.filters';

@Component({
  selector: 'app-cars',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cars.html',
  styleUrls: ['./cars.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarsPage implements OnInit, OnDestroy {
  private readonly carService = inject(CarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subs = new Subscription();

  readonly cars = signal<CarListing[]>([]);
  readonly loading = signal(true);
  readonly filters = signal<CarFilters>({ ...EMPTY_FILTERS });

  readonly filtered = computed(() => applyFilters(this.cars(), this.filters()));

  readonly makes = computed(() =>
    [...new Set(this.cars().map((c) => c.make?.trim()).filter(Boolean))].sort());
  readonly modelsForMake = computed(() => {
    const mk = slugify(this.filters().make);
    const pool = mk && mk !== 'all' ? this.cars().filter((c) => slugify(c.make) === mk) : this.cars();
    return [...new Set(pool.map((c) => c.model?.trim()).filter(Boolean))].sort();
  });
  readonly bodyTypes = computed(() =>
    [...new Set(this.cars().map((c) => c.bodyType?.trim()).filter(Boolean))].sort());

  ngOnInit(): void {
    this.carService.getListedCars()
      .then((cars) => this.cars.set(cars))
      .finally(() => this.loading.set(false));
    this.subs.add(this.carService.approvedCars$.subscribe((cars) => this.cars.set(cars)));

    this.subs.add(this.route.queryParams.subscribe((p) => {
      const sortParam = p['sort'] === 'ranking' ? 'price-desc' : p['sort'];
      const legalSorts: SortKey[] = ['newest', 'price-asc', 'price-desc', 'year-desc', 'mileage-asc'];
      this.filters.update((f) => ({
        ...f,
        make: p['make'] && p['make'] !== 'all' ? p['make'] : '',
        model: p['model'] && p['model'] !== 'all' ? p['model'] : '',
        body: p['body'] ?? '',
        maxPrice: p['maxPrice'] && !isNaN(Number(p['maxPrice'])) ? Number(p['maxPrice']) : null,
        minYear: p['year'] && !isNaN(Number(p['year'])) ? Number(p['year']) : null,
        sort: legalSorts.includes(sortParam) ? sortParam : 'newest',
      }));
    }));

    this.subs.add(this.route.params.subscribe((p) => {
      if (p['type']) this.filters.update((f) => ({ ...f, body: p['type'] }));
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Called from every on-page control: update state + keep the URL shareable. */
  set<K extends keyof CarFilters>(key: K, value: CarFilters[K]): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
    if (key === 'make') this.filters.update((f) => ({ ...f, model: '' }));
    const f = this.filters();
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        make: f.make || null,
        model: f.model || null,
        body: f.body || null,
        maxPrice: f.maxPrice ?? null,
        year: f.minYear ?? null,
        sort: f.sort !== 'newest' ? f.sort : null,
      },
    });
  }

  clearFilters(): void {
    this.filters.set({ ...EMPTY_FILTERS });
    void this.router.navigate([], { relativeTo: this.route, replaceUrl: true, queryParams: {} });
  }

  onSelect(key: 'make' | 'model' | 'body' | 'transmission' | 'fuelType' | 'sort', ev: Event): void {
    this.set(key as keyof CarFilters, (ev.target as HTMLSelectElement).value as never);
  }

  onNumber(key: 'maxPrice' | 'minYear', ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.set(key, v ? Number(v) : null);
  }

  onSearch(ev: Event): void {
    this.set('search', (ev.target as HTMLInputElement).value);
  }

  priceLabel(p: number): string {
    return '$' + Number(p).toLocaleString();
  }
}
```

- [ ] **Step 6: Template**

```html
<!-- src/app/cars/cars.html -->
<div class="cars-page">
  <header class="cars-header">
    <h1>Cars for Sale</h1>
    <p class="sub">{{ filtered().length }} vehicle{{ filtered().length === 1 ? '' : 's' }} available</p>
  </header>

  <div class="cars-layout">
    <!-- Filters -->
    <aside class="filters-panel" aria-label="Filters">
      <div class="filter-group">
        <label for="f-search">Search</label>
        <input id="f-search" type="text" placeholder="Make, model, city…" [value]="filters().search" (input)="onSearch($event)" />
      </div>

      <div class="filter-group">
        <label for="f-make">Make</label>
        <select id="f-make" [value]="filters().make" (change)="onSelect('make', $event)">
          <option value="">All Makes</option>
          @for (m of makes(); track m) { <option [value]="m" [selected]="m === filters().make">{{ m }}</option> }
        </select>
      </div>

      <div class="filter-group">
        <label for="f-model">Model</label>
        <select id="f-model" [value]="filters().model" (change)="onSelect('model', $event)">
          <option value="">All Models</option>
          @for (m of modelsForMake(); track m) { <option [value]="m" [selected]="m === filters().model">{{ m }}</option> }
        </select>
      </div>

      <div class="filter-group">
        <label for="f-body">Body Type</label>
        <select id="f-body" [value]="filters().body" (change)="onSelect('body', $event)">
          <option value="">All Body Types</option>
          @for (b of bodyTypes(); track b) { <option [value]="b" [selected]="b === filters().body">{{ b }}</option> }
        </select>
      </div>

      <div class="filter-group">
        <label for="f-price">Max Price</label>
        <select id="f-price" (change)="onNumber('maxPrice', $event)">
          <option value="" [selected]="filters().maxPrice === null">No Limit</option>
          @for (p of [5000, 10000, 15000, 20000, 30000, 50000, 100000]; track p) {
            <option [value]="p" [selected]="filters().maxPrice === p">{{ priceLabel(p) }}</option>
          }
        </select>
      </div>

      <div class="filter-group">
        <label for="f-year">Min Year</label>
        <select id="f-year" (change)="onNumber('minYear', $event)">
          <option value="" [selected]="filters().minYear === null">Any Year</option>
          @for (y of [2010, 2013, 2015, 2018, 2020, 2022, 2024]; track y) {
            <option [value]="y" [selected]="filters().minYear === y">{{ y }}+</option>
          }
        </select>
      </div>

      <button class="clear-btn" type="button" (click)="clearFilters()">Clear Filters</button>
    </aside>

    <!-- Results -->
    <section class="results" aria-live="polite">
      <div class="results-toolbar">
        <label for="f-sort">Sort by</label>
        <select id="f-sort" [value]="filters().sort" (change)="onSelect('sort', $event)">
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="year-desc">Year: Newest</option>
          <option value="mileage-asc">Mileage: Lowest</option>
        </select>
      </div>

      @if (loading()) {
        <p class="state-msg">Loading vehicles…</p>
      } @else if (filtered().length === 0) {
        <div class="state-msg empty">
          <p>No cars match your filters.</p>
          <button type="button" class="clear-btn" (click)="clearFilters()">Clear all filters</button>
        </div>
      } @else {
        <div class="cars-grid">
          @for (car of filtered(); track car.id) {
            <a class="car-card" [routerLink]="['/car-detail', car.id]">
              <div class="card-img">
                <img [src]="car.images.length ? car.images[0] : 'placeholder-car.svg'" [alt]="car.year + ' ' + car.make + ' ' + car.model" loading="lazy" />
              </div>
              <div class="card-body">
                <h3>{{ car.year }} {{ car.make }} {{ car.model }}</h3>
                <p class="price">{{ priceLabel(car.price) }}</p>
                <p class="meta">{{ car.mileage | number }} km • {{ car.transmission }} • {{ car.fuelType }}</p>
                <p class="loc">📍 {{ car.location }}</p>
              </div>
            </a>
          }
        </div>
      }
    </section>
  </div>
</div>
```

- [ ] **Step 7: Styles** — replace `cars.css` with a responsive grid consistent with the site (match `home.css` card look — check its `.slider-card`/section styles and reuse colors/radii). Layout contract: `.cars-layout { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }` collapsing to one column under 900px; `.cars-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }`; `.car-card` with border-radius, shadow, hover lift; visible focus outline on `.car-card:focus-visible` (WCAG). Write the full CSS in this step during execution using home.css tokens.

- [ ] **Step 8: Build** — `npm run build` → success.
- [ ] **Step 9: Commit** — `git commit -am "feat(cars): functional browse page with filters, sorting, query-param deep links"`

---

### Task 4: Dynamic brand car counts on home

**Files:**
- Modify: `src/app/home/home.ts` (brands array lines 56-67, `buildPopularCars` lines 129-141)
- Modify: `src/app/home/home.html` (brand card count line ~15)

**Interfaces:**
- Consumes: existing approved-cars flow already present in `Home` (`getListedCars()` + `approvedCars$`).
- Produces: `Home.countFor(name: string): number` used by the template.

- [ ] **Step 1: Track approved cars + counts in Home** — in `home.ts`, remove `count` from the brands array and add a counts map computed from the real listings:

```ts
brands = [
  { logo: '🚗', name: 'Toyota' },
  { logo: '🏎️', name: 'Honda' },
  { logo: '🚙', name: 'Nissan' },
  { logo: '🚘', name: 'Mazda' },
  { logo: '🏔️', name: 'Subaru' },
  { logo: '⚡', name: 'Mitsubishi' },
  { logo: '🛻', name: 'Suzuki' },
  { logo: '💎', name: 'Lexus' },
  { logo: '🌟', name: 'Daihatsu' },
  { logo: '🚐', name: 'Isuzu' },
];

private brandCounts = new Map<string, number>();

countFor(name: string): number {
  return this.brandCounts.get(name.toLowerCase()) ?? 0;
}
```

In `buildPopularCars(listedCars)` (which already receives every approved car on load and on updates) add at the top:

```ts
this.brandCounts = new Map();
for (const l of listedCars) {
  const key = (l.make || '').trim().toLowerCase();
  if (!key) continue;
  this.brandCounts.set(key, (this.brandCounts.get(key) ?? 0) + 1);
}
```

- [ ] **Step 2: Template** — in `home.html` change the count line to:

```html
<span class="brand-count">{{ countFor(brand.name) }} {{ countFor(brand.name) === 1 ? 'car' : 'cars' }}</span>
```

- [ ] **Step 3: Build** — `npm run build` → success.
- [ ] **Step 4: Commit** — `git commit -am "feat(home): brand cards show real approved-listing counts"`

---

### Task 5: Notifications end-to-end (rules + client push + role feed + live bell)

Nothing writes `notifications` in production (rules block client create; no Cloud Function triggers exist). Fix client-side: validated client creates via rules, push on key events, admin role-targeted feed, live bell.

**Files:**
- Modify: `firestore.rules` (notifications block lines 93-101)
- Modify: `firestore.indexes.json` (add role+createdAt index)
- Modify: `src/app/core/services/notification.data.ts`
- Modify: `src/app/services/car.service.ts` (createCar)
- Modify: `src/app/admin/reviews/admin-reviews.ts` (approve/reject)
- Modify: `src/app/admin/admin-layout/admin-layout.ts` + `admin-layout.html` (bell lines 111-114)

**Interfaces:**
- Produces: `NotificationData.push(n: NotificationInput): Promise<void>` with `interface NotificationInput { userId?: string; role?: string; title: string; body: string; type: 'info' | 'success' | 'warning' | 'error'; link?: string; }`; `NotificationData.listForCurrentUser(max?)` now also returns role-`'admin'`-targeted items for admins; `NotificationData.unreadCountForCurrentUser(): Promise<number>`.

- [ ] **Step 1: Rules** — replace the notifications match block in `firestore.rules` with:

```
// In-app notifications: recipients read their own; admins also read role-targeted.
// Clients may CREATE validated notifications (unread, typed, size-limited).
match /notifications/{notifId} {
  allow read: if isSignedIn()
    && (resource.data.userId == request.auth.uid || hasPerm('notifications.view') || isAdmin());
  allow update: if isSignedIn()
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read'])
    && (resource.data.userId == request.auth.uid
        || ((hasPerm('notifications.view') || isAdmin()) && resource.data.role != null));
  allow create: if isSignedIn()
    && request.resource.data.read == false
    && request.resource.data.title is string && request.resource.data.title.size() > 0
    && request.resource.data.title.size() <= 200
    && request.resource.data.body is string && request.resource.data.body.size() <= 1000
    && request.resource.data.type in ['info', 'success', 'warning', 'error'];
  allow delete: if hasPerm('notifications.view') || isAdmin();
}
```

- [ ] **Step 2: Index** — in `firestore.indexes.json`, add to the `indexes` array (keep existing entries):

```json
{
  "collectionGroup": "notifications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "role", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

Also verify an entry for `userId ASC + createdAt DESC` on `notifications` exists (the current query needs it); add it too if missing.

- [ ] **Step 3: Extend NotificationData** — rewrite `notification.data.ts`:

```ts
import { Injectable, inject } from '@angular/core';
import {
  addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/firebase';
import { AuthService } from '../../services/auth.service';
import { AppNotification } from '../models/notification.model';

export interface NotificationInput {
  userId?: string;
  role?: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

function toIso(value: unknown): string {
  const v = value as { toDate?: () => Date } | string | undefined;
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    return v.toDate().toISOString();
  }
  return typeof v === 'string' ? v : '';
}

/** In-app notifications for the current user. */
@Injectable({ providedIn: 'root' })
export class NotificationData {
  private readonly db = getFirebaseDb();
  private readonly auth = inject(AuthService);

  /** Fire-and-forget: creating a notification must never break the calling flow. */
  async push(n: NotificationInput): Promise<void> {
    try {
      await addDoc(collection(this.db, 'notifications'), {
        ...(n.userId ? { userId: n.userId } : {}),
        ...(n.role ? { role: n.role } : {}),
        title: n.title,
        body: n.body,
        type: n.type,
        ...(n.link ? { link: n.link } : {}),
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // rules/offline — intentionally swallowed
    }
  }

  async listForCurrentUser(max = 50): Promise<AppNotification[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return [];
    const found = new Map<string, AppNotification>();

    const mine = query(
      collection(this.db, 'notifications'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    for (const d of (await getDocs(mine)).docs) found.set(d.id, this.toModel(d.id, d.data()));

    if (this.auth.isAdmin) {
      try {
        const admins = query(
          collection(this.db, 'notifications'),
          where('role', '==', 'admin'),
          orderBy('createdAt', 'desc'),
          limit(max),
        );
        for (const d of (await getDocs(admins)).docs) found.set(d.id, this.toModel(d.id, d.data()));
      } catch {
        // missing index or rules — user-targeted list still works
      }
    }

    return [...found.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, max);
  }

  async unreadCountForCurrentUser(): Promise<number> {
    const items = await this.listForCurrentUser(50);
    return items.filter((n) => !n.read).length;
  }

  async markRead(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'notifications', id), { read: true });
  }

  private toModel(id: string, data: Record<string, unknown>): AppNotification {
    return {
      id,
      userId: data['userId'] as string | undefined,
      role: data['role'] as string | undefined,
      title: (data['title'] as string) ?? '',
      body: (data['body'] as string) ?? '',
      type: (data['type'] as AppNotification['type']) ?? 'info',
      read: (data['read'] as boolean) ?? false,
      link: (data['link'] as string) ?? undefined,
      createdAt: toIso(data['createdAt']),
    };
  }
}
```

- [ ] **Step 4: Trigger on new listing** — in `car.service.ts`: add `import { inject } from '@angular/core';` usage is not possible in field position with current constructor style — add instead a field `private readonly notifications = inject(NotificationData);` (CarService is `@Injectable`, `inject()` works in field initializers) with `import { inject } from '@angular/core';` and `import { NotificationData } from '../core/services/notification.data';`. In `createCar` after `addDoc` succeeds:

```ts
void this.notifications.push({
  role: 'admin',
  title: 'New listing awaiting review',
  body: `${payload.year} ${payload.make} ${payload.model} — ${payload.location}`,
  type: 'warning',
  link: '/admin/reviews',
});
```

⚠️ Circular-import check: `NotificationData` imports `AuthService`; verify `AuthService` does not import `CarService` (it doesn't today). If a cycle appears, move the push call into `sell-your-car.ts` after `createCar` instead.

- [ ] **Step 5: Trigger on approve/reject** — in `admin-reviews.ts` inject the service (`private readonly notifications = inject(NotificationData);` + imports). The loaded `cars` items include `sellerId`, `make`, `model`, `year`. Update:

```ts
async approve(id: string) {
  const car = this.cars.find(c => c.id === id);
  await updateDoc(doc(this.db, 'cars', id), { status: 'approved' });
  if (car?.sellerId) {
    void this.notifications.push({
      userId: car.sellerId,
      title: 'Your listing was approved 🎉',
      body: `${car.year} ${car.make} ${car.model} is now live on AutoFlex.`,
      type: 'success',
      link: '/dashboard',
    });
  }
  await this.loadPendingCars();
}

async reject(id: string) {
  const reason = prompt('Rejection reason (optional):') || '';
  const car = this.cars.find(c => c.id === id);
  await updateDoc(doc(this.db, 'cars', id), { status: 'rejected', rejectionReason: reason });
  if (car?.sellerId) {
    void this.notifications.push({
      userId: car.sellerId,
      title: 'Your listing was rejected',
      body: reason ? `Reason: ${reason}` : `${car.year} ${car.make} ${car.model} did not pass review.`,
      type: 'error',
      link: '/dashboard',
    });
  }
  await this.loadPendingCars();
}
```

- [ ] **Step 6: Live bell in admin layout** — in `admin-layout.ts` add `readonly unreadCount = signal(0);`, inject `NotificationData`, and in `ngOnInit` (add `OnInit` if the class lacks it): `this.notificationData.unreadCountForCurrentUser().then((c) => this.unreadCount.set(c));`. Replace the decorative bell (admin-layout.html lines 111-114) with:

```html
<button class="icon-btn" type="button" routerLink="/admin/notifications" aria-label="Notifications">
  <span class="material-icons">notifications</span>
  @if (unreadCount() > 0) { <span class="notif-dot"></span> }
</button>
```

(`RouterModule`/`RouterLink` is already imported by the layout for the sidebar links.)

- [ ] **Step 7: Build** — `npm run build` → success.
- [ ] **Step 8: Commit** — `git commit -am "feat(notifications): client-side push under validated rules, admin role feed, live bell"`

---

### Task 6: Persist contact form + guides newsletter

**Files:**
- Modify: `firestore.rules` (complaints block lines 109-114 + new `newsletterSubscribers` block)
- Modify: `src/app/contact/contact.ts` (onSubmit lines 32-70)
- Modify: `src/app/guides/guides.ts` (subscribeNewsletter lines 306-323 — NOTE: lines 318-321 contain stray `\`-prefixed lines; delete them while editing)
- Modify: `src/app/guides/guides.html` (newsletter form area — replace `alert` UX with inline message)

**Interfaces:**
- Consumes: existing admin complaints UI, which renders `c.subject || c.title`, `c.message || c.description`, `c.email || c.userEmail || c.name` — so contact docs written as `{subject, message, email, name, status: 'open', source: 'contact', createdAt}` appear there with zero admin-UI changes.
- Produces: Firestore collections `complaints` (contact docs) and `newsletterSubscribers` (`{email, source, createdAt}`).

- [ ] **Step 1: Rules** — replace the complaints block and add newsletter block:

```
// Complaints & contact messages: signed-in users file complaints; the public
// contact form may also create (validated, always 'open'); staff manage.
match /complaints/{complaintId} {
  allow create: if request.resource.data.status == 'open'
    && request.resource.data.message is string
    && request.resource.data.message.size() > 0
    && request.resource.data.message.size() <= 5000
    && request.resource.data.subject is string
    && request.resource.data.subject.size() <= 300;
  allow read, update, delete: if hasPerm('customers.manage') || isAdmin();
}

// Newsletter signups: public create (email only), staff read/manage.
match /newsletterSubscribers/{subId} {
  allow create: if request.resource.data.email is string
    && request.resource.data.email.size() >= 5
    && request.resource.data.email.size() <= 200
    && request.resource.data.email.matches('.*@.*[.].*');
  allow read, update, delete: if hasPerm('customers.manage') || isAdmin();
}
```

⚠️ The demo seeder creates complaints as signed-in admin — the relaxed create rule stays compatible (it's a superset only requiring `message`/`subject` fields; verify `demo-seed.service.ts` complaint docs include both — if the seeder uses `title`/`description` instead, allow either: use `(request.resource.data.keys().hasAny(['message', 'description']))` style validation instead of the strict `message` check).

- [ ] **Step 2: Contact form persists** — rewrite `onSubmit()` in `contact.ts` (add imports `addDoc, collection, serverTimestamp` from `firebase/firestore`, `getFirebaseDb` from `../core/firebase/firebase`, add field `private db = getFirebaseDb();`):

```ts
async onSubmit() {
  if (!this.contactForm.valid) {
    Object.keys(this.contactForm.controls).forEach(key => {
      this.contactForm.get(key)?.markAsTouched();
    });
    return;
  }

  this.isSubmitting = true;
  this.submitError = false;
  const v = this.contactForm.value;

  try {
    await addDoc(collection(this.db, 'complaints'), {
      subject: `[Contact] ${v.subject}`,
      message: `${v.message}\n\nPhone: ${v.phone || '—'} | Country: ${v.country}`,
      email: v.email,
      name: `${v.firstName} ${v.lastName}`.trim(),
      status: 'open',
      source: 'contact',
      createdAt: serverTimestamp(),
    });

    if (v.newsletter && v.email) {
      try {
        await addDoc(collection(this.db, 'newsletterSubscribers'), {
          email: v.email,
          source: 'contact',
          createdAt: serverTimestamp(),
        });
      } catch { /* newsletter opt-in failure must not fail the contact submit */ }
    }

    this.submitSuccess = true;
    this.contactForm.reset();
    setTimeout(() => { this.submitSuccess = false; }, 5000);
  } catch (err) {
    console.error('Contact submit failed:', err);
    this.submitError = true;
  } finally {
    this.isSubmitting = false;
  }
}
```

(`contact.html` already renders `submitSuccess`/`submitError` states — verify and keep.)

- [ ] **Step 3: Guides newsletter persists** — in `guides.ts` add fields `newsletterSuccess = false; newsletterError = '';` plus `private db = getFirebaseDb();` (+ imports as in Step 2), and replace `subscribeNewsletter` (deleting the stray `\`-prefixed comment lines 318-321):

```ts
async subscribeNewsletter(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
  const email = emailInput?.value?.trim();
  this.newsletterSuccess = false;
  this.newsletterError = '';

  if (!email || !/.+@.+\..+/.test(email)) {
    this.newsletterError = 'Please enter a valid email address.';
    return;
  }

  try {
    await addDoc(collection(this.db, 'newsletterSubscribers'), {
      email,
      source: 'guides',
      createdAt: serverTimestamp(),
    });
    this.newsletterSuccess = true;
    form.reset();
  } catch (err) {
    console.error('Newsletter subscribe failed:', err);
    this.newsletterError = 'Subscription failed. Please try again.';
  }
}
```

In `guides.html`, directly below the newsletter form add:

```html
@if (newsletterSuccess) {
  <p class="newsletter-msg success" role="status">Thank you for subscribing! You'll receive our weekly JDM insights.</p>
}
@if (newsletterError) {
  <p class="newsletter-msg error" role="alert">{{ newsletterError }}</p>
}
```

with minimal CSS in `guides.css`: `.newsletter-msg { margin-top: 10px; font-size: 14px; } .newsletter-msg.success { color: #16a34a; } .newsletter-msg.error { color: #dc2626; }`.

- [ ] **Step 4: Build** — `npm run build` → success.
- [ ] **Step 5: Commit** — `git commit -am "feat: contact form + newsletter persist to Firestore (visible in admin complaints)"`

---

### Task 7: Kill dead links — guide detail page + resource tools

Dead targets today: `/guide/:index` (home sliders), `/guide/:slug` (guides cards), `/calculator`, `/checklist`, `/decoder` (guides resources). All silently redirect to home.

**Files:**
- Create: `src/app/guides/guide-detail.ts` (+ external html/css only if template exceeds ~80 lines, else inline)
- Create: `src/app/tools/loan-calculator.ts`, `src/app/tools/loan-calculator.spec.ts`, `src/app/tools/inspection-checklist.ts`, `src/app/tools/chassis-decoder.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/guides/guides.ts` / `guides.html` (card links), `src/app/home/home.data.ts` (lines ~393, 421, 429 guide links)

**Interfaces:**
- Consumes: the guides dataset currently defined inside `guides.ts` (`allGuides` array with title/excerpt/image/author/etc.). Extract it to `src/app/guides/guides.data.ts` exporting `GUIDES_DATA` and `export function guideSlug(title: string): string` (lowercase, non-alphanumeric → `-`).
- Produces: routes `/guides/:slug`, `/calculator`, `/checklist`, `/decoder`; `export function monthlyPayment(price: number, down: number, aprPct: number, months: number): number` in `loan-calculator.ts`.

- [ ] **Step 1: Extract guides data** — move the `allGuides` array literal from `guides.ts` into `src/app/guides/guides.data.ts` as `export const GUIDES_DATA = [ ...same objects... ];` and add:

```ts
export function guideSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
```

`guides.ts` imports `GUIDES_DATA` and keeps behavior identical (`allGuides = GUIDES_DATA;`).

- [ ] **Step 2: Guide detail component**

```ts
// src/app/guides/guide-detail.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { GUIDES_DATA, guideSlug } from './guides.data';

@Component({
  selector: 'app-guide-detail',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (guide(); as g) {
      <article class="guide-detail">
        <img class="hero-img" [src]="g.image" [alt]="g.title" />
        <div class="body">
          <h1>{{ g.title }}</h1>
          <p class="meta">{{ g.category }} • {{ g.readTime }}</p>
          <p class="lead">{{ g.excerpt }}</p>
          <div class="cta">
            <a routerLink="/cars" class="btn primary">Browse Cars for Sale</a>
            <a routerLink="/guides" class="btn">More Guides</a>
          </div>
          <h2>Related guides</h2>
          <ul class="related">
            @for (r of related(); track r.title) {
              <li><a [routerLink]="['/guides', slugOf(r.title)]">{{ r.title }}</a></li>
            }
          </ul>
        </div>
      </article>
    } @else {
      <div class="guide-detail missing">
        <h1>Guide not found</h1>
        <p><a routerLink="/guides">Back to all guides</a></p>
      </div>
    }
  `,
  styles: `
    .guide-detail { max-width: 860px; margin: 0 auto; padding: 32px 20px 80px; }
    .hero-img { width: 100%; max-height: 420px; object-fit: cover; border-radius: 12px; }
    h1 { margin: 24px 0 4px; font-size: 2rem; }
    .meta { color: #6b7280; margin-bottom: 20px; }
    .lead { font-size: 1.1rem; line-height: 1.8; color: #374151; }
    .cta { display: flex; gap: 12px; margin: 28px 0 40px; flex-wrap: wrap; }
    .btn { padding: 10px 22px; border-radius: 8px; border: 1px solid #d1d5db; text-decoration: none; color: inherit; }
    .btn.primary { background: #e8452e; border-color: #e8452e; color: #fff; }
    h2 { font-size: 1.25rem; margin-bottom: 12px; }
    .related { line-height: 2; }
    .missing { text-align: center; padding-top: 80px; }
  `,
})
export class GuideDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);

  readonly guide = computed(() => {
    const slug = this.params()?.get('slug') ?? '';
    return GUIDES_DATA.find((g) => guideSlug(g.title) === slug) ?? null;
  });

  readonly related = computed(() => {
    const g = this.guide();
    if (!g) return [];
    return GUIDES_DATA.filter((x) => x !== g && x.category === g.category).slice(0, 4);
  });

  slugOf(title: string): string {
    return guideSlug(title);
  }
}
```

⚠️ Field names (`category`, `readTime`, `image`, `excerpt`) must match the actual `GUIDES_DATA` objects — adjust bindings to the real fields found in Step 1 (drop any that don't exist).

- [ ] **Step 3: Loan calculator (TDD)** — spec first:

```ts
// src/app/tools/loan-calculator.spec.ts
import { monthlyPayment } from './loan-calculator';

describe('monthlyPayment', () => {
  it('computes a standard amortized payment', () => {
    // $20,000 - $5,000 down, 6% APR, 36 months → ≈ $456.33
    expect(monthlyPayment(20000, 5000, 6, 36)).toBeCloseTo(456.33, 1);
  });
  it('handles 0% APR as simple division', () => {
    expect(monthlyPayment(12000, 0, 0, 12)).toBe(1000);
  });
  it('returns 0 for a fully-covered down payment or bad input', () => {
    expect(monthlyPayment(10000, 10000, 5, 36)).toBe(0);
    expect(monthlyPayment(10000, 0, 5, 0)).toBe(0);
  });
});
```

Run `ng test --watch=false --browsers=ChromeHeadless --include="**/loan-calculator.spec.ts"` → FAIL. Then implement:

```ts
// src/app/tools/loan-calculator.ts
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export function monthlyPayment(price: number, down: number, aprPct: number, months: number): number {
  const principal = price - down;
  if (principal <= 0 || months <= 0) return 0;
  if (aprPct <= 0) return Math.round((principal / months) * 100) / 100;
  const r = aprPct / 100 / 12;
  const m = (principal * r) / (1 - Math.pow(1 + r, -months));
  return Math.round(m * 100) / 100;
}

@Component({
  selector: 'app-loan-calculator',
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-page">
      <h1>Car Loan Calculator</h1>
      <p class="sub">Estimate your monthly payment for an imported vehicle.</p>
      <form class="calc-form">
        <label>Vehicle price ($)
          <input type="number" min="0" [ngModel]="price()" (ngModelChange)="price.set($event)" name="price" />
        </label>
        <label>Down payment ($)
          <input type="number" min="0" [ngModel]="down()" (ngModelChange)="down.set($event)" name="down" />
        </label>
        <label>APR (%)
          <input type="number" min="0" step="0.1" [ngModel]="apr()" (ngModelChange)="apr.set($event)" name="apr" />
        </label>
        <label>Term (months)
          <select [ngModel]="months()" (ngModelChange)="months.set($event)" name="months">
            @for (m of [12, 24, 36, 48, 60, 72]; track m) { <option [ngValue]="m">{{ m }}</option> }
          </select>
        </label>
      </form>
      <div class="result" aria-live="polite">
        <span class="label">Estimated monthly payment</span>
        <span class="value">\${{ payment() | number: '1.2-2' }}</span>
        <span class="total">Total cost: \${{ total() | number: '1.0-0' }}</span>
      </div>
      <p class="cta"><a routerLink="/cars">Find your car →</a></p>
    </div>
  `,
  styles: `
    .tool-page { max-width: 640px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 1.8rem; } .sub { color: #6b7280; margin-bottom: 28px; }
    .calc-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; font-size: 14px; }
    input, select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; }
    .result { margin-top: 32px; padding: 24px; border-radius: 12px; background: #111827; color: #fff;
      display: flex; flex-direction: column; gap: 4px; }
    .result .value { font-size: 2rem; font-weight: 800; color: #f97316; }
    .result .total { color: #9ca3af; font-size: 14px; }
    .cta { margin-top: 24px; }
    @media (max-width: 560px) { .calc-form { grid-template-columns: 1fr; } }
  `,
})
export class LoanCalculator {
  readonly price = signal(20000);
  readonly down = signal(5000);
  readonly apr = signal(6);
  readonly months = signal(36);
  readonly payment = computed(() => monthlyPayment(this.price(), this.down(), this.apr(), this.months()));
  readonly total = computed(() => this.payment() * this.months() + this.down());
}
```

Re-run the spec → PASS.

- [ ] **Step 4: Checklist + decoder pages** — static, useful content:

```ts
// src/app/tools/inspection-checklist.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-inspection-checklist',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-page">
      <h1>Used Car Inspection Checklist</h1>
      <p class="sub">What to verify before buying an imported Japanese vehicle.</p>
      @for (section of sections; track section.title) {
        <section>
          <h2>{{ section.title }}</h2>
          <ul>
            @for (item of section.items; track item) { <li><label><input type="checkbox" /> {{ item }}</label></li> }
          </ul>
        </section>
      }
      <p class="cta"><a routerLink="/cars">Browse inspected cars →</a></p>
    </div>
  `,
  styles: `
    .tool-page { max-width: 720px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 1.8rem; } .sub { color: #6b7280; margin-bottom: 28px; }
    section { margin-bottom: 24px; } h2 { font-size: 1.15rem; margin-bottom: 10px; }
    ul { list-style: none; padding: 0; } li { padding: 6px 0; }
    label { display: flex; gap: 10px; align-items: baseline; cursor: pointer; }
    .cta { margin-top: 24px; }
  `,
})
export class InspectionChecklist {
  readonly sections = [
    { title: 'Documents', items: [
      'Export certificate / deregistration papers present',
      'Auction sheet matches the advertised grade',
      'Mileage on auction sheet matches the odometer',
      'Service history booklet included',
    ]},
    { title: 'Exterior & Underbody', items: [
      'No mismatched paint or panel gaps (accident signs)',
      'Underbody rust check — especially wheel arches and frame rails',
      'Tyres wear evenly (alignment/suspension health)',
      'All lights and glass intact',
    ]},
    { title: 'Engine & Drivetrain', items: [
      'Cold start: no blue/white smoke',
      'No oil or coolant leaks around the engine bay',
      'Automatic shifts smoothly through all gears',
      'No unusual noise from CV joints or wheel bearings on a test drive',
    ]},
    { title: 'Interior & Electronics', items: [
      'Air conditioning blows cold',
      'All windows, mirrors, and locks operate',
      'No warning lights on the dashboard after start',
      'Seat wear consistent with the advertised mileage',
    ]},
  ];
}
```

```ts
// src/app/tools/chassis-decoder.ts
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chassis-decoder',
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-page">
      <h1>JDM Chassis Code Decoder</h1>
      <p class="sub">Japanese-market cars use a chassis code (e.g. <code>JZX100-0012345</code>) instead of a 17-digit VIN. Enter one to break it down.</p>
      <input class="code-input" type="text" placeholder="e.g. JZX100-0012345"
             [ngModel]="code()" (ngModelChange)="code.set($event)" name="code" />
      @if (parsed(); as p) {
        <div class="breakdown">
          <div class="part"><span class="label">Model code</span><span class="value">{{ p.model }}</span>
            <span class="hint">Identifies platform, engine family and generation</span></div>
          @if (p.serial) {
            <div class="part"><span class="label">Serial number</span><span class="value">{{ p.serial }}</span>
              <span class="hint">Sequential production number</span></div>
          }
        </div>
      }
      <section class="examples">
        <h2>Common codes</h2>
        <ul>
          @for (e of examples; track e.code) { <li><strong>{{ e.code }}</strong> — {{ e.desc }}</li> }
        </ul>
        <p class="note">The exact model/engine matching a code is confirmed on the export certificate. Ask us to verify any chassis code before you buy.</p>
      </section>
      <p class="cta"><a routerLink="/contact">Ask us to verify a code →</a></p>
    </div>
  `,
  styles: `
    .tool-page { max-width: 720px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 1.8rem; } .sub { color: #6b7280; margin-bottom: 24px; }
    .code-input { width: 100%; padding: 12px 14px; font-size: 1.05rem; border: 1px solid #d1d5db; border-radius: 8px; text-transform: uppercase; }
    .breakdown { margin-top: 20px; display: grid; gap: 12px; }
    .part { padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 10px; display: grid; gap: 2px; }
    .part .label { font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .part .value { font-size: 1.2rem; font-weight: 700; }
    .part .hint { font-size: 13px; color: #6b7280; }
    .examples { margin-top: 32px; } .examples h2 { font-size: 1.15rem; margin-bottom: 10px; }
    .examples li { padding: 4px 0; } .note { margin-top: 12px; color: #6b7280; font-size: 14px; }
    .cta { margin-top: 24px; }
  `,
})
export class ChassisDecoder {
  readonly code = signal('');
  readonly parsed = computed(() => {
    const raw = this.code().trim().toUpperCase();
    if (!raw) return null;
    const [model, serial] = raw.split('-');
    if (!model) return null;
    return { model, serial: serial ?? '' };
  });
  readonly examples = [
    { code: 'JZX100', desc: 'Toyota Chaser / Mark II / Cresta (1JZ engine)' },
    { code: 'BNR34', desc: 'Nissan Skyline GT-R R34 (RB26DETT)' },
    { code: 'FD3S', desc: 'Mazda RX-7 (13B rotary)' },
    { code: 'EK9', desc: 'Honda Civic Type R (B16B)' },
    { code: 'GDB', desc: 'Subaru Impreza WRX STI (EJ207)' },
  ];
}
```

- [ ] **Step 5: Routes** — in `app.routes.ts` add before the wildcard:

```ts
{ path: 'guides/:slug', loadComponent: () => import('./guides/guide-detail').then((m) => m.GuideDetail) },
{ path: 'calculator', loadComponent: () => import('./tools/loan-calculator').then((m) => m.LoanCalculator) },
{ path: 'checklist', loadComponent: () => import('./tools/inspection-checklist').then((m) => m.InspectionChecklist) },
{ path: 'decoder', loadComponent: () => import('./tools/chassis-decoder').then((m) => m.ChassisDecoder) },
```

(`guides/:slug` must come AFTER the plain `guides` route.)

- [ ] **Step 6: Repoint dead links** — in `guides.html` change guide-card links from `['/guide', g.slug]`-style to `['/guides', slugOf(g)]` (add `slugOf(g: any) { return guideSlug(g.title); }` to `guides.ts`, importing `guideSlug`). In `guides.ts` resource entries (lines ~186-199) the `/calculator`, `/checklist`, `/decoder` links now resolve — verify the paths in the data match exactly. In `home.data.ts` replace `/guide/...` links (lines ~393, 421, 429) with `/guides` (slider items don't know slugs; the listing page is the correct target — or map to `['/guides', slug]` when the item title matches a real guide).

- [ ] **Step 7: Build** — `npm run build` → success. Also `ng test --watch=false --browsers=ChromeHeadless --include="**/loan-calculator.spec.ts"` → PASS.
- [ ] **Step 8: Commit** — `git commit -am "feat: guide detail page + calculator/checklist/decoder tools; no more dead links"`

---

### Task 8: "Sell Your Car" link in header

**Files:**
- Modify: `src/app/components/layout/header/header.html` (desktop nav after line 23; mobile menu after line 97)

- [ ] **Step 1:** Desktop — after the "Cars for Sale" `<li>` (line ~23) add:

```html
<li>
  <a routerLink="/sell-your-car" routerLinkActive="active" class="nav-link">Sell Your Car</a>
</li>
```

(match the exact `<li>` structure of siblings). Mobile — after the "Cars for Sale" mobile link (line ~96-97) add:

```html
<a routerLink="/sell-your-car" routerLinkActive="active" class="mobile-link" (click)="closeMobileMenu()">
  Sell Your Car
</a>
```

- [ ] **Step 2: Build** — `npm run build` → success.
- [ ] **Step 3: Commit** — `git commit -am "feat(header): expose Sell Your Car in desktop + mobile nav"`

---

### Task 9: Listing images → Firebase Storage (base64 fallback)

Today images are stored as base64 data-URLs inside the Firestore doc (`sell-your-car.ts:173` → `images` array). Firestore's 1 MB doc limit means listings with several photos can fail to save. Upload to Storage (`cars/{userId}/{listingId}/`, already allowed by `storage.rules`) and store download URLs; fall back to base64 per-image if Storage is unavailable so the flow never breaks.

**Files:**
- Create: `src/app/services/image-upload.service.ts`
- Modify: `src/app/services/car.service.ts` (id-first create)
- Modify: `src/app/sell-your-car/sell-your-car.ts` (submit path, lines ~230-265; photo cap line 145)

**Interfaces:**
- Produces: `CarService.newCarId(): string`; `CarService.createCarWithId(id: string, input: CreateCarListingInput): Promise<string>`; `ImageUploadService.uploadListingImages(userId: string, listingId: string, images: string[]): Promise<string[]>` (returns download URLs, or the original string per-image on failure/non-data-URL).

- [ ] **Step 1: Upload service**

```ts
// src/app/services/image-upload.service.ts
import { Injectable } from '@angular/core';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { getFirebaseStorage } from '../core/firebase/firebase';

/** Uploads listing photos to Storage under cars/{userId}/{listingId}/ (see storage.rules).
 *  Per-image fallback: on any failure the original string (base64 data-URL) is kept,
 *  so listings still save even if Storage is not enabled on the Firebase project. */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  async uploadListingImages(userId: string, listingId: string, images: string[]): Promise<string[]> {
    const storage = getFirebaseStorage();
    return Promise.all(
      images.map(async (img, i) => {
        if (!img.startsWith('data:')) return img; // already a URL (edit mode)
        try {
          const r = ref(storage, `cars/${userId}/${listingId}/photo-${i}.jpg`);
          await uploadString(r, img, 'data_url');
          return await getDownloadURL(r);
        } catch {
          return img;
        }
      }),
    );
  }
}
```

- [ ] **Step 2: Id-first create in CarService** — add imports (`setDoc` already imported; ensure `doc, collection` are) and methods:

```ts
/** Pre-allocate a listing id so photos can be uploaded under it before the doc exists. */
newCarId(): string {
  return doc(collection(this.db, 'cars')).id;
}

async createCarWithId(id: string, input: CreateCarListingInput): Promise<string> {
  const payload = {
    ...input,
    color: input.color ?? 'Not specified',
    status: 'pending' as const,
    submittedAt: new Date().toISOString(),
  };
  await setDoc(doc(this.db, 'cars', id), payload);
  this.notifyUpdate();
  return id;
}
```

Keep `createCar` delegating: `async createCar(input) { return this.createCarWithId(this.newCarId(), input); }` — and keep the Task 5 admin notification inside `createCarWithId` (after `setDoc`), so both entry points notify.

- [ ] **Step 3: Wire into sell-your-car submit** — inject `ImageUploadService`. In the submit handler (`sell-your-car.ts` ~line 230), before building `data`:

```ts
// New listing: allocate id first so photos land under cars/{uid}/{listingId}/
const listingId = this.isEditMode && this.editListingId
  ? this.editListingId
  : this.carService.newCarId();
const uploadedImages = await this.imageUpload.uploadListingImages(user.uid, listingId, this.images);
```

Use `images: uploadedImages` in `data`, and for the create path call `createCarWithId(listingId, {...})` instead of `createCar`. Edit path keeps `updateCar(this.editListingId, ...)` unchanged (with `images: uploadedImages`).

- [ ] **Step 4: Sane photo cap** — change the 50-photo cap (line ~145) to 20 (both the check and the message): base64 fallback for 50 photos would exceed Firestore's 1 MB doc limit.

- [ ] **Step 5: Build** — `npm run build` → success.
- [ ] **Step 6: Commit** — `git commit -am "feat(images): upload listing photos to Firebase Storage with per-image base64 fallback"`

---

### Task 10: Deployment config + full runtime verification

**Files:**
- Modify: `firebase.json` (functions predeploy)
- Modify: `.gitignore` (emulator artifacts)
- Delete: `test.txt`, `firestore-debug.log` (verify they are junk first — read them before deleting)

- [ ] **Step 1: firebase.json** — in the `functions` config block add a predeploy hook so `firebase deploy` always ships fresh function code:

```json
"predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
```

- [ ] **Step 2: Repo hygiene** — read `test.txt` and `firestore-debug.log`; if junk (they are), delete them. Ensure `.gitignore` covers `firestore-debug.log`, `*-debug.log`, `.emulator-data/`.

- [ ] **Step 3: Full build** — `npm run build`. Expected: success with prod budget warnings at most.

- [ ] **Step 4: Runtime smoke test (Playwright against dev server)** — run `npm start` in background, wait for compile, then with the Playwright browser tools verify:
  1. Home: hero renders; Shop by Brand shows numeric counts (not "1,240"); brand card click → `/cars?make=Toyota` shows filtered results.
  2. `/cars`: cars render; each filter (make, body, max price, min year, sort) changes the result set; `?body=sports-car` from the header dropdown filters correctly; empty state + Clear Filters works.
  3. Footer: Quick Links has no Home/Cars-for-Sale; Privacy/Terms links open real pages; CMS-managed copyright text present.
  4. `/calculator`, `/checklist`, `/decoder`, `/guides/<some-slug>` all render (no redirect to home).
  5. Contact form: fill and submit → success message (verify a `complaints` doc appears — check via admin complaints page or Firestore console note).
  6. Header shows "Sell Your Car".
  7. Admin (if seeded credentials available via `npm run review` emulator flow — otherwise verify against cloud with the user's admin account being unavailable, then note what was and wasn't runtime-verified): notifications tab lists items after submitting a listing; bell dot reflects unread.

- [ ] **Step 5: Fix anything the smoke test surfaces**, re-run the affected checks.

- [ ] **Step 6: Final commit** — `git commit -am "chore(deploy): functions predeploy hook, repo hygiene"`. Do NOT push or `firebase deploy` without the user's go-ahead.

---

## Self-Review Notes

- All five user-reported issues map to tasks: footer links (T2), CMS rendering (T1), notifications (T5), dynamic brand counts (T4), filters (T3). Full-audit fixes: dead links (T2, T7), non-persisting forms (T6), hidden sell flow (T8), image/doc-size risk (T9), deploy config (T10).
- Cross-task type consistency: `ContentService.content` signal used in T1/T2; `NotificationData.push` defined in T5 and reused nowhere else; `createCarWithId` (T9) keeps the T5 notification trigger; `slugify`/`applyFilters` are self-contained in T3; `guideSlug` shared between guides list and detail in T7.
- Known deliberate scope exclusions: no Cloud Function notification triggers (client-push under validated rules instead — no Blaze dependency); footer stats band and Japan-vs-Pakistan branding left as-is (content, not functionality); user-facing (non-admin) notification feed not built (only admin tab was requested).
