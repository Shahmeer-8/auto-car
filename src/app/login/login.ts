import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
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

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

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
    } else if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters.';
      valid = false;
    }

    return valid;
  }

  async onSubmit() {
    this.submitError = '';
    if (!this.validate()) return;

    this.isLoading = true;

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      this.submitError = this.authService.mapAuthError(code);
    } finally {
      this.isLoading = false;
    }
  }
}
