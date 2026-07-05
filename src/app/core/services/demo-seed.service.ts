import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/firebase';
import { AuthService } from '../../services/auth.service';

/**
 * One-click demo data loader for the CLOUD project, run by a signed-in admin from the
 * admin UI. Writes only what an admin is allowed to write per security rules
 * (cars, complaints, config, roles, audit logs, notifications). Idempotency is not
 * guaranteed — running twice adds more sample rows.
 */
@Injectable({ providedIn: 'root' })
export class DemoSeedService {
  private readonly db = getFirebaseDb();
  private readonly auth = inject(AuthService);

  private daysAgo(n: number): string {
    return new Date(Date.now() - n * 86400000).toISOString();
  }

  /** Deletes previously-seeded demo docs (tagged demo:true) from a collection. */
  private async clearDemo(coll: string): Promise<void> {
    const snap = await getDocs(query(collection(this.db, coll), where('demo', '==', true)));
    for (const d of snap.docs) {
      await deleteDoc(doc(this.db, coll, d.id));
    }
  }

  /**
   * Deletes demo cars: those tagged demo:true AND legacy ones from earlier seed runs
   * (identified by an "AD-2026-" refCode, which real user listings never have).
   */
  private async clearDemoCars(): Promise<void> {
    const snap = await getDocs(collection(this.db, 'cars'));
    for (const d of snap.docs) {
      const data = d.data() as { demo?: boolean; refCode?: string };
      const isDemo = data.demo === true
        || (typeof data.refCode === 'string' && data.refCode.startsWith('AD-2026-'));
      if (isDemo) await deleteDoc(doc(this.db, 'cars', d.id));
    }
  }

  async seedAll(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not signed in');
    const uid = user.uid;
    const email = this.auth.getUserEmail() || user.email || '';
    const ownerName = this.auth.getUserDisplayName() || 'Admin';

    // Remove any demo docs from previous runs so re-running doesn't pile up duplicates.
    await this.clearDemoCars();
    await this.clearDemo('complaints');

    await this.seedConfig();
    await this.seedRoles();
    await this.seedCars(uid, email, ownerName);
    await this.seedComplaints(email, ownerName);
    // Audit logs + notifications are append-only via Cloud Functions and are blocked for
    // client writes by security rules. On the cloud they will fail (and stay empty until
    // Functions are deployed); on the emulator the seed script populates them. Don't let
    // these break the rest of the demo data.
    try {
      await this.seedNotifications(uid);
    } catch {
      /* rules block client writes on cloud — expected */
    }
    try {
      await this.seedAudit(uid, ownerName);
    } catch {
      /* rules block client writes on cloud — expected */
    }
  }

  private async seedConfig(): Promise<void> {
    await setDoc(doc(this.db, 'config', 'attributes'), {
      makes: ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai', 'Nissan', 'MG', 'Changan', 'Other'],
      bodyTypes: ['Sedan', 'SUV', 'Hatchback', 'Crossover', 'Pickup', 'Van'],
      fuelTypes: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'],
    });
    await setDoc(doc(this.db, 'config', 'content'), {
      heroTitle: "Find Your Perfect Car in Pakistan",
      heroSubtitle: 'Thousands of verified listings from trusted sellers and dealers.',
      aboutText: 'AutoFlex is Pakistan’s modern marketplace for buying and selling cars.',
      contactEmail: 'support@autoflex.pk',
      contactPhone: '+92 42 111 000 111',
      footerText: '© 2026 AutoFlex. All rights reserved.',
    });
  }

