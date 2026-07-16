import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../core/firebase/firebase';
import { ContentService } from '../core/services/content.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class Contact {
  readonly content = inject(ContentService).content;
  readonly savedContent = inject(ContentService).saved;

  contactForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal(false);
  private db = getFirebaseDb();

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      country: ['', Validators.required],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(20)]],
      newsletter: [false]
    });
  }

  async onSubmit() {
    if (!this.contactForm.valid) {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(false);
    const v = this.contactForm.value;

    try {
      await addDoc(collection(this.db, 'complaints'), {
        subject: `[Contact] ${v.subject}`,
        message: `${v.message}\n\nPhone: ${v.phone || '—'} | Country: ${v.country}`,
        email: v.email,
        name: `${v.firstName} ${v.lastName}`.trim(),
        status: 'open',
        source: 'contact',
        createdAt: serverTimestamp(),
      });

      if (v.newsletter && v.email) {
        try {
          await addDoc(collection(this.db, 'newsletterSubscribers'), {
            email: v.email,
            source: 'contact',
            createdAt: serverTimestamp(),
          });
        } catch { /* newsletter opt-in failure must not fail the contact submit */ }
      }

      this.submitSuccess.set(true);
      this.contactForm.reset();
      setTimeout(() => { this.submitSuccess.set(false); }, 5000);
    } catch (err) {
      console.error('Contact submit failed:', err);
      this.submitError.set(true);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Helper method to check if field has error
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  // Helper method to get error message
  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    
    return '';
  }
}