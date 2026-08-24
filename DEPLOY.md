# AutoFlex — Deploy Runbook

Everything below runs from the `autocar/` directory. The Firebase project is `autocar-197gb` (from `.firebaserc` / `local.env`).

## One-time prerequisites

1. **Blaze plan** — the notification system uses Cloud Functions Firestore triggers (`onCarCreated`, `onCarStatusChanged`, `onComplaintCreated`, `onOrderCreated`, `onOrderStatusChanged`). Deploying Functions requires the project to be on the Blaze (pay-as-you-go) plan. The existing `setUserRole` function has the same requirement.
2. **Firebase Storage enabled** — listing photos upload to Storage (`cars/{userId}/{listingId}/`). If Storage is not enabled, the app still works: photos fall back to base64 in the Firestore document (with a size guard), but enabling Storage is strongly recommended.
3. Logged in: `npx firebase-tools login`.

## Deploy (full)

```bash
npm run deploy
```

This runs `npm run build` (Angular production build) then `firebase deploy`, which ships, in order:
- **Firestore rules + indexes** — REQUIRED before the new features work in production: **car bookings (the `orders` collection)**, the contact form, newsletter signups, admin mark-read on role-targeted notifications, and the two new `notifications` composite indexes all depend on them. Until the rules ship, placing a booking fails with `Missing or insufficient permissions`.
- **Cloud Functions** — the functions `predeploy` hook (`npm --prefix "$RESOURCE_DIR" run build`) compiles TypeScript automatically. If `$RESOURCE_DIR` substitution fails on Windows, run `npm --prefix functions run build` manually first.
- **Storage rules**
- **Hosting** — serves `dist/Auto-Flex/browser` with SPA rewrites.

## Deploy (targeted)

```bash
# Rules + indexes only (fast; unblocks contact form + notifications reads)
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage

# Functions only (notification triggers)
npx firebase-tools deploy --only functions

# Hosting only (after npm run build)
npx firebase-tools deploy --only hosting
```

## Post-deploy smoke checklist

1. Home page: hero + footer show the CMS values from `/admin/content`; brand cards show real counts.
2. `/cars` loads listings; filters (make, body, price, year, sort) narrow results; URL stays shareable.
3. Submit the contact form while signed out → success message; the message appears in **Admin → Complaints**, and admins get a bell notification (via the `onComplaintCreated` trigger).
4. Submit a listing as a seller → admins get a "New listing awaiting review" notification; approve it → the seller gets an approval notification and the car appears on `/cars` and in the brand counts.
5. Listing photos: open a newly created listing — image URLs should be `firebasestorage.googleapis.com` links (not base64) when Storage is enabled.
6. **Buy flow**: open an approved car → **Buy Now** → sign in if prompted → fill details → place booking. You should land on `/order/<id>` with a booking reference and bank details. Submit a transfer reference, then in **Admin → Car bookings** confirm it: the order turns *Confirmed*, the car is marked **sold** and drops off `/cars`, and both parties get notifications.
7. **Attributes**: change a body type / make / fuel type / transmission in **Admin → Category & attributes**, save, then reload the site — the header "Shop by Type", the footer, the home page cards, the `/cars` filters and the Sell-your-car dropdowns must all show the new list.

## Notes

- `config/content` (CMS) is editable at `/admin/content`; public pages read it live.
- `config/attributes` (makes / body types / fuel types / transmissions) is editable at `/admin/categories` and drives every attribute list on the site.
- `config/checkout` (deposit %, min/max, currency symbol, bank details, WhatsApp, instructions) is editable at the bottom of `/admin/content` and drives the whole buy flow.
- Car bookings live in the `orders` collection. Buyers may only create their own booking (always `pending_payment`) and afterwards only attach a payment reference or cancel; every other transition requires the `orders.manage` permission (legacy admins have `*`).
- Notifications are created ONLY by Cloud Functions (client creation is blocked by security rules by design).
- Firestore composite indexes can take a few minutes to build after the first deploy; the admin notifications feed degrades gracefully until then.
