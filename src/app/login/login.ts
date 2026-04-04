import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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

  constructor(private router: Router) {}

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
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');

      // Find user by email and password
      const user = users.find((u: any) => u.email === this.email && u.password === this.password);

      if (!user) {
        this.submitError = 'Invalid email or password. Please try again.';
        this.isLoading = false;
        return;
      }

      // Save session
      localStorage.setItem('userLoggedIn', 'true');
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userType', user.userType);
      localStorage.setItem('userId', user.id);

      // Success message
      alert(`✅ Welcome back, ${user.name}!`);

      // ✅ Dono user types ek hi dashboard pe jayenge
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.submitError = err?.message || 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
