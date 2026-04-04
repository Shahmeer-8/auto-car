import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  
  // Form Fields
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  phone = '';
  userType: 'buyer' | 'seller' = 'buyer';
  acceptTerms = false;
  
  // Validation Errors
  nameError = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';
  phoneError = '';
  submitError = '';
  
  // UI States
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(private router: Router) {}

  clearError(field: string) {
    switch(field) {
      case 'name': this.nameError = ''; break;
      case 'email': this.emailError = ''; break;
      case 'password': this.passwordError = ''; break;
      case 'confirmPassword': this.confirmPasswordError = ''; break;
      case 'phone': this.phoneError = ''; break;
    }
    this.submitError = '';
  }

  selectUserType(type: 'buyer' | 'seller') {
    this.userType = type;
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
      await new Promise(resolve => setTimeout(resolve, 1500));

      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const emailExists = existingUsers.some((user: any) => user.email === this.email);

      if (emailExists) {
        this.submitError = 'This email is already registered. Please login instead.';
        this.isLoading = false;
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        name: this.name,
        email: this.email,
        password: this.password,
        phone: this.phone,
        userType: this.userType,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      existingUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(existingUsers));

      // Auto login
      localStorage.setItem('userLoggedIn', 'true');
      localStorage.setItem('userEmail', this.email);
      localStorage.setItem('userName', this.name);
      localStorage.setItem('userType', this.userType);
      localStorage.setItem('userId', newUser.id);

      alert(`✅ Account created successfully!\n\nWelcome ${this.name}!`);

      // ✅ Dono user types ek hi dashboard pe jayenge
      this.router.navigate(['/dashboard']);

    } catch (err: any) {
      this.submitError = err?.message || 'Registration failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}

