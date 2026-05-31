import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CarService } from '../services/car.service';

@Component({
  selector: 'app-sell-your-car',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sell-your-car.html',
  styleUrl: './sell-your-car.css',
})
export class SellYourCar {
  isLoading = false;
  submitError = '';
  currentStep = 1;
  totalSteps = 3;

  make = '';
  model = '';
  year = '';
  mileage = '';
  transmission = '';
  fuelType = '';
  color = '';
  condition = '';
  bodyType = '';

  price = '';
  description = '';
  location = '';

  phone = '';
  images: string[] = [];
  imageError = '';

  dragIndex: number | null = null;
  dragOverIndex: number | null = null;

  errors: any = {};

  carMakes = [
    'Toyota',
    'Honda',
    'Nissan',
    'Mazda',
    'Subaru',
    'Mitsubishi',
    'Suzuki',
    'Daihatsu',
    'Lexus',
    'Isuzu',
    'Mercedes Benz',
    'BMW',
    'Volkswagen',
    'Audi',
    'Other',
  ];

  years = Array.from({ length: 30 }, (_, i) => (2024 - i).toString());

  constructor(
    private router: Router,
    private carService: CarService,
    private authService: AuthService,
  ) {}

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
      if (!this.make) this.errors['make'] = 'Please select car make.';
      if (!this.model.trim()) this.errors['model'] = 'Please enter car model.';
      if (!this.year) this.errors['year'] = 'Please select year.';
      if (!this.mileage) this.errors['mileage'] = 'Please enter mileage.';
      if (!this.transmission) this.errors['transmission'] = 'Please select transmission.';
      if (!this.fuelType) this.errors['fuelType'] = 'Please select fuel type.';
      if (!this.condition) this.errors['condition'] = 'Please select condition.';
    }

    if (this.currentStep === 2) {
      if (!this.price) this.errors['price'] = 'Please enter price.';
      if (!this.location.trim()) this.errors['location'] = 'Please enter location.';
      if (!this.description.trim()) this.errors['description'] = 'Please enter description.';
      else if (this.description.trim().length < 30)
        this.errors['description'] = 'Description must be at least 30 characters.';
    }

    if (this.currentStep === 3) {
      if (!this.phone.trim()) this.errors['phone'] = 'Please enter phone number.';
    }

    return Object.keys(this.errors).length === 0;
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    this.imageError = '';

    if (!files?.length) return;

    if (this.images.length + files.length > 50) {
      this.imageError = `Maximum 50 photos allowed. You can add ${50 - this.images.length} more.`;
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
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

          this.images.push(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
  }

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

    const user = this.authService.currentUser;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.submitError = '';

    try {
      await this.carService.createListing({
        sellerId: user.uid,
        make: this.make,
        model: this.model,
        year: parseInt(this.year, 10),
        mileage: parseInt(this.mileage, 10),
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
        ownerName: this.authService.getUserDisplayName(),
        email: this.authService.getUserEmail(),
      });

      this.router.navigate(['/dashboard'], {
        queryParams: { listed: 'success' },
      });
    } catch (err) {
      console.error(err);
      this.submitError = 'Failed to publish listing. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  getProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}
