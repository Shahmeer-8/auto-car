import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fp-page">
      <div class="fp-card">
        <a routerLink="/" class="fp-logo">Auto<strong>Flex</strong></a>

        @if (sent()) {
          <h1>Check your email</h1>
          <p class="fp-sub">
            If an account exists for <strong>{{ email() }}</strong>, we've sent a link to reset your
            password. Open it and follow the instructions to choose a new password.
          </p>
          <a routerLink="/login" class="fp-btn">Back to Sign In</a>
          <p class="fp-foot">
            Didn't get it? Check your spam folder or
            <button type="button" class="fp-link" (click)="sent.set(false)">try again</button>.
          </p>
        } @else {
          <h1>Reset your password</h1>
          <p class="fp-sub">
            Enter the email address linked to your account and we'll send you a link to reset your
            password.
          </p>

          <form (ngSubmit)="onSubmit()" novalidate>
            <label for="fp-email">Email Address</label>
            <input
              id="fp-email"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="you@example.com"
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
            />

            @if (error()) {
              <p class="fp-error" role="alert">{{ error() }}</p>
            }

            <button type="submit" class="fp-btn" [disabled]="isLoading()">
              {{ isLoading() ? 'Sending…' : 'Send reset link' }}
            </button>
          </form>

          <p class="fp-foot">Remembered it? <a routerLink="/login">Sign in</a></p>
        }
      </div>
    </div>
  `,
  styles: `
    .fp-page {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 20px;
      background: #f8fafc;
    }
    .fp-card {
      width: 100%;
      max-width: 440px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 40px 32px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    }
    .fp-logo {
      display: inline-block;
      font-size: 1.4rem;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
      margin-bottom: 24px;
    }
    .fp-logo strong { color: #e8452e; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; color: #111827; }
    .fp-sub { color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
    label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: #374151; }
    input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 1rem;
      margin-bottom: 8px;
    }
    input:focus { outline: 2px solid #e8452e; outline-offset: 1px; border-color: #e8452e; }
    .fp-error { color: #dc2626; font-size: 0.9rem; margin: 4px 0 12px; }
    .fp-btn {
      display: inline-block;
      width: 100%;
      text-align: center;
      padding: 12px 18px;
      background: #e8452e;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      margin-top: 8px;
    }
    .fp-btn[disabled] { opacity: 0.65; cursor: default; }
    .fp-foot { margin-top: 20px; color: #4b5563; font-size: 0.9rem; }
    .fp-foot a { color: #e8452e; font-weight: 600; }
    .fp-link {
      background: none;
      border: none;
      color: #e8452e;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-size: inherit;
    }
  `,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);

  readonly email = signal('');
  readonly isLoading = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');

  async onSubmit(): Promise<void> {
    const email = this.email().trim();
    this.error.set('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('Please enter a valid email address.');
      return;
    }

    this.isLoading.set(true);
    try {
      await this.auth.sendPasswordReset(email);
      this.sent.set(true);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      // Never reveal whether an account exists — treat "not found" as success.
      if (code === 'auth/user-not-found') {
        this.sent.set(true);
      } else if (code === 'auth/invalid-email') {
        this.error.set('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        this.error.set('Too many attempts. Please try again in a few minutes.');
      } else {
        this.error.set('Could not send the reset email. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
