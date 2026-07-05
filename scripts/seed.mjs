/**
 * Seeds the LOCAL Firebase emulator with baseline data:
 *  - RBAC roles (super-admin, manager, sales-agent, inventory-manager, viewer)
 *  - a Super Admin user (Auth account + user doc + custom claims)
 *
 * Run against a running emulator:  firebase emulators:exec "npm run seed"
 * (or start the emulator, then:      npm run seed)
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Point the Admin SDK at the local emulators.
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';

initializeApp({ projectId: 'autocar-197gb' });
const db = getFirestore();
const auth = getAuth();

const now = new Date().toISOString();

const roles = [
  { id: 'super-admin', name: 'Super Admin', permissions: ['*'] },
  {
    id: 'manager',
    name: 'Manager',
    permissions: [
      'dashboard.view', 'ads.view', 'ads.moderate', 'ads.feature',
      'inventory.view', 'sales.view', 'sales.approve', 'purchase.view',
      'customers.view', 'leads.view', 'reports.view', 'audit.view',
    ],
  },
  {
    id: 'sales-agent',
    name: 'Sales Agent',
    permissions: [
      'dashboard.view', 'leads.view', 'leads.manage', 'sales.view',
      'sales.create', 'customers.view', 'customers.manage', 'ads.view',
    ],
  },
  {
    id: 'inventory-manager',
    name: 'Inventory Manager',
    permissions: [
      'dashboard.view', 'ads.view', 'ads.create', 'ads.edit',
      'inventory.view', 'inventory.edit', 'inventory.adjust', 'purchase.view', 'purchase.create',
    ],
  },
  { id: 'viewer', name: 'Viewer', permissions: ['dashboard.view', 'ads.view', 'reports.view'] },
];

async function seedRoles() {
  for (const r of roles) {
    await db.doc(`roles/${r.id}`).set({
      id: r.id,
      name: r.name,
      description: `${r.name} role`,
      permissions: r.permissions,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${roles.length} roles.`);
}

async function seedSuperAdmin() {
  const email = 'admin@autocar.local';
  const password = 'Admin@12345';
  let user;
  try {
    user = await auth.createUser({ email, password, displayName: 'Super Admin' });
  } catch {
    user = await auth.getUserByEmail(email);
  }
  await auth.setCustomUserClaims(user.uid, { roleId: 'super-admin', permissions: ['*'] });
  await db.doc(`users/${user.uid}`).set({
    uid: user.uid,
    name: 'Super Admin',
    email,
    phone: '',
    userType: 'admin',
    roleId: 'super-admin',
    roleName: 'Super Admin',
    permissions: ['*'],
    isActive: true,
    createdAt: now,
  });
  console.log('Seeded Super Admin.');
  console.log('  Login:', email, '/', password);
}

async function main() {
  await seedRoles();
  await seedSuperAdmin();
  console.log('\nSeed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
