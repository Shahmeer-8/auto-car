# Phase 0 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the local Firebase backend, dynamic RBAC, secure business-logic layer, audit/notification engines, seed data, and a permission-driven admin shell — the foundation every business module builds on.

**Architecture:** Angular 21 admin app talks to a **local Firebase Emulator Suite** (Auth + Firestore + Storage + Functions). Data access goes through typed services; sensitive writes go through Cloud Functions that re-check permissions and append audit logs. Access control is dynamic RBAC (roles + permission matrix) carried in Auth custom claims and enforced in UI, Security Rules, and Functions.

**Tech Stack:** Angular 21 (standalone, signals, Material), Firebase JS SDK v12, Firebase Functions (TypeScript, Node 20), Firestore Security Rules v2, Vitest (Angular unit tests), `@firebase/rules-unit-testing` (rules tests), Firebase Emulator Suite.

## Global Constraints

- Firebase stays the backend; **local only** via Emulator Suite — never touch the live `autocar-197gb` project during dev.
- Business logic = **Hybrid**: Security Rules for access + Cloud Functions for sensitive/transactional writes, audit, notifications, claim sync.
- **Custom claims are set ONLY by a Cloud Function.** Clients can never write `roleId`/`permissions` to their own user doc.
- `auditLogs` is **append-only**: no client create/update/delete; writes only from Functions (admin SDK bypasses rules).
- Angular: standalone components, `ChangeDetectionStrategy.OnPush`, signals for state, reactive forms, `inject()`, native control flow (`@if`/`@for`), no `standalone: true` in decorators, no `ngClass`/`ngStyle`, WCAG AA.
- Currency is **PKR** everywhere.
- No component accesses Firestore directly — always via a data-access service.
- Permission strings are `resource.action` (catalogue defined in Task 3).

---

## File Structure

```
firebase.json                                  # + emulators block, functions, hosting
.firebaserc                                    # default project alias
functions/                                     # Cloud Functions (TS, Node 20)
  package.json  tsconfig.json  .eslintrc.json
  src/
    index.ts                                   # exports all callables/triggers
    lib/permissions.ts                         # PERMISSIONS catalogue + hasPermission()  (SHARED source of truth)
    lib/validators.ts                          # pure validators (SHARED)
    lib/audit.ts                               # writeAudit() helper
    lib/notify.ts                              # pushNotification() helper
    auth/claims.ts                             # setUserClaims callable + onRoleWrite trigger
scripts/
  seed.mjs                                     # seeds roles + super-admin + demo data into emulator
src/app/core/
  firebase/firebase.ts                         # + emulator wiring (existing file, modify)
  models/                                      # shared TS interfaces (role, permission, user, audit, notification)
    role.model.ts  permission.model.ts  audit.model.ts  notification.model.ts
  auth/permissions.ts                          # re-export of catalogue for the Angular side
  auth/permissions.spec.ts
  rbac/roles.data.ts                           # Firestore data-access for roles
  rbac/roles.facade.ts                         # signal state + use-cases
  rbac/users.data.ts                           # users data-access (calls setUserClaims Function)
  directives/has-permission.directive.ts       # *appHasPermission
  directives/has-permission.directive.spec.ts
  services/audit.data.ts                       # read audit logs
  services/notification.data.ts                # read/mark notifications
src/app/admin/                                 # REBUILT shell + Phase-0 pages
  admin-shell/admin-shell.ts/.html/.css        # new Material themed layout (replaces admin-layout)
  admin.routes.ts                              # permission-guarded routes
  roles/…                                      # Roles & permissions module (dynamic RBAC UI)
  users/…                                      # User management (rebuilt, role assignment)
  audit/…                                      # Activity log viewer
tests/rules/firestore.rules.spec.ts            # security-rules tests (emulator)
```

---

### Task 1: Firebase Emulator + Functions project setup

**Files:**
- Modify: `firebase.json`
- Create: `.firebaserc`, `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`

**Interfaces:**
- Produces: a runnable emulator suite (`npm run emulate`) and a Functions build target.

- [ ] **Step 1: Add emulators + functions to `firebase.json`**

