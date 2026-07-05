/**
 * Seeds the LOCAL Firebase emulator with a full demo dataset so the whole admin
 * system is reviewable with realistic data:
 *   - RBAC roles + several staff users (with roles) + buyers/sellers
 *   - car listings/ads across every status (pending / approved / rejected / sold), some featured
 *   - complaints (open + resolved)
 *   - notifications for the super-admin
 *   - activity logs (audit trail)
 *   - config: attributes (makes/body/fuel) + CMS content
 *
 * Run against a running emulator:  firebase emulators:exec "npm run seed"
 * (or start the emulator, then:      npm run seed)
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';

initializeApp({ projectId: 'autocar-197gb' });
const db = getFirestore();
const auth = getAuth();

const now = new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// ---------------------------------------------------------------- roles
const roles = [
  { id: 'super-admin', name: 'Super Admin', permissions: ['*'] },
  {
    id: 'manager', name: 'Manager',
    permissions: ['dashboard.view', 'ads.view', 'ads.moderate', 'ads.feature', 'inventory.view',
      'sales.view', 'sales.approve', 'purchase.view', 'customers.view', 'leads.view',
      'reports.view', 'audit.view', 'notifications.view'],
  },
  {
    id: 'sales-agent', name: 'Sales Agent',
    permissions: ['dashboard.view', 'leads.view', 'leads.manage', 'sales.view', 'sales.create',
      'customers.view', 'customers.manage', 'ads.view'],
  },
  {
    id: 'inventory-manager', name: 'Inventory Manager',
    permissions: ['dashboard.view', 'ads.view', 'ads.create', 'ads.edit', 'inventory.view',
      'inventory.edit', 'inventory.adjust', 'purchase.view', 'purchase.create'],
  },
  { id: 'viewer', name: 'Viewer', permissions: ['dashboard.view', 'ads.view', 'reports.view'] },
];

async function seedRoles() {
  for (const r of roles) {
    await db.doc(`roles/${r.id}`).set({
      id: r.id, name: r.name, description: `${r.name} role`,
      permissions: r.permissions, isSystem: true, createdAt: now, updatedAt: now,
    });
  }
  console.log(`Seeded ${roles.length} roles.`);
}

// ---------------------------------------------------------------- users
async function ensureUser(email, password, name) {
  try {
    return await auth.createUser({ email, password, displayName: name });
  } catch {
    return await auth.getUserByEmail(email);
  }
}

async function seedUsers() {
  const permsOf = (id) => roles.find((r) => r.id === id)?.permissions ?? [];
  const staff = [
    { email: 'admin@autocar.local', pass: 'Admin@12345', name: 'Super Admin', roleId: 'super-admin', userType: 'admin' },
    { email: 'manager@autocar.local', pass: 'Manager@123', name: 'Ayesha Khan', roleId: 'manager', userType: 'admin' },
    { email: 'sales@autocar.local', pass: 'Sales@1234', name: 'Bilal Ahmed', roleId: 'sales-agent', userType: 'seller' },
    { email: 'inventory@autocar.local', pass: 'Invent@123', name: 'Hamza Tariq', roleId: 'inventory-manager', userType: 'seller' },
  ];
  const created = {};
  for (const s of staff) {
    const u = await ensureUser(s.email, s.pass, s.name);
    const permissions = permsOf(s.roleId);
    await auth.setCustomUserClaims(u.uid, { roleId: s.roleId, permissions });
    await db.doc(`users/${u.uid}`).set({
      uid: u.uid, name: s.name, email: s.email, phone: '+92 300 1234567',
      userType: s.userType, roleId: s.roleId, roleName: roles.find((r) => r.id === s.roleId).name,
      permissions, isActive: true, createdAt: daysAgo(30),
    });
    created[s.roleId] = { uid: u.uid, name: s.name, email: s.email };
  }

  // a few buyers/sellers (marketplace users, no admin role)
  const publicUsers = [
    { email: 'ali.buyer@example.com', name: 'Ali Raza', userType: 'buyer' },
    { email: 'sara.seller@example.com', name: 'Sara Malik', userType: 'seller' },
    { email: 'usman.seller@example.com', name: 'Usman Sheikh', userType: 'seller' },
  ];
  for (const p of publicUsers) {
    const u = await ensureUser(p.email, 'User@12345', p.name);
    await db.doc(`users/${u.uid}`).set({
      uid: u.uid, name: p.name, email: p.email, phone: '+92 321 7654321',
      userType: p.userType, isActive: true, createdAt: daysAgo(15),
    });
    created[p.email] = { uid: u.uid, name: p.name, email: p.email };
  }

  console.log(`Seeded ${staff.length + publicUsers.length} users.`);
  return created;
}

// ---------------------------------------------------------------- cars / ads
async function seedCars(users) {
  const seller = users['sara.seller@example.com'];
  const seller2 = users['usman.seller@example.com'];
  const inv = users['inventory-manager'];
  const img = (q) => `https://images.unsplash.com/${q}?w=600&q=80`;

  const cars = [
    { make: 'Toyota', model: 'Corolla Altis', year: 2021, price: 6200000, mileage: 42000, status: 'approved', featured: true, seller: seller, img: img('photo-1621007947382-bb3c3994e3fb'), city: 'Lahore' },
    { make: 'Honda', model: 'Civic Oriel', year: 2022, price: 8500000, mileage: 21000, status: 'approved', featured: true, seller: seller2, img: img('photo-1606664515524-ed2f786a0bd6'), city: 'Karachi' },
    { make: 'Suzuki', model: 'Alto VXL', year: 2023, price: 2850000, mileage: 12000, status: 'approved', featured: false, seller: seller, img: img('photo-1549317661-bd32c8ce0db2'), city: 'Islamabad' },
    { make: 'Toyota', model: 'Fortuner', year: 2020, price: 14500000, mileage: 68000, status: 'approved', featured: false, seller: inv, img: img('photo-1533473359331-0135ef1b58bf'), city: 'Lahore' },
    { make: 'Kia', model: 'Sportage AWD', year: 2022, price: 9800000, mileage: 30000, status: 'pending', featured: false, seller: seller2, img: img('photo-1502877338535-766e1452684a'), city: 'Rawalpindi' },
    { make: 'Hyundai', model: 'Tucson', year: 2021, price: 8900000, mileage: 45000, status: 'pending', featured: false, seller: seller, img: img('photo-1617654112368-307921291f42'), city: 'Faisalabad' },
    { make: 'Honda', model: 'City Aspire', year: 2023, price: 5600000, mileage: 8000, status: 'pending', featured: false, seller: seller2, img: img('photo-1550355291-bbee04a92027'), city: 'Multan' },
    { make: 'Suzuki', model: 'Cultus VXL', year: 2019, price: 2450000, mileage: 72000, status: 'rejected', featured: false, seller: seller, img: img('photo-1552519507-da3b142c6e3d'), city: 'Peshawar', reason: 'Photos unclear; please re-upload.' },
    { make: 'Toyota', model: 'Yaris ATIV', year: 2022, price: 4700000, mileage: 26000, status: 'sold', featured: false, seller: seller2, img: img('photo-1590362891991-f776e747a588'), city: 'Lahore' },
    { make: 'MG', model: 'HS Essence', year: 2023, price: 10200000, mileage: 15000, status: 'approved', featured: false, seller: inv, img: img('photo-1580273916550-e323be2ae537'), city: 'Karachi' },
    { make: 'Nissan', model: 'Sunny', year: 2018, price: 3100000, mileage: 88000, status: 'pending', featured: false, seller: seller, img: img('photo-1614026480209-cf9f1f5a6f21'), city: 'Sialkot' },
    { make: 'Changan', model: 'Alsvin Lumiere', year: 2023, price: 4300000, mileage: 9000, status: 'approved', featured: true, seller: seller2, img: img('photo-1541899481282-d53bffe3c35d'), city: 'Islamabad' },
  ];

  let i = 0;
  for (const c of cars) {
    i++;
    await db.collection('cars').add({
      refCode: `AD-2026-${String(i).padStart(5, '0')}`,
      make: c.make, model: c.model, year: c.year, price: c.price, mileage: c.mileage,
      transmission: 'Automatic', fuelType: 'Petrol', bodyType: 'Sedan', color: 'White',
      condition: 'Used', location: c.city, description: `${c.year} ${c.make} ${c.model} in excellent condition, well maintained.`,
      images: [c.img], coverImage: c.img,
      sellerId: c.seller.uid, ownerName: c.seller.name, email: c.seller.email, phone: '+92 300 1112223',
      status: c.status, featured: c.featured, rejectionReason: c.reason ?? null,
      submittedAt: daysAgo(cars.length - i), createdAt: daysAgo(cars.length - i), updatedAt: now,
    });
  }
  console.log(`Seeded ${cars.length} cars/ads (pending/approved/rejected/sold).`);
}

// ---------------------------------------------------------------- complaints
async function seedComplaints(users) {
  const buyer = users['ali.buyer@example.com'];
  const complaints = [
    { subject: 'Seller not responding', message: 'I called the seller of the Civic but no response for 2 days.', email: buyer.email, name: buyer.name, status: 'open', createdAt: daysAgo(3) },
    { subject: 'Wrong mileage listed', message: 'The Corolla mileage seems higher than advertised.', email: 'faisal@example.com', name: 'Faisal Iqbal', status: 'open', createdAt: daysAgo(1) },
    { subject: 'Great experience', message: 'Bought a Yaris, smooth process. Thanks!', email: 'nida@example.com', name: 'Nida Aslam', status: 'resolved', createdAt: daysAgo(9) },
  ];
  for (const c of complaints) await db.collection('complaints').add(c);
  console.log(`Seeded ${complaints.length} complaints.`);
}

// ---------------------------------------------------------------- notifications (for super-admin)
async function seedNotifications(adminUid) {
  const items = [
    { title: '3 ads awaiting review', body: 'New listings are pending moderation.', type: 'warning', link: '/admin/reviews' },
    { title: 'New complaint filed', body: 'A buyer reported a seller not responding.', type: 'info', link: '/admin/complaints' },
    { title: 'Sale recorded', body: 'Toyota Yaris ATIV marked as sold.', type: 'success', link: '/admin/cars' },
  ];
  let n = 0;
  for (const it of items) {
    n++;
    await db.collection('notifications').add({
      userId: adminUid, title: it.title, body: it.body, type: it.type, link: it.link,
      read: false, createdAt: daysAgo(n),
    });
  }
  console.log(`Seeded ${items.length} notifications.`);
}

// ---------------------------------------------------------------- audit logs
async function seedAudit(users) {
  const admin = users['super-admin'];
  const mgr = users['manager'];
  const logs = [
    { actor: admin, action: 'role.update', resource: 'roles', resourceId: 'manager', at: daysAgo(12) },
    { actor: admin, action: 'user.roleChange', resource: 'users', resourceId: mgr.uid, at: daysAgo(12) },
    { actor: mgr, action: 'ad.approve', resource: 'cars', resourceId: 'AD-2026-00001', at: daysAgo(8) },
    { actor: mgr, action: 'ad.reject', resource: 'cars', resourceId: 'AD-2026-00008', at: daysAgo(6) },
    { actor: mgr, action: 'ad.feature', resource: 'cars', resourceId: 'AD-2026-00002', at: daysAgo(5) },
    { actor: admin, action: 'user.ban', resource: 'users', resourceId: 'demo-banned', at: daysAgo(2) },
  ];
  for (const l of logs) {
    await db.collection('auditLogs').add({
      actorUid: l.actor.uid, actorName: l.actor.name, action: l.action,
      resource: l.resource, resourceId: l.resourceId, before: null, after: null,
      at: new Date(l.at),
    });
  }
  console.log(`Seeded ${logs.length} audit-log entries.`);
}

// ---------------------------------------------------------------- config (attributes + content)
async function seedConfig() {
  await db.doc('config/attributes').set({
    makes: ['Toyota', 'Honda', 'Suzuki', 'Kia', 'Hyundai', 'Nissan', 'MG', 'Changan', 'Other'],
    bodyTypes: ['Sedan', 'SUV', 'Hatchback', 'Crossover', 'Pickup', 'Van'],
    fuelTypes: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'],
  });
  await db.doc('config/content').set({
    heroTitle: 'Find Your Perfect Car in Pakistan',
    heroSubtitle: 'Thousands of verified listings from trusted sellers and dealers.',
    aboutText: 'AutoCar is Pakistan’s modern marketplace for buying and selling cars.',
    contactEmail: 'support@autocar.pk',
    contactPhone: '+92 42 111 000 111',
    footerText: '© 2026 AutoCar. All rights reserved.',
  });
  console.log('Seeded config (attributes + content).');
}

async function main() {
  await seedRoles();
  const users = await seedUsers();
  await seedCars(users);
  await seedComplaints(users);
  await seedNotifications(users['super-admin'].uid);
  await seedAudit(users);
  await seedConfig();
  console.log('\n✅ Demo seed complete.');
  console.log('   Admin login:  admin@autocar.local / Admin@12345');
  console.log('   Manager:      manager@autocar.local / Manager@123');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
