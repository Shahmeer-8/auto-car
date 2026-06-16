import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BehaviorSubject, Observable, filter, firstValueFrom, map, take } from 'rxjs';
import { getFirebaseAuth, getFirebaseDb } from '../core/firebase/firebase';
import { AppUser, UserRegistrationData, UserType } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth: Auth = getFirebaseAuth();
  private readonly db = getFirebaseDb();

  private readonly authReadySubject = new BehaviorSubject(false);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly userProfileSubject = new BehaviorSubject<AppUser | null>(null);

  readonly authReady$ = this.authReadySubject.asObservable();
  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly userProfile$ = this.userProfileSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUserSubject.next(user);

      if (user) {
        const profile = await this.fetchUserProfile(user.uid);
        this.userProfileSubject.next(profile);
      } else {
        this.userProfileSubject.next(null);
      }

      this.authReadySubject.next(true);
    });
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get userProfile(): AppUser | null {
    return this.userProfileSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  waitUntilReady(): Promise<void> {
    return firstValueFrom(
      this.authReady$.pipe(
        filter((ready) => ready),
        take(1),
        map(() => undefined),
      ),
    );
  }

  async register(data: UserRegistrationData): Promise<void> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      data.email.trim(),
      data.password,
    );

    await updateProfile(credential.user, { displayName: data.name.trim() });

    const profile: AppUser = {
      uid: credential.user.uid,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      userType: data.userType,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    await setDoc(doc(this.db, 'users', credential.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
    });

    this.userProfileSubject.next(profile);
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email.trim(), password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  getUserType(): UserType {
    return this.userProfile?.userType ?? 'buyer';
  }

  get isAdmin(): boolean {
  return this.userProfile?.userType === 'admin';
}

  getUserDisplayName(): string {
    return this.userProfile?.name ?? this.currentUser?.displayName ?? '';
  }

  getUserEmail(): string {
    return this.userProfile?.email ?? this.currentUser?.email ?? '';
  }

  mapAuthError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please log in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 8 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  private async fetchUserProfile(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(this.db, 'users', uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      uid,
      name: data['name'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      userType: data['userType'] ?? 'buyer',
      createdAt: data['createdAt']?.toDate?.()?.toISOString?.() ?? data['createdAt'] ?? '',
      isActive: data['isActive'] ?? true,
    };
  }
}