```json
{
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
  "storage": { "rules": "storage.rules" },
  "functions": { "source": "functions", "runtime": "nodejs20" },
  "hosting": {
    "public": "dist/Auto-Flex/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "functions": { "port": 5001 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

- [ ] **Step 2: Create `.firebaserc`**

```json
{ "projects": { "default": "autocar-197gb" } }
```

- [ ] **Step 3: Create `functions/package.json`**

```json
{
  "name": "functions",
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "scripts": { "build": "tsc", "build:watch": "tsc -w" },
  "dependencies": { "firebase-admin": "^12.6.0", "firebase-functions": "^6.1.0" },
  "devDependencies": { "typescript": "~5.9.2" },
  "private": true
}
```

- [ ] **Step 4: Create `functions/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs", "target": "es2021", "outDir": "lib",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `functions/src/index.ts` (stub)**

```typescript
import { initializeApp } from 'firebase-admin/app';
initializeApp();
// callables/triggers are re-exported here as tasks add them
export * from './auth/claims';
```
(Comment out the `export` until Task 6 exists, or create an empty `auth/claims.ts` now.)

- [ ] **Step 6: Add root scripts to `package.json`**

Add to `scripts`: `"emulate": "firebase emulators:start --import=./.emulator-data --export-on-exit=./.emulator-data"`, `"functions:build": "cd functions && npm run build"`, `"seed": "node scripts/seed.mjs"`.

- [ ] **Step 7: Install & verify emulator boots**

Run: `cd functions && npm install && npm run build && cd .. && firebase emulators:start`
Expected: Emulator UI at `http://localhost:4000`, all four emulators “running”. Ctrl-C to stop.

- [ ] **Step 8: Commit**

```bash
git add firebase.json .firebaserc functions/ package.json && git commit -m "chore: local firebase emulator + functions scaffold"
```

---

### Task 2: Shared domain models

**Files:**
- Create: `src/app/core/models/permission.model.ts`, `role.model.ts`, `audit.model.ts`, `notification.model.ts`

**Interfaces:**
- Produces: `Permission` (string type), `Role`, `AppUser` (extend existing), `AuditLog`, `AppNotification` used everywhere.

- [ ] **Step 1: Create the model files**

```typescript
// permission.model.ts
export type Permission = string; // e.g. 'ads.moderate' — catalogue in permissions.ts

// role.model.ts
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// audit.model.ts
export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  action: string;      // 'role.update', 'sale.create', ...
  resource: string;    // 'roles', 'sales', ...
  resourceId: string;
  before?: unknown;
  after?: unknown;
  at: string;
}

// notification.model.ts
export interface AppNotification {
  id: string;
  userId?: string;
  role?: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Extend `AppUser`** in `src/app/models/user.model.ts` — add `roleId: string; roleName: string; permissions: Permission[];` (keep `userType` for backward-compat during migration).

- [ ] **Step 3: Verify build** — Run: `npx tsc --noEmit -p tsconfig.app.json` → Expected: no errors.

- [ ] **Step 4: Commit** — `git add src/app/core/models src/app/models && git commit -m "feat: shared domain models for rbac/audit/notifications"`

---

### Task 3: Permission catalogue + pure permission check (TDD)

**Files:**
- Create: `functions/src/lib/permissions.ts` (source of truth)
- Create: `src/app/core/auth/permissions.ts` (Angular copy/re-export), `src/app/core/auth/permissions.spec.ts`

**Interfaces:**
- Produces: `PERMISSIONS` (readonly catalogue), `hasPermission(userPerms: string[], required: string): boolean`. Consumed by directive, rules-mirroring, Functions.

- [ ] **Step 1: Write the failing test** — `src/app/core/auth/permissions.spec.ts`

```typescript
import { hasPermission, PERMISSIONS } from './permissions';

