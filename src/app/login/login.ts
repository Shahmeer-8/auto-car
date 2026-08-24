import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;

  emailError = '';
  passwordError = '';
  submitError = '';
  isLoading = false;

  // Shown when arriving here right after creating an account.
  justRegistered = false;

  /** Where to go after signing in (e.g. the checkout the buyer was sent from). */
  returnUrl = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {
    this.justRegistered = this.route.snapshot.queryParamMap.get('registered') === '1';
    const raw = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
    // Only ever return to an in-app path — never to an absolute/external URL.
    this.returnUrl = raw.startsWith('/') && !raw.startsWith('//') ? raw : '';
  }

  clearError(field: 'email' | 'password') {
    if (field === 'email') this.emailError = '';
    if (field === 'password') this.passwordError = '';
    this.submitError = '';
  }

  validate(): boolean {
    let valid = true;

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

    return valid;
  }

  async onSubmit() {
    this.submitError = '';
    if (!this.validate()) return;

    this.isLoading = true;

    try {
      const profile = await this.authService.login(this.email, this.password);

      if (profile?.isActive === false) {
        await this.authService.logout();
        this.submitError = 'Your account has been deactivated. Please contact support.';
        return;
      }

      // Honour an explicit return target (e.g. a checkout the buyer was bounced from);
      // otherwise route by role: admins land on the admin dashboard, everyone else on theirs.
      if (this.returnUrl) {
        this.router.navigateByUrl(this.returnUrl);
        return;
      }
      const target = profile?.userType === 'admin' ? '/admin/dashboard' : '/dashboard';
      this.router.navigate([target]);
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