  private async seedRoles(): Promise<void> {
    const now = new Date().toISOString();
    const roles = [
      { id: 'super-admin', name: 'Super Admin', permissions: ['*'] },
      { id: 'manager', name: 'Manager', permissions: ['dashboard.view', 'ads.view', 'ads.moderate', 'ads.feature', 'sales.view', 'reports.view', 'customers.view', 'leads.view', 'audit.view'] },
      { id: 'sales-agent', name: 'Sales Agent', permissions: ['dashboard.view', 'leads.view', 'leads.manage', 'sales.view', 'sales.create', 'customers.view', 'ads.view'] },
      { id: 'inventory-manager', name: 'Inventory Manager', permissions: ['dashboard.view', 'ads.view', 'ads.create', 'ads.edit', 'inventory.view', 'inventory.edit'] },
      { id: 'viewer', name: 'Viewer', permissions: ['dashboard.view', 'ads.view', 'reports.view'] },
    ];
    for (const r of roles) {
      await setDoc(doc(this.db, 'roles', r.id), {
        id: r.id, name: r.name, description: `${r.name} role`,
        permissions: r.permissions, isSystem: true, createdAt: now, updatedAt: now,
      });
    }
  }

  private async seedCars(uid: string, email: string, ownerName: string): Promise<void> {
    const img = (q: string) => `https://images.unsplash.com/${q}?w=600&q=80`;
    const cars = [
      { make: 'Toyota', model: 'Corolla Altis', year: 2021, price: 6200000, mileage: 42000, status: 'approved', featured: true, img: img('photo-1621007947382-bb3c3994e3fb'), city: 'Lahore' },
      { make: 'Honda', model: 'Civic Oriel', year: 2022, price: 8500000, mileage: 21000, status: 'approved', featured: true, img: img('photo-1606664515524-ed2f786a0bd6'), city: 'Karachi' },
      { make: 'Suzuki', model: 'Alto VXL', year: 2023, price: 2850000, mileage: 12000, status: 'approved', featured: false, img: img('photo-1549317661-bd32c8ce0db2'), city: 'Islamabad' },
      { make: 'Toyota', model: 'Fortuner', year: 2020, price: 14500000, mileage: 68000, status: 'approved', featured: false, img: img('photo-1533473359331-0135ef1b58bf'), city: 'Lahore' },
      { make: 'Kia', model: 'Sportage AWD', year: 2022, price: 9800000, mileage: 30000, status: 'pending', featured: false, img: img('photo-1502877338535-766e1452684a'), city: 'Rawalpindi' },
      { make: 'Hyundai', model: 'Tucson', year: 2021, price: 8900000, mileage: 45000, status: 'pending', featured: false, img: img('photo-1617654112368-307921291f42'), city: 'Faisalabad' },
      { make: 'Honda', model: 'City Aspire', year: 2023, price: 5600000, mileage: 8000, status: 'pending', featured: false, img: img('photo-1550355291-bbee04a92027'), city: 'Multan' },
      { make: 'Suzuki', model: 'Cultus VXL', year: 2019, price: 2450000, mileage: 72000, status: 'rejected', featured: false, img: img('photo-1552519507-da3b142c6e3d'), city: 'Peshawar', reason: 'Photos unclear; please re-upload.' },
      { make: 'Toyota', model: 'Yaris ATIV', year: 2022, price: 4700000, mileage: 26000, status: 'sold', featured: false, img: img('photo-1590362891991-f776e747a588'), city: 'Lahore' },
      { make: 'MG', model: 'HS Essence', year: 2023, price: 10200000, mileage: 15000, status: 'approved', featured: false, img: img('photo-1580273916550-e323be2ae537'), city: 'Karachi' },
      { make: 'Nissan', model: 'Sunny', year: 2018, price: 3100000, mileage: 88000, status: 'pending', featured: false, img: img('photo-1614026480209-cf9f1f5a6f21'), city: 'Sialkot' },
      { make: 'Changan', model: 'Alsvin Lumiere', year: 2023, price: 4300000, mileage: 9000, status: 'approved', featured: true, img: img('photo-1541899481282-d53bffe3c35d'), city: 'Islamabad' },
    ];

    let i = 0;
    for (const c of cars) {
      i++;
      // Create rule requires status 'pending' + sellerId==uid + email==token.email.
      const ref = await addDoc(collection(this.db, 'cars'), {
        refCode: `AD-2026-${String(i).padStart(5, '0')}`,
        make: c.make, model: c.model, year: c.year, price: c.price, mileage: c.mileage,
        transmission: 'Automatic', fuelType: 'Petrol', bodyType: 'Sedan', color: 'White',
        condition: 'Used', location: c.city,
        description: `${c.year} ${c.make} ${c.model} in excellent condition, well maintained.`,
        images: [c.img], coverImage: c.img,
        sellerId: uid, ownerName, email, phone: '+92 300 1112223',
        status: 'pending', featured: false, demo: true,
        submittedAt: this.daysAgo(cars.length - i), createdAt: this.daysAgo(cars.length - i), updatedAt: new Date().toISOString(),
      });
      // Move to its demo status / featured flag (admin update allowed).
      if (c.status !== 'pending' || c.featured) {
        await updateDoc(ref, {
          status: c.status,
          featured: c.featured,
          ...(c.reason ? { rejectionReason: c.reason } : {}),
        });
      }
    }
  }