describe('hasPermission', () => {
  it('returns true when the exact permission is present', () => {
    expect(hasPermission(['ads.moderate'], 'ads.moderate')).toBe(true);
  });
  it('returns false when missing', () => {
    expect(hasPermission(['ads.view'], 'ads.moderate')).toBe(false);
  });
  it('grants everything for the wildcard "*"', () => {
    expect(hasPermission(['*'], 'anything.here')).toBe(true);
  });
  it('catalogue contains core permissions', () => {
    expect(PERMISSIONS).toContain('users.manage');
    expect(PERMISSIONS).toContain('roles.manage');
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx ng test --no-watch` → Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `src/app/core/auth/permissions.ts`

```typescript
export const PERMISSIONS = [
  'dashboard.view',
  'ads.view','ads.create','ads.edit','ads.delete','ads.moderate','ads.feature',
  'inventory.view','inventory.edit','inventory.adjust',
  'sales.view','sales.create','sales.approve','sales.void',
  'purchase.view','purchase.create','purchase.approve',
  'customers.view','customers.manage',
  'leads.view','leads.manage','leads.assign',
  'cms.view','cms.edit','media.view','media.manage',
  'reports.view','users.view','users.manage','roles.manage',
  'settings.manage','audit.view','notifications.view',
] as const;

export function hasPermission(userPerms: string[], required: string): boolean {
  if (!userPerms) return false;
  return userPerms.includes('*') || userPerms.includes(required);
}
```
Then create `functions/src/lib/permissions.ts` with the **same** `PERMISSIONS` + `hasPermission` (CommonJS export) so client and server share one definition.

- [ ] **Step 4: Run test to verify it passes** — Run: `npx ng test --no-watch` → Expected: PASS.

- [ ] **Step 5: Commit** — `git add src/app/core/auth functions/src/lib/permissions.ts && git commit -m "feat: permission catalogue + hasPermission (tested)"`

---

### Task 4: Auth custom-claims Cloud Function

**Files:**
- Create: `functions/src/auth/claims.ts`
- Modify: `functions/src/index.ts` (export)

**Interfaces:**
- Consumes: `hasPermission` from `../lib/permissions`.
- Produces: callable `setUserRole({ uid, roleId })` and Firestore trigger `onRoleWrite` — both set custom claims `{ roleId, permissions }` on the target user and mirror to their `users/{uid}` doc.

- [ ] **Step 1: Implement `claims.ts`**

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { hasPermission } from '../lib/permissions';
import { writeAudit } from '../lib/audit';

export const setUserRole = onCall(async (req) => {
  const caller = req.auth;
  if (!caller) throw new HttpsError('unauthenticated', 'Sign in required');
  const callerPerms = (caller.token['permissions'] as string[]) ?? [];
  if (!hasPermission(callerPerms, 'users.manage'))
    throw new HttpsError('permission-denied', 'Missing users.manage');

  const { uid, roleId } = req.data as { uid: string; roleId: string };
  const db = getFirestore();
  const roleSnap = await db.doc(`roles/${roleId}`).get();
  if (!roleSnap.exists) throw new HttpsError('not-found', 'Role not found');
  const role = roleSnap.data()!;

  await getAuth().setCustomUserClaims(uid, { roleId, permissions: role['permissions'] });
  await db.doc(`users/${uid}`).set(
    { roleId, roleName: role['name'], permissions: role['permissions'] }, { merge: true },
  );
  await writeAudit(db, caller.uid, caller.token['name'] as string ?? caller.token.email!,
    'user.roleChange', 'users', uid, null, { roleId });
  return { ok: true };
});
```

- [ ] **Step 2: Export in `index.ts`** — `export { setUserRole } from './auth/claims';`

- [ ] **Step 3: Build** — Run: `cd functions && npm run build` → Expected: no TS errors (note: needs Task 5's `audit.ts`; do Task 5 first if building now).

- [ ] **Step 4: Commit** — `git add functions/src && git commit -m "feat: setUserRole callable sets custom claims + mirrors to user doc"`

---

### Task 5: Audit + notification engine helpers

**Files:**
- Create: `functions/src/lib/audit.ts`, `functions/src/lib/notify.ts`

**Interfaces:**
- Produces: `writeAudit(db, actorUid, actorName, action, resource, resourceId, before, after)` and `pushNotification(db, target, {title, body, type, link})`. Consumed by every mutating Function.

- [ ] **Step 1: Implement `audit.ts`**

```typescript
import { Firestore, FieldValue } from 'firebase-admin/firestore';
export async function writeAudit(
  db: Firestore, actorUid: string, actorName: string,
  action: string, resource: string, resourceId: string,
  before: unknown, after: unknown,
): Promise<void> {
  await db.collection('auditLogs').add({
    actorUid, actorName, action, resource, resourceId,
    before: before ?? null, after: after ?? null,
    at: FieldValue.serverTimestamp(),
  });
}
```

- [ ] **Step 2: Implement `notify.ts`**

```typescript
import { Firestore, FieldValue } from 'firebase-admin/firestore';
type Target = { userId: string } | { role: string };
export async function pushNotification(
  db: Firestore, target: Target,
  n: { title: string; body: string; type?: string; link?: string },
): Promise<void> {
  await db.collection('notifications').add({
    ...target, title: n.title, body: n.body,
    type: n.type ?? 'info', link: n.link ?? null,
    read: false, createdAt: FieldValue.serverTimestamp(),
  });
}
```

- [ ] **Step 3: Build** — Run: `cd functions && npm run build` → Expected: no errors.

- [ ] **Step 4: Commit** — `git add functions/src/lib && git commit -m "feat: audit + notification function helpers"`

---

### Task 6: Firestore security rules with permission helper + rules tests

**Files:**
- Modify: `firestore.rules`
- Create: `tests/rules/firestore.rules.spec.ts`, add `@firebase/rules-unit-testing` devDep

**Interfaces:**
- Produces: `hasPerm(p)` rules helper reading `request.auth.token.permissions`; `roles` admin-guarded; `auditLogs` append-nothing from client; `users` role fields immutable by owner.

- [ ] **Step 1: Write the rules** (add to existing `firestore.rules`, inside the documents match)

```
function perms() { return request.auth.token.permissions; }
function hasPerm(p) { return isSignedIn() && (perms().hasAny(['*']) || perms().hasAny([p])); }

match /roles/{roleId} {
  allow read: if isSignedIn();
  allow write: if hasPerm('roles.manage');
}
match /auditLogs/{logId} {
  allow read: if hasPerm('audit.view');
  allow write: if false;           // only Functions (admin SDK) write
}
match /notifications/{id} {
  allow read: if isSignedIn() &&
    (resource.data.userId == request.auth.uid || hasPerm('notifications.view'));
  allow update: if isSignedIn() && resource.data.userId == request.auth.uid; // mark read
  allow create, delete: if false;  // Functions only
}
```
Also update `users/{userId}` update rule so **owners cannot change** `roleId`/`roleName`/`permissions` (only equal-to-existing), while `hasPerm('users.manage')` may.

- [ ] **Step 2: Write failing rules test** — `tests/rules/firestore.rules.spec.ts`

```typescript
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

let env: any;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-autocar',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());

it('blocks client writes to auditLogs', async () => {
  const ctx = env.authenticatedContext('u1', { permissions: ['audit.view'] });
  await assertFails(setDoc(doc(ctx.firestore(), 'auditLogs/x'), { action: 'hack' }));
});
it('allows roles.manage to write roles', async () => {
  const ctx = env.authenticatedContext('admin', { permissions: ['roles.manage'] });
  await assertSucceeds(setDoc(doc(ctx.firestore(), 'roles/r1'), { name: 'R', permissions: [] }));
});
```

- [ ] **Step 3: Run (emulator must be running)** — Run: `firebase emulators:exec "npx vitest run tests/rules"` → Expected: FAIL then, after Step 1 saved, PASS.

- [ ] **Step 4: Commit** — `git add firestore.rules tests/rules package.json && git commit -m "feat: rbac security rules + rules tests"`

---

### Task 7: Seed script

**Files:**
- Create: `scripts/seed.mjs`

**Interfaces:**
- Produces: `npm run seed` → writes seed roles, a super-admin user (Auth + doc + claims), and small demo dataset into the running emulator.

- [ ] **Step 1: Implement `scripts/seed.mjs`** (uses firebase-admin against emulator env vars)

```javascript
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
initializeApp({ projectId: 'autocar-197gb' });
const db = getFirestore(), auth = getAuth();

const roles = [
  { id: 'super-admin', name: 'Super Admin', permissions: ['*'], isSystem: true },
  { id: 'manager', name: 'Manager', permissions: ['dashboard.view','ads.view','ads.moderate','sales.view','reports.view','customers.view','leads.view'], isSystem: true },
  { id: 'sales-agent', name: 'Sales Agent', permissions: ['dashboard.view','leads.view','leads.manage','sales.view','sales.create','customers.view'], isSystem: true },
  { id: 'inventory-manager', name: 'Inventory Manager', permissions: ['dashboard.view','ads.view','ads.create','ads.edit','inventory.view','inventory.edit'], isSystem: true },
  { id: 'viewer', name: 'Viewer', permissions: ['dashboard.view','ads.view','reports.view'], isSystem: true },
];
for (const r of roles) await db.doc(`roles/${r.id}`).set({ ...r, description: r.name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

const email = 'admin@autocar.local', password = 'Admin@12345';
let u; try { u = await auth.createUser({ email, password, displayName: 'Super Admin' }); }
catch { u = await auth.getUserByEmail(email); }
await auth.setCustomUserClaims(u.uid, { roleId: 'super-admin', permissions: ['*'] });
await db.doc(`users/${u.uid}`).set({ uid: u.uid, name: 'Super Admin', email, phone: '', roleId: 'super-admin', roleName: 'Super Admin', permissions: ['*'], isActive: true, createdAt: new Date().toISOString() });
console.log('Seed complete. Login:', email, '/', password);
process.exit(0);
```

- [ ] **Step 2: Run against emulator** — Run: `firebase emulators:exec "npm run seed"` → Expected: “Seed complete” + roles/user visible in Emulator UI.

- [ ] **Step 3: Commit** — `git add scripts/seed.mjs && git commit -m "feat: emulator seed (roles + super-admin)"`

---

### Task 8: Angular emulator wiring

**Files:**
- Modify: `src/app/core/firebase/firebase.ts`, `src/environments/environment.ts`

**Interfaces:**
- Produces: when `!environment.production`, the app connects to Auth/Firestore/Storage/Functions emulators.

- [ ] **Step 1: Add emulator connection** in `firebase.ts` — after each `getX()` init, when `!environment.production` and not already connected, call `connectAuthEmulator(auth,'http://127.0.0.1:9099')`, `connectFirestoreEmulator(db,'127.0.0.1',8080)`, `connectStorageEmulator(storage,'127.0.0.1',9199)`, and expose `getFirebaseFunctions()` with `connectFunctionsEmulator(fns,'127.0.0.1',5001)`. Guard with a module-level `connected` boolean.

- [ ] **Step 2: Smoke test** — Run `npm run emulate` (separate terminal), `firebase emulators:exec "npm run seed"`, then `npm start`; log in as `admin@autocar.local`. Expected: login succeeds against emulator, redirect to `/admin/dashboard`.

- [ ] **Step 3: Commit** — `git add src/app/core/firebase/firebase.ts && git commit -m "feat: connect angular to firebase emulators in dev"`

---

### Task 9: `*appHasPermission` structural directive (TDD)

**Files:**
- Create: `src/app/core/directives/has-permission.directive.ts`, `has-permission.directive.spec.ts`

**Interfaces:**
- Consumes: `AuthService.userProfile$`/permissions, `hasPermission`.
- Produces: `*appHasPermission="'sales.create'"` renders content only if the current user has the permission.

- [ ] **Step 1: Write failing test** (TestBed with stub AuthService exposing `permissions`), asserting the element renders with the permission and is absent without it.
- [ ] **Step 2: Run** `npx ng test --no-watch` → FAIL.
- [ ] **Step 3: Implement** the directive using `ViewContainerRef` + `TemplateRef`, reading permissions from `AuthService` (add a `permissions` getter to `AuthService` returning `userProfile?.permissions ?? []`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: appHasPermission directive (tested)"`

---

### Task 10: Roles & Permissions module (dynamic RBAC UI)

**Files:**
- Create: `src/app/core/rbac/roles.data.ts`, `roles.facade.ts`; rebuild `src/app/admin/roles/admin-roles.ts/.html/.css`

**Interfaces:**
- Consumes: `PERMISSIONS`, `Role`, `writeAudit` (server), rules `roles.manage`.
- Produces: list roles, create role, edit permission matrix (checkbox grid grouped by resource), delete non-system roles. System roles read-only.

- [ ] **Step 1** roles.data.ts: `listRoles()`, `getRole(id)`, `saveRole(role)`, `deleteRole(id)` (Firestore).
- [ ] **Step 2** roles.facade.ts: signals `roles`, `loading`; `load()`, `save()`, `remove()`.
- [ ] **Step 3** Rebuild roles UI: Material table of roles + an editor with a permission matrix (`@for` over resource groups derived from `PERMISSIONS`), Save via facade. Guard actions with `*appHasPermission="'roles.manage'"`.
- [ ] **Step 4** Verify against emulator (create a “Test” role, toggle perms, save, reload).
- [ ] **Step 5: Commit** — `git commit -am "feat: dynamic roles & permission matrix"`

---

### Task 11: User management (rebuilt, role assignment via Function)

**Files:**
- Create: `src/app/core/rbac/users.data.ts`; rebuild `src/app/admin/users/admin-users.ts/.html/.css`

**Interfaces:**
- Consumes: callable `setUserRole`, `roles.facade`, rules `users.manage`.
- Produces: list users, assign role (calls `setUserRole` Function — never writes claims client-side), activate/ban.

- [ ] **Step 1** users.data.ts: `listUsers()`; `assignRole(uid, roleId)` → `httpsCallable(getFirebaseFunctions(),'setUserRole')({uid,roleId})`; `setActive(uid, isActive)` (Firestore, guarded by rules).
- [ ] **Step 2** Rebuild users UI: table with role dropdown (from roles), status toggle; actions guarded by `*appHasPermission="'users.manage'"`.
- [ ] **Step 3** Verify: assign a role to a second seeded user; confirm claims update (re-login shows new permissions).
- [ ] **Step 4: Commit** — `git commit -am "feat: user management with server-side role assignment"`

---

### Task 12: Admin shell rebuild (Material, permission-driven nav)

**Files:**
- Create: `src/app/admin/admin-shell/admin-shell.ts/.html/.css`; modify `src/app/admin/admin.routes.ts`; delete old `admin-layout` after migration.

**Interfaces:**
- Consumes: `AuthService` (admin name/email/permissions), `*appHasPermission`.
- Produces: responsive Material shell (`mat-sidenav` + toolbar), nav items filtered by permission, real user in footer, notification bell (count from `notification.data`).

- [ ] **Step 1** Build shell with `mat-sidenav-container`, toolbar (page title + notification bell + user menu with logout), sidenav nav list. Each nav link wrapped in `*appHasPermission`.
- [ ] **Step 2** Point `admin.routes.ts` children at existing + new pages; keep lazy `loadComponent`. Add a route-level permission guard `permissionGuard('x')` that redirects to `/admin/dashboard` if lacking.
- [ ] **Step 3** Verify nav shows/hides by role (log in as viewer vs super-admin).
- [ ] **Step 4: Commit** — `git commit -am "feat: rebuilt permission-driven admin shell"`

---

### Task 13: Activity-log viewer + Notifications feed

**Files:**
- Create: `src/app/core/services/audit.data.ts`, `notification.data.ts`; `src/app/admin/audit/*`, `src/app/admin/notifications/*`

**Interfaces:**
- Consumes: `AuditLog`, `AppNotification`, rules `audit.view`.
- Produces: paginated audit table (filter by resource/actor/date); notifications list with mark-as-read.

- [ ] **Step 1** audit.data.ts `listAudit(filter, pageSize)`; notification.data.ts `listForUser(uid)`, `markRead(id)`, `unreadCount$`.
- [ ] **Step 2** Audit viewer table (guarded `*appHasPermission="'audit.view'"`); notifications page + bell binding.
- [ ] **Step 3** Verify: perform a role change (writes audit) → appears in viewer; a seeded notification shows in the bell.
- [ ] **Step 4: Commit** — `git commit -am "feat: activity-log viewer + notifications feed"`

---

### Task 14: Phase-0 QA gate

- [ ] **Step 1** `npx ng build` → Expected: success, no errors.
- [ ] **Step 2** `npx ng test --no-watch` → Expected: all unit tests pass.
- [ ] **Step 3** `firebase emulators:exec "npx vitest run tests/rules"` → Expected: rules tests pass.
- [ ] **Step 4** Manual smoke against emulator: seed → login as super-admin → create role → assign to user → nav reflects permissions → audit log records it.
- [ ] **Step 5: Commit** — `git commit -am "test: phase-0 foundation QA green"`

---

## Self-Review

**Spec coverage:** emulator (T1,T8) ✓; models (T2) ✓; RBAC catalogue+dynamic roles (T3,T10) ✓; custom claims/no-escalation (T4,T11) ✓; audit engine (T5,T13) ✓; notifications (T5,T13) ✓; security rules (T6) ✓; seed (T7) ✓; permission directive (T9) ✓; admin shell (T12) ✓; QA (T14) ✓. Ads/Sales/Purchase/Customers/Leads/CMS/Media/Reports/Settings are **out of Phase 0 by design** — each is its own later plan.

**Placeholder scan:** pure-function tasks (T3,T9) carry full TDD code; infra tasks carry exact configs/commands; UI tasks (T10–T13) specify files, interfaces, guards, and verify steps rather than full markup (appropriate — Material UI assembled during build, matching existing admin conventions).

**Type consistency:** `Role`, `AppNotification`, `AuditLog`, `Permission`, `hasPermission`, `PERMISSIONS`, `setUserRole`, `writeAudit`, `pushNotification` used consistently across tasks.
