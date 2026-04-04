import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CarService } from '../services/car.service';

@Component({
  selector: 'app-sell-your-car',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sell-your-car.html',
  styleUrl: './sell-your-car.css'
})
export class SellYourCar {

  isLoading = false;
  currentStep = 1;
  totalSteps = 3;

  // Step 1
  make = '';
  model = '';
  year = '';
  mileage = '';
  transmission = '';
  fuelType = '';
  color = '';
  condition = '';
  bodyType = '';

  // Step 2
  price = '';
  description = '';
  location = '';

  // Step 3
  phone = '';
  images: string[] = [];
  imageError = '';

  // Drag & Drop
  dragIndex: number | null = null;
  dragOverIndex: number | null = null;

  errors: any = {};

  carMakes = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru',
    'Mitsubishi', 'Suzuki', 'Daihatsu', 'Lexus', 'Isuzu',
    'Mercedes Benz', 'BMW', 'Volkswagen', 'Audi', 'Other'
  ];

  years = Array.from({length: 30}, (_, i) => (2024 - i).toString());

  // ✅ CarService inject kiya
  constructor(private router: Router, private carService: CarService) {}

  nextStep() {
    if (this.validateStep()) {
      this.currentStep++;
      window.scrollTo(0, 0);
    }
  }

  prevStep() {
    this.currentStep--;
    window.scrollTo(0, 0);
  }

  validateStep(): boolean {
    this.errors = {};

    if (this.currentStep === 1) {
      if (!this.make) this.errors.make = 'Please select car make.';
      if (!this.model.trim()) this.errors.model = 'Please enter car model.';
      if (!this.year) this.errors.year = 'Please select year.';
      if (!this.mileage) this.errors.mileage = 'Please enter mileage.';
      if (!this.transmission) this.errors.transmission = 'Please select transmission.';
      if (!this.fuelType) this.errors.fuelType = 'Please select fuel type.';
      if (!this.condition) this.errors.condition = 'Please select condition.';
    }

    if (this.currentStep === 2) {
      if (!this.price) this.errors.price = 'Please enter price.';
      if (!this.location.trim()) this.errors.location = 'Please enter location.';
      if (!this.description.trim()) this.errors.description = 'Please enter description.';
      else if (this.description.trim().length < 30)
        this.errors.description = 'Description must be at least 30 characters.';
    }

    if (this.currentStep === 3) {
      if (!this.phone.trim()) this.errors.phone = 'Please enter phone number.';
    }

    return Object.keys(this.errors).length === 0;
  }

  // ✅ 50 images limit + compress
  onImageUpload(event: any) {
    const files = event.target.files;
    this.imageError = '';

    if (this.images.length + files.length > 50) {
      this.imageError = `Maximum 50 photos allowed. You can add ${50 - this.images.length} more.`;
      return;
    }

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          this.images.push(compressed);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
  }

  // ✅ Drag & Drop
  onDragStart(index: number) {
    this.dragIndex = index;
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    if (this.dragIndex === null || this.dragIndex === dropIndex) return;

    const draggedImage = this.images[this.dragIndex];
    this.images.splice(this.dragIndex, 1);
    this.images.splice(dropIndex, 0, draggedImage);

    this.dragIndex = null;
    this.dragOverIndex = null;
  }

  onDragEnd() {
    this.dragIndex = null;
    this.dragOverIndex = null;
  }

  setMainPhoto(index: number) {
    if (index === 0) return;
    const main = this.images.splice(index, 1)[0];
    this.images.unshift(main);
  }

  async onSubmit() {
    if (!this.validateStep()) return;
    this.isLoading = true;

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userEmail = localStorage.getItem('userEmail') || '';
      const userName  = localStorage.getItem('userName')  || '';

      const newListing = {
        id: Date.now().toString(),
        make: this.make,
        model: this.model,
        year: parseInt(this.year),
        mileage: parseInt(this.mileage),
        transmission: this.transmission,
        fuelType: this.fuelType,
        color: this.color || 'Not specified',
        condition: this.condition,
        bodyType: this.bodyType || 'Not specified',
        price: parseFloat(this.price),
        description: this.description,
        location: this.location,
        phone: this.phone,
        images: this.images,
        ownerName: userName,
        email: userEmail,
        submittedAt: new Date().toISOString(),
        status: 'approved'
      };

      const existing = JSON.parse(localStorage.getItem('carListings') || '[]');
      existing.push(newListing);
      localStorage.setItem('carListings', JSON.stringify(existing));

      // ✅ CarService notify karo — home page instantly update hoga
      this.carService.notifyUpdate();

      this.router.navigate(['/dashboard'], {
        queryParams: { listed: 'success' }
      });

    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  getProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}