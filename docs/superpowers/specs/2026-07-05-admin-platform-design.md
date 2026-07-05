# AutoCar — Admin Panel & Platform Master Design

**Status:** Approved (foundational decisions locked)
**Date:** 2026-07-05
**Author:** Engineering (with Shahmeer)
**Scope:** Rebuild the Admin Panel (CMS) into a complete, professional car-dealership **and** classifieds/marketplace ("ads") management platform. Runs fully locally on the Firebase Emulator Suite.

---

## 1. Product Vision

AutoCar is an **online auto sale & purchase platform** — the kind a real car dealership / marketplace company runs. It has two faces:

1. **Public storefront** (exists today, stays): browse cars, view an ad, submit an inquiry, sellers post ads.
2. **Admin Panel / CMS** (rebuilt): a complete back-office to run the business — moderate ads, manage inventory, record sales & purchases, manage customers & leads, control site content, manage staff & permissions, and see reports.

The platform treats a car listing as an **"Ad"** with a full lifecycle (like PakWheels/OLX) *and* as **dealership inventory** when the company owns the car. Both are modelled first-class.

---

## 2. Locked Architecture Decisions

| Decision | Choice |
|----------|--------|
| Backend / DB | **Firebase / Firestore** (NoSQL, relationships via references + subcollections + controlled denormalization) |
| Local environment | **Firebase Emulator Suite** (Auth + Firestore + Storage + Functions), 100% local, seedable/resettable |
| Business logic & security | **Hybrid**: Firestore Security Rules for access + **Cloud Functions** for sensitive/transactional writes, audit, notifications, claims |
| Access control | **Dynamic RBAC** — roles + granular permission matrix, carried in **custom claims** |
| Build priority | Foundation → **Inventory/Ads** → Sales/Purchase → Customers/Leads → Support modules |
| UI stack | **Angular Material**, custom professional theme |

---

## 3. Technical Architecture

```
Angular 21 app (single codebase)
├── Public storefront (existing)         → Firebase SDK (read approved ads, create inquiry)
└── Admin Panel /admin (rebuilt)         → Firebase SDK (reads, simple writes)
                                         → Callable Cloud Functions (sensitive writes)
        │
        ▼
Firebase Emulator Suite (local)
├── Auth            → users + custom claims (role, permissions[])
├── Firestore       → all business data + security rules
├── Storage         → media (car images, documents)
├── Functions       → business logic, transactions, audit, notifications, claim sync
└── seed script     → deterministic demo data (roles, admin, sample ads/customers/sales)
```

### Angular layering (clean, modular)
```
feature module (lazy-loaded)         e.g. admin/inventory
  └── presentational components      Material UI, no data access
        └── facade service           state via signals, orchestrates use-cases
              └── data-access service Firestore / Functions calls only
                    └── models + validators (shared, typed, reused by Functions where possible)
```
**Rule:** no component touches Firestore directly. Every module is independently understandable and testable.

### Cloud Functions layout (`/functions`)
```
functions/src/
  auth/         setUserClaims, onRoleChange
  ads/          moderateAd, featureAd, expireAdsScheduled
  sales/        createSale (transaction), voidSale
  purchase/     createPurchase (transaction)
  inventory/    adjustStock
  audit/        writeAudit (internal helper, called by every mutation)
  notifications/ pushNotification (internal helper)
  lib/          permissions.ts (shared perm checks), validators (shared with client)
```

---

## 4. Data Model (Firestore)

Relationships are modelled with **reference IDs** + selective **denormalized snapshots** (for list performance) + **subcollections** for owned children.

### Core collections

**`users/{uid}`** — account + profile
`{ uid, name, email, phone, roleId, roleName, permissions[], isActive, createdAt, createdBy, lastLoginAt }`
- `permissions[]` mirrored into custom claims by a Function; never client-writable.

**`roles/{roleId}`** — dynamic RBAC
`{ id, name, description, permissions[], isSystem (bool, undeletable), createdAt, updatedAt }`
- Seeded: `super-admin`, `manager`, `sales-agent`, `inventory-manager`, `viewer`.

**`ads/{adId}`** — a car listing (marketplace ad AND/OR dealership inventory)
```
{
  id, refCode,                       // human ref e.g. AD-2026-00042
  // vehicle
  make, model, variant, year, mileage, transmission, fuelType,
  bodyType, color, engine, registrationCity, condition, features[],
  // commercial
  price, negotiable, currency:'PKR',
  // ownership / source
  listingType: 'marketplace' | 'dealership',  // seller ad vs company stock
  sellerId, sellerName, sellerPhone,          // for marketplace ads
  supplierId?,                                 // for dealership stock (purchased)
  // lifecycle
  status: 'draft'|'pending'|'active'|'rejected'|'sold'|'expired'|'archived',
  rejectionReason?, moderatedBy?, moderatedAt?,
  // promotion (the "ads plans")
  plan: 'free'|'featured'|'sponsored',
  featured: bool, featuredUntil?,
  // media
  coverImage, imageCount,                      // images in subcollection/Storage
  // stats
  views, inquiriesCount,
  // audit
  createdBy, createdAt, updatedAt, publishedAt?, soldAt?
}
```
- Subcollection `ads/{adId}/media/{mediaId}` → `{ url, path, order, type, uploadedAt }` (images live in **Storage**, not base64 — fixes the 1 MB limit).
- Public storefront reads only `status == 'active'`.

**`customers/{customerId}`** — buyers/leads-turned-customers (CRM)
`{ id, name, email, phone, city, type:'individual'|'dealer', source, tags[], totalPurchases, createdBy, createdAt }`

**`leads/{leadId}`** — inquiries on ads (sales pipeline)
`{ id, adId, adSnapshot{make,model,year,price}, customerId?, name, phone, email, message, channel:'web'|'phone'|'walkin', status:'new'|'contacted'|'negotiating'|'won'|'lost', assignedTo, notes[], createdAt, updatedAt }`

**`sales/{saleId}`** — a completed sale (written only via Function, in a transaction)
`{ id, refCode, adId, vehicleSnapshot, customerId, customerSnapshot, salePrice, costPrice?, profit?, paymentMethod, paymentStatus:'paid'|'partial'|'pending', amountPaid, agentId, agentName, saleDate, documents[], createdBy, createdAt }`
- Transaction side-effects: set ad `status='sold'`, decrement stock, write audit + notification.

**`purchases/{purchaseId}`** — acquiring stock (via Function/transaction)
`{ id, refCode, supplierId, supplierSnapshot, vehicleDetails, purchasePrice, paymentStatus, amountPaid, createdAdId?, purchaseDate, createdBy, createdAt }`

**`suppliers/{supplierId}`** — vendors the dealership buys from
`{ id, name, contactPerson, phone, email, city, notes, createdAt }`

**`content/{docId}`** & **`config/{docId}`** — CMS + settings (homepage hero, banners, attributes: makes/body/fuel, business settings, ad-plan pricing & expiry rules).

**`media/{mediaId}`** — central media library index → `{ url, path, type, size, folder, uploadedBy, uploadedAt, linkedTo? }`.

**`notifications/{notifId}`** — in-app notifications → `{ id, userId|role, title, body, type, read, link, createdAt }`.

**`auditLogs/{logId}`** — immutable activity trail (write-only via Functions)
`{ id, actorUid, actorName, action, resource, resourceId, before?, after?, ip?, at }`
- Rules: **no client writes, no updates, no deletes** — append-only, admins read.

### Relationship map
```
role 1───* user
user 1───* ad (createdBy) / sale (agent) / lead (assignedTo)
ad   1───* media,  1───* lead,  1───0..1 sale
customer 1───* lead, 1───* sale
supplier 1───* purchase ─creates→ ad (dealership stock)
every mutation ─writes→ auditLog (+ optional notification)
```

---

## 5. RBAC & Permissions

**Permission catalogue** (`resource.action`):
`dashboard.view`, `ads.view/create/edit/delete/moderate/feature`, `inventory.view/edit/adjust`, `sales.view/create/approve/void`, `purchase.view/create/approve`, `customers.view/manage`, `leads.view/manage/assign`, `cms.view/edit`, `media.view/manage`, `reports.view`, `users.view/manage`, `roles.manage`, `settings.manage`, `audit.view`, `notifications.view`.

**Enforcement — 3 layers (defense in depth):**
1. **UI** — `*appHasPermission="'sales.create'"` structural directive hides/disables controls.
2. **Firestore Rules** — helper `hasPerm('x')` reads custom claims; every collection guarded.
3. **Functions** — every callable re-verifies permission server-side, then acts + audits. A client can never escalate because claims are set only by a Function on verified role change.

---

## 6. Modules (responsibilities)

