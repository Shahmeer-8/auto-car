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
      if (user) {
        const profile = await this.fetchUserProfile(user.uid);

        // Banned users are signed out immediately and never treated as active.
        if (profile && profile.isActive === false) {
          this.userProfileSubject.next(null);
          this.currentUserSubject.next(null);
          this.authReadySubject.next(true);
          await signOut(this.auth);
          return;
        }

        this.currentUserSubject.next(user);
        this.userProfileSubject.next(profile);
      } else {
        this.currentUserSubject.next(null);
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

  get isActive(): boolean {
    // Treat missing profile as active=false only when a user is signed in.
    return this.userProfile?.isActive !== false;
  }

  /** Current user's effective permissions (empty when signed out). Used by RBAC guards/directive. */
  get permissions(): string[] {
    return this.userProfile?.permissions ?? [];
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

  async login(email: string, password: string): Promise<AppUser | null> {
    const credential = await signInWithEmailAndPassword(this.auth, email.trim(), password);
    // Load the profile right away so callers can route by role without a race.
    return this.reloadProfile(credential.user.uid);
  }

  /**
   * Fetches the latest profile for the given (or current) user and publishes it.
   * Returns the profile so callers can make immediate decisions (e.g. role-based redirect).
   */
  async reloadProfile(uid?: string): Promise<AppUser | null> {
    const userId = uid ?? this.currentUser?.uid;
    if (!userId) return null;

    const profile = await this.fetchUserProfile(userId);
    this.userProfileSubject.next(profile);
    return profile;
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
      roleId: data['roleId'] ?? undefined,
      roleName: data['roleName'] ?? undefined,
      permissions: data['permissions'] ?? [],
    };
  }
}
