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

// Connect to local emulators exactly once, only in dev.
let emulatorsConnected = false;
const useEmulators = !environment.production;

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
