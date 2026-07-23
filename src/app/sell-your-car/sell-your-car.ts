import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CarService } from '../services/car.service';
import { AuthService } from '../services/auth.service';
import { ImageUploadService } from '../services/image-upload.service';

@Component({
  selector: 'app-sell-your-car',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sell-your-car.html',
  styleUrl: './sell-your-car.css'
})
export class SellYourCar implements OnInit {

  isLoading = signal(false);
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
  readonly images = signal<string[]>([]);
  imageError = signal('');
  readonly submitError = signal('');

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
    private carService: CarService,
    private authService: AuthService,
    private imageUpload: ImageUploadService,
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

  // ✅ Form pre-fill for edit (from Firestore)
  async loadListingForEdit(id: string) {
    const listing = await this.carService.getCarById(id);
    if (!listing) return;

    this.make         = listing.make;
    this.model        = listing.model;
    this.year         = listing.year?.toString() ?? '';
    this.mileage      = listing.mileage?.toString() ?? '';
    this.transmission = listing.transmission;
    this.fuelType     = listing.fuelType;
    this.color        = listing.color;
    this.condition    = listing.condition;
    this.bodyType     = listing.bodyType;
    this.price        = listing.price?.toString() ?? '';
    this.description  = listing.description;
    this.location     = listing.location;
    this.phone        = listing.phone;
    this.images.set(listing.images ?? []);
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
    this.imageError.set('');

    if (this.images().length + files.length > 10) {
      this.imageError.set(`Maximum 10 photos allowed. You can add ${10 - this.images().length} more.`);
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
          this.images.update(list => [...list, compressed]);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.images.update(list => list.filter((_, i) => i !== index));
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

    const dragIndex = this.dragIndex;
    this.images.update(list => {
      const updated = [...list];
      const [draggedImage] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, draggedImage);
      return updated;
    });

    this.dragIndex = null;
    this.dragOverIndex = null;
  }

  onDragEnd() {
    this.dragIndex = null;
    this.dragOverIndex = null;
  }

  setMainPhoto(index: number) {
    if (index === 0) return;
    this.images.update(list => {
      const updated = [...list];
      const [main] = updated.splice(index, 1);
      updated.unshift(main);
      return updated;
    });
  }

  async onSubmit() {
    if (!this.validateStep()) return;

    this.submitError.set('');

    await this.authService.waitUntilReady();
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.currentUser!;
    const ownerName = this.authService.getUserDisplayName();
    const email = this.authService.getUserEmail();
    const isEdit = this.isEditMode && !!this.editListingId;
    // Allocate the id up-front so photos land under cars/{uid}/{listingId}/.
    const listingId = isEdit ? this.editListingId : this.carService.newCarId();
    const images = this.images();

    const baseData = {
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
    };

    // Photo upload can take several seconds (and may fail if Storage isn't configured).
    // Don't block the UI or the listing on it: write the listing FIRST so it appears on
    // the dashboard immediately, then upload the photos and patch them in afterwards.
    // Everything runs in the background — the promise keeps going even after this
    // component is destroyed by the navigation below.
    void (async () => {
      try {
        // Photos already hosted (edit mode) go in right away; base64 ones upload next.
        const hostedImages = images.filter((img) => !img.startsWith('data:'));

        // 1) Create/update the listing NOW (fast, no Storage) so it shows up at once.
        if (isEdit) {
          await this.carService.updateCar(listingId, { ...baseData, images: hostedImages, status: 'pending' });
        } else {
          await this.carService.createCarWithId(listingId, {
            ...baseData,
            images: hostedImages,
            sellerId: user.uid,
            ownerName,
            email,
          });
        }

        // 2) Upload the photos, then patch them onto the listing (best effort).
        if (images.some((img) => img.startsWith('data:'))) {
          const uploadedImages = await this.imageUpload.uploadListingImages(user.uid, listingId, images);

          // If Storage was unavailable the uploader keeps base64. Drop any base64 that
          // would push the doc past Firestore's ~1 MB limit so the patch still succeeds.
          const base64Total = uploadedImages
            .filter((img) => img.startsWith('data:'))
            .reduce((sum, img) => sum + img.length, 0);
          const safeImages =
            base64Total > 900_000 ? uploadedImages.filter((img) => !img.startsWith('data:')) : uploadedImages;

          if (safeImages.length && JSON.stringify(safeImages) !== JSON.stringify(hostedImages)) {
            await this.carService.updateCar(listingId, { images: safeImages });
          }
        }
      } catch (err) {
        console.error('Background listing save failed:', err);
      }
    })();

    // Optimistic: confirm success and go to the dashboard right away.
    this.router.navigate(['/dashboard'], {
      queryParams: { submitted: isEdit ? 'updated' : 'new' },
    });
  }

  getProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}