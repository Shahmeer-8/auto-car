/**
 * Creates (or repairs) the two demo accounts on the LIVE Firebase project.
 *
 *   ADMIN_DEMO_PASSWORD=... USER_DEMO_PASSWORD=... node scripts/create-accounts.mjs
 *
 * Passwords are read from the environment and NEVER hardcoded here: this file is
 * committed, and one of these accounts holds full admin on a live site. To roll a
 * password, run the script again with the new value (see OLD_*_PASSWORDS below).
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
  updatePassword,
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

/** Reads a required password from the environment; refuses to guess one. */
function requirePassword(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Run e.g.  ${name}=<password> node scripts/create-accounts.mjs`);
    process.exit(1);
  }
  return value;
}

/** Comma-separated list of superseded passwords, so a rolled password self-heals. */
const oldPasswords = (name) => (process.env[name] ?? '').split(',').filter(Boolean);

const ACCOUNTS = [
  {
    email: process.env.ADMIN_DEMO_EMAIL ?? 'admin@gmail.com',
    password: requirePassword('ADMIN_DEMO_PASSWORD'),
    oldPasswords: oldPasswords('OLD_ADMIN_DEMO_PASSWORDS'),
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
    email: process.env.USER_DEMO_EMAIL ?? 'user@gmail.com',
    password: requirePassword('USER_DEMO_PASSWORD'),
    oldPasswords: oldPasswords('OLD_USER_DEMO_PASSWORDS'),
    name: 'User',
    phone: '+92 300 0000002',
    signupType: 'buyer',
    promoteTo: null,
  },
];

/**
 * Signs the account in, creating it first if it doesn't exist yet. If the account
 * exists on an older password, it is signed in with that and reset to the current
 * one, so re-running this script always leaves the documented password working.
 */
async function ensureAuthUser({ email, password, name, oldPasswords = [] }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return { uid: cred.user.uid, created: true };
  } catch (err) {
    if (err.code !== 'auth/email-already-in-use') throw err;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { uid: cred.user.uid, created: false };
  } catch (err) {
    if (err.code !== 'auth/invalid-credential' && err.code !== 'auth/wrong-password') throw err;
  }

  for (const old of oldPasswords) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, old);
      await updatePassword(cred.user, password);
      console.log(`  password for ${email} updated to the current one`);
      return { uid: cred.user.uid, created: false };
    } catch {
      // try the next known password
    }
  }

  throw new Error(`${email} exists but none of the known passwords work — reset it manually.`);
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