  private async seedComplaints(email: string, name: string): Promise<void> {
    // Security rules allow CREATE only with status 'open'; a resolved one is created open
    // then updated (admin update is allowed).
    const complaints = [
      { subject: 'Seller not responding', message: 'Called the Civic seller, no response for 2 days.', email, name, resolved: false, createdAt: this.daysAgo(3) },
      { subject: 'Wrong mileage listed', message: 'The Corolla mileage seems higher than advertised.', email: 'faisal@example.com', name: 'Faisal Iqbal', resolved: false, createdAt: this.daysAgo(1) },
      { subject: 'Great experience', message: 'Bought a Yaris, smooth process. Thanks!', email: 'nida@example.com', name: 'Nida Aslam', resolved: true, createdAt: this.daysAgo(9) },
    ];
    for (const c of complaints) {
      const ref = await addDoc(collection(this.db, 'complaints'), {
        subject: c.subject, message: c.message, email: c.email, name: c.name,
        status: 'open', demo: true, createdAt: c.createdAt,
      });
      if (c.resolved) await updateDoc(ref, { status: 'resolved' });
    }
  }

  private async seedNotifications(uid: string): Promise<void> {
    const items = [
      { title: 'Ads awaiting review', body: 'New listings are pending moderation.', type: 'warning', link: '/admin/reviews' },
      { title: 'New complaint filed', body: 'A buyer reported a seller not responding.', type: 'info', link: '/admin/complaints' },
      { title: 'Sale recorded', body: 'Toyota Yaris ATIV marked as sold.', type: 'success', link: '/admin/cars' },
    ];
    let n = 0;
    for (const it of items) {
      n++;
      await addDoc(collection(this.db, 'notifications'), {
        userId: uid, title: it.title, body: it.body, type: it.type, link: it.link,
        read: false, createdAt: this.daysAgo(n),
      });
    }
  }

  private async seedAudit(uid: string, name: string): Promise<void> {
    const logs = [
      { action: 'role.update', resource: 'roles', resourceId: 'manager', at: this.daysAgo(12) },
      { action: 'user.roleChange', resource: 'users', resourceId: 'demo-user', at: this.daysAgo(12) },
      { action: 'ad.approve', resource: 'cars', resourceId: 'AD-2026-00001', at: this.daysAgo(8) },
      { action: 'ad.reject', resource: 'cars', resourceId: 'AD-2026-00008', at: this.daysAgo(6) },
      { action: 'ad.feature', resource: 'cars', resourceId: 'AD-2026-00002', at: this.daysAgo(5) },
      { action: 'complaint.resolve', resource: 'complaints', resourceId: 'demo', at: this.daysAgo(2) },
    ];
    for (const l of logs) {
      await addDoc(collection(this.db, 'auditLogs'), {
        actorUid: uid, actorName: name, action: l.action,
        resource: l.resource, resourceId: l.resourceId, before: null, after: null,
        at: new Date(l.at),
      });
    }
  }
}
