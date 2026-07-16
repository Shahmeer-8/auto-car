import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;

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

  onSubmit() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      this.submitError = false;

      // Simulate API call
      setTimeout(() => {
        console.log('Form Data:', this.contactForm.value);
        
        // Success
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      }, 1500);

      // In real application, you would do:
      // this.contactService.submitForm(this.contactForm.value).subscribe({
      //   next: (response) => {
      //     this.isSubmitting = false;
      //     this.submitSuccess = true;
      //     this.contactForm.reset();
      //   },
      //   error: (error) => {
      //     this.isSubmitting = false;
      //     this.submitError = true;
      //   }
      // });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
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