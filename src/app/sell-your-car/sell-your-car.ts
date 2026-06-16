import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CarService } from '../services/car.service';

@Component({
  selector: 'app-sell-your-car',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sell-your-car.html',
  styleUrl: './sell-your-car.css'
})
export class SellYourCar implements OnInit {

  isLoading = false;
  currentStep = 1;
  totalSteps = 3;

  // ✅ Edit Mode
  isEditMode = false;
  editListingId = '';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,  // ✅ Added
    private carService: CarService
  ) {}

  // ✅ Edit mode check
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const editId = params['edit'];
      if (editId) {
        this.isEditMode = true;
        this.editListingId = editId;
        this.loadListingForEdit(editId);
      }
    });
  }

  // ✅ Form pre-fill for edit
  loadListingForEdit(id: string) {
    const stored = localStorage.getItem('carListings');
    if (stored) {
      const all = JSON.parse(stored);
      const listing = all.find((l: any) => l.id === id);
      if (listing) {
        this.make         = listing.make;
        this.model        = listing.model;
        this.year         = listing.year.toString();
        this.mileage      = listing.mileage.toString();
        this.transmission = listing.transmission;
        this.fuelType     = listing.fuelType;
        this.color        = listing.color;
        this.condition    = listing.condition;
        this.bodyType     = listing.bodyType;
        this.price        = listing.price.toString();
        this.description  = listing.description;
        this.location     = listing.location;
        this.phone        = listing.phone;
        this.images       = listing.images;
      }
    }
  }

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

  // ✅ Image upload with compression
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
      const userEmail = localStorage.getItem('userEmail') || '';
      const userName  = localStorage.getItem('userName')  || '';
      const existing  = JSON.parse(localStorage.getItem('carListings') || '[]');

      if (this.isEditMode) {
        // ✅ EDIT: existing listing update karo
        const index = existing.findIndex((l: any) => l.id === this.editListingId);
        if (index !== -1) {
          existing[index] = {
            ...existing[index],       // id, email, ownerName, submittedAt same rahega
            make:         this.make,
            model:        this.model,
            year:         parseInt(this.year),
            mileage:      parseInt(this.mileage),
            transmission: this.transmission,
            fuelType:     this.fuelType,
            color:        this.color || 'Not specified',
            condition:    this.condition,
            bodyType:     this.bodyType || 'Not specified',
            price:        parseFloat(this.price),
            description:  this.description,
            location:     this.location,
            phone:        this.phone,
            images:       this.images,
            status:       'pending'   // ✅ Edit ke baad wapas pending
          };
        }
      } else {
        // ✅ NEW: nai listing add karo
        const newListing = {
          id:           Date.now().toString(),
          make:         this.make,
          model:        this.model,
          year:         parseInt(this.year),
          mileage:      parseInt(this.mileage),
          transmission: this.transmission,
          fuelType:     this.fuelType,
          color:        this.color || 'Not specified',
          condition:    this.condition,
          bodyType:     this.bodyType || 'Not specified',
          price:        parseFloat(this.price),
          description:  this.description,
          location:     this.location,
          phone:        this.phone,
          images:       this.images,
          ownerName:    userName,
          email:        userEmail,
          submittedAt:  new Date().toISOString(),
          status:       'pending'
        };
        existing.push(newListing);
      }

      localStorage.setItem('carListings', JSON.stringify(existing));
      this.carService.notifyUpdate();

      // ✅ Seller dashboard pe wapas jao
      this.router.navigate(['/seller-dashboard']);

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