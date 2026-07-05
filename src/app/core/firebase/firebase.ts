import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { environment } from '../../../environments/environment';

let app: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;
let functionsInstance: Functions;

/**
 * Emulator use is OPT-IN. By default `npm start` talks to the real cloud project
 * (so login works out of the box). To use the LOCAL emulator instead, EITHER:
 *   - set USE_EMULATORS = true below, OR
 *   - in the browser console run: localStorage.setItem('autocar_use_emulators','1')
 * (then run `npm run emulate` + `npm run seed`). Never used in production builds.
 */
const USE_EMULATORS = false;

function emulatorsEnabled(): boolean {
  if (environment.production) return false;
  if (USE_EMULATORS) return true;
  try {
    return typeof localStorage !== 'undefined'
      && localStorage.getItem('autocar_use_emulators') === '1';
  } catch {
    return false;
  }
}

const useEmulators = emulatorsEnabled();

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
    if (useEmulators) {
      connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
    if (useEmulators) {
      connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
    }
  }
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
    if (useEmulators) {
      connectStorageEmulator(storageInstance, '127.0.0.1', 9199);
    }
  }
  return storageInstance;
}

export function getFirebaseFunctions(): Functions {
  if (!functionsInstance) {
    functionsInstance = getFunctions(getFirebaseApp());
    if (useEmulators) {
      connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
    }
  }
  return functionsInstance;
}
