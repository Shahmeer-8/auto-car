/**
 * Creates (or repairs) the two demo accounts on the LIVE Firebase project.
 *
 *   node scripts/create-accounts.mjs
 *
 * Uses the ordinary public client SDK, so it needs no service-account key — it
 * does exactly what a visitor signing up through the site would do.
 *
 * Promoting admin@gmail.com to a real admin is a privileged write that the
 * security rules deliberately refuse to a self-registering user, so that step
 * needs the credentials of an account that already has users.manage (or the
 * legacy userType 'admin'):
 *
 *   PROMOTER_EMAIL=... PROMOTER_PASSWORD=... node scripts/create-accounts.mjs
 *
 * Without them the script still creates both logins and then tells you exactly
 * which document to edit in the Firebase console.
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

// Read the same config the app ships with, straight out of the generated environment file.
const envSrc = readFileSync(new URL('../src/environments/environment.ts', import.meta.url), 'utf8');
const firebaseConfig = JSON.parse(envSrc.match(/"firebase":\s*(\{[\s\S]*?\n  \})/)[1]);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SUPER_ADMIN_PERMISSIONS = ['*'];

const ACCOUNTS = [
  {
    email: 'admin@gmail.com',
    password: 'admin123',
    name: 'Admin',
    phone: '+92 300 0000001',
    // Rules only allow self-registration as buyer/seller; promoted below.
    signupType: 'seller',
    promoteTo: {
      userType: 'admin',
      roleId: 'super-admin',
      roleName: 'Super Admin',
      permissions: SUPER_ADMIN_PERMISSIONS,
    },
  },
  {
    email: 'user@gmail.com',
    password: 'user123',
    name: 'User',
    phone: '+92 300 0000002',
    signupType: 'buyer',
    promoteTo: null,
  },
];

/** Signs the account in, creating it first if it doesn't exist yet. */
async function ensureAuthUser({ email, password, name }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return { uid: cred.user.uid, created: true };
  } catch (err) {
    if (err.code !== 'auth/email-already-in-use') throw err;
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, created: false };
  }
}

async function ensureProfileDoc(uid, account) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const profile = {
    uid,
    name: account.name,
    email: account.email,
    phone: account.phone,
    userType: account.signupType,
    isActive: true,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return profile;
}

async function main() {
  const results = [];

  for (const account of ACCOUNTS) {
    const { uid, created } = await ensureAuthUser(account);
    const profile = await ensureProfileDoc(uid, account);
    await signOut(auth);
    results.push({ account, uid, created, userType: profile.userType });
    console.log(
      `${created ? 'Created' : 'Already existed'}: ${account.email}  uid=${uid}  userType=${profile.userType}`,
    );
  }

  // ---- privileged step: promote the admin account ----
  const admin = results.find((r) => r.account.promoteTo);
  if (!admin) return;

  if (admin.userType === 'admin') {
    console.log('\nadmin@gmail.com is already an admin — nothing to promote.');
    return;
  }

  const promoterEmail = process.env.PROMOTER_EMAIL;
  const promoterPassword = process.env.PROMOTER_PASSWORD;

  if (!promoterEmail || !promoterPassword) {
    console.log(`
─────────────────────────────────────────────────────────────
admin@gmail.com exists and can log in, but is NOT yet an admin.
Promoting it is a privileged write that the security rules only
allow from an existing admin.

Either re-run with an existing admin's credentials:
  PROMOTER_EMAIL=... PROMOTER_PASSWORD=... node scripts/create-accounts.mjs

Or edit this document by hand in the Firebase console
(Firestore Database -> users -> ${admin.uid}) and set:
  userType    (string) = admin
  roleId      (string) = super-admin
  roleName    (string) = Super Admin
  permissions (array)  = ["*"]
─────────────────────────────────────────────────────────────`);
    return;
  }

  await signInWithEmailAndPassword(auth, promoterEmail, promoterPassword);
  await setDoc(doc(db, 'users', admin.uid), admin.account.promoteTo, { merge: true });
  await signOut(auth);
  console.log(`\nPromoted admin@gmail.com (${admin.uid}) to Super Admin.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FAILED:', err.code || '', err.message);
    process.exit(1);
  });
