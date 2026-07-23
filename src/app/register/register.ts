import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { filter, firstValueFrom, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  phone = '';
  // Every account can both buy and sell — no buyer/seller choice at sign-up.
  userType: 'buyer' | 'seller' = 'seller';
  acceptTerms = false;

  nameError = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';
  phoneError = '';
  submitError = '';

  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  clearError(field: string) {
    switch (field) {
      case 'name':
        this.nameError = '';
        break;
      case 'email':
        this.emailError = '';
        break;
      case 'password':
        this.passwordError = '';
        break;
      case 'confirmPassword':
        this.confirmPasswordError = '';
        break;
      case 'phone':
        this.phoneError = '';
        break;
    }
    this.submitError = '';
  }

  /** Real-time email validation (runs on blur). */
  validateEmail() {
    const email = this.email.trim();
    if (!email) {
      this.emailError = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.emailError = 'Please enter a valid email address.';
    } else {
      this.emailError = '';
    }
  }

  validate(): boolean {
    let valid = true;

    if (!this.name.trim()) {
      this.nameError = 'Full name is required.';
      valid = false;
    } else if (this.name.trim().length < 3) {
      this.nameError = 'Name must be at least 3 characters.';
      valid = false;
    }

    if (!this.email.trim()) {
      this.emailError = 'Email address is required.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError = 'Please enter a valid email address.';
      valid = false;
    }

    if (!this.password) {
      this.passwordError = 'Password is required.';
      valid = false;
    } else if (this.password.length < 8) {
      this.passwordError = 'Password must be at least 8 characters.';
      valid = false;
    }

    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Please confirm your password.';
      valid = false;
    } else if (this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match.';
      valid = false;
    }

    if (!this.phone.trim()) {
      this.phoneError = 'Phone number is required.';
      valid = false;
    } else if (!/^\+?[\d\s-]{10,}$/.test(this.phone)) {
      this.phoneError = 'Please enter a valid phone number.';
      valid = false;
    }

    if (!this.acceptTerms) {
      this.submitError = 'You must accept the terms and conditions.';
      valid = false;
    }

    return valid;
  }

  async onSubmit() {
    this.submitError = '';

    if (!this.validate()) return;

    this.isLoading = true;

    try {
      await this.authService.register({
        name: this.name,
        email: this.email,
        password: this.password,
        phone: this.phone,
        userType: this.userType,
      });

      // Firebase signs the new user in automatically. Sign them back out and send
      // them to the login page to sign in explicitly. Wait for the auth state to
      // clear first, otherwise the login page's guest guard bounces them back.
      await this.authService.logout();
      await firstValueFrom(
        this.authService.currentUser$.pipe(
          filter((u) => u === null),
          take(1),
        ),
      );

      this.router.navigate(['/login'], { queryParams: { registered: '1' } });
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      this.submitError = this.authService.mapAuthError(code);
    } finally {
      this.isLoading = false;
      // Firebase auth resolves outside Angular's zone; force the view to update.
      this.cdr.detectChanges();
    }
  }
}