| Module | Route | Core features |
|--------|-------|---------------|
| **Dashboard** | `/admin/dashboard` | KPI tiles (active ads, sales MTD, revenue, profit, new leads), charts, recent activity |
| **Ads / Listings** | `/admin/ads` | All listings, moderation queue (approve/reject + reason), feature/sponsor, expiry, filters, detail view, media |
| **Inventory** | `/admin/inventory` | Company-owned stock (dealership ads), stock status, cost vs price, quick add→ad |
| **Sales** | `/admin/sales` | Record sale (Function/transaction), payment status, invoice/documents, profit, agent attribution |
| **Purchase** | `/admin/purchase` | Record purchases from suppliers, auto-create stock ad, payment tracking |
| **Customers** | `/admin/customers` | CRM records, history, tags, merge from leads |
| **Leads / Inquiries** | `/admin/leads` | Pipeline (new→contacted→negotiating→won/lost), assignment, notes, convert to sale |
| **Suppliers** | `/admin/suppliers` | Vendor directory |
| **CMS / Content** | `/admin/content` | Homepage hero/banners, static pages, ad-attributes (makes/body/fuel) |
| **Media library** | `/admin/media` | Upload/browse/delete Storage assets |
| **Reports & Analytics** | `/admin/reports` | Sales/purchase/profit over time, inventory aging, lead conversion, top makes, agent performance (export CSV) |
| **User management** | `/admin/users` | Invite/create staff, assign role, activate/ban |
| **Roles & permissions** | `/admin/roles` | Create roles, toggle permission matrix |
| **Notifications** | `/admin/notifications` | In-app notifications feed |
| **Activity logs** | `/admin/audit` | Filterable audit trail |
| **Settings** | `/admin/settings` | Business info, ad-plan pricing & expiry, currency, defaults |

---

## 7. Cross-Cutting Concerns

- **Audit logging:** every Function mutation calls `writeAudit(before, after)`. Append-only collection. UI viewer in Activity logs.
- **Notifications:** Functions emit in-app notifications on key events (ad pending → notify moderators; sale created → notify manager; lead assigned → notify agent).
- **Validation:** shared TypeScript validators used by both Angular reactive forms and Cloud Functions (single source of truth). Reactive forms throughout (per project standards).
- **Error handling:** data-access layer normalizes Firebase errors into typed app errors; UI shows Material snackbars; Functions throw `HttpsError` with codes.
- **Media:** all images move to **Firebase Storage** (path `ads/{adId}/...`); Firestore stores only URLs + metadata. Client-side compression retained. Fixes the current base64 / 1 MB-document defect.
- **Security rules strategy:** default-deny; per-collection rules using `hasPerm()`; audit/immutable collections reject client writes; storefront can read only `active` ads.
- **Testing:** unit tests for facades/validators; Functions tested against the emulator; seed data enables repeatable manual QA.
- **Accessibility:** Material + WCAG AA (project mandate) — labels, focus management, contrast, AXE clean.

---

## 8. Local Setup (Emulator)

- `firebase.json` gains `emulators` config (auth, firestore, storage, functions, ui).
- `npm run emulate` → starts the suite; `npm run seed` → loads roles + a super-admin + demo ads/customers/sales.
- Angular points to emulators in dev (via `connect*Emulator` when `!environment.production`).
- Everything runs offline; the live cloud project is never touched.

---

## 9. Phasing / Roadmap

- **Phase 0 — Foundation:** emulator config, data models & validators, security-rules skeleton, Auth + custom-claims Function, dynamic RBAC (roles/permissions + UI), admin shell (Material themed nav), audit + notification engines, seed script, `hasPermission` directive. **Built first.**
- **Phase 1 — Ads/Inventory:** full Ads/Listings module (CRUD, moderation, feature, media→Storage, lifecycle) + Inventory view.
- **Phase 2 — Transactions:** Sales, Purchase, Suppliers, Customers, Leads (with transactional Functions).
- **Phase 3 — Support:** CMS, Media library, Reports, Dashboard analytics, Notifications UI, Audit viewer, Settings.

Each phase = its own implementation plan → build → QA.

---

## 10. Non-Functional Requirements

- **Scalability:** paginated queries, composite indexes, denormalized snapshots for lists, lazy-loaded feature modules.
- **Performance:** OnPush change detection, signals, image compression + Storage CDN URLs.
- **Security:** default-deny rules, server-verified permissions, append-only audit, no client privilege escalation.
- **Maintainability:** modular feature folders, shared models/validators, no direct Firestore in components.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| base64 images blow the 1 MB doc limit | Move media to Storage (Phase 1) |
| Firestore has no joins | Denormalized snapshots + reference IDs; aggregate in Functions |
| Client privilege escalation | Claims set only by Function; rules + Functions re-check |
| Emulator data loss on reset | Deterministic seed script; export/import emulator data |
| Scope creep (12+ modules) | Strict phasing; one module = one plan/build/QA cycle |

---

## 12. Out of Scope (for now)

- Cloud deployment / Blaze plan (local emulator only).
- Online payment gateway integration (payment *status* tracked, not processed).
- Mobile app.
- The public storefront is **kept as-is** and only integrated (reads active ads from the new model); its redesign is not part of this program.
