import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CarService } from '../services/car.service';
import { AuthService } from '../services/auth.service';
import { ImageUploadService } from '../services/image-upload.service';
import { AttributesService } from '../core/services/attributes.service';
import { attrKey } from '../core/catalog/catalog.util';

@Component({
  selector: 'app-sell-your-car',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sell-your-car.html',
  styleUrl: './sell-your-car.css'
})
export class SellYourCar implements OnInit {
  private readonly attributesService = inject(AttributesService);
  readonly makes = this.attributesService.makes;
  readonly bodyTypes = this.attributesService.bodyTypes;
  readonly fuelTypes = this.attributesService.fuelTypes;
  readonly transmissions = this.attributesService.transmissions;
  readonly featureOptions = this.attributesService.features;
  readonly conditionOptions = this.attributesService.conditions;

  isLoading = signal(false);
  currentStep = 1;
  totalSteps = 3;

  // ✅ Edit Mode
  isEditMode = false;
  editListingId = '';

  // ── Step 1: vehicle details ──
  vrn = '';
  make = '';
  model = '';
  variant = '';
  year = '';
  registrationPlate = '';
  bodyType = '';
  readonly fuelType = signal('');
  transmission = '';
  engineCapacity = '';
  color = '';
  doorsCount = '';
  seatingCapacity = '';
  mileage = '';
  batteryRange = '';
  condition = '';

  // ── Step 2: price, location, features, description ──
  price = '';
  location = '';
  postcode = '';
  readonly selectedFeatures = signal<string[]>([]);
  description = '';

  // ── Step 3: photos + contact ──
  phone = '';
  readonly images = signal<string[]>([]);
  imageError = signal('');
  readonly submitError = signal('');

  // Drag & Drop
  dragIndex: number | null = null;
  dragOverIndex: number | null = null;

  errors: Record<string, string> = {};

  /** Battery range only matters for electric / hybrid cars. */
  readonly isElectric = computed(() => {
    const key = attrKey(this.fuelType());
    return key.includes('electric') || key.includes('hybrid') || key === 'ev';
  });

  years = Array.from({ length: 35 }, (_, i) => (new Date().getFullYear() - i).toString());

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private carService: CarService,
    private authService: AuthService,
    private imageUpload: ImageUploadService,
  ) {}

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

    this.vrn               = listing.vrn ?? '';
    this.make              = this.matchOption(listing.make, this.makes());
    this.model             = listing.model;
    this.variant           = listing.variant ?? '';
    this.year              = listing.year?.toString() ?? '';
    this.registrationPlate = listing.registrationPlate ?? listing.registeredIn ?? '';
    this.bodyType          = this.matchOption(listing.bodyType, this.bodyTypes());
    this.fuelType.set(this.matchOption(listing.fuelType, this.fuelTypes()));
    this.transmission      = this.matchOption(listing.transmission, this.transmissions());
    this.engineCapacity    = listing.engineDisplacement ?? '';
    this.color             = listing.color;
    this.doorsCount        = listing.doorsCount?.toString() ?? '';
    this.seatingCapacity   = listing.seatingCapacity?.toString() ?? '';
    this.mileage           = listing.mileage?.toString() ?? '';
    this.batteryRange      = listing.batteryRange?.toString() ?? '';
    this.condition         = this.matchOption(listing.condition, this.conditionOptions());
    this.price             = listing.price?.toString() ?? '';
    this.location          = listing.location;
    this.postcode          = listing.postcode ?? '';
    this.selectedFeatures.set(listing.features ?? []);
    this.description       = listing.description;
    this.phone             = listing.phone;
    this.images.set(listing.images ?? []);
  }

  /**
   * Older listings stored lowercase attribute values ('automatic'); the dropdowns now
   * carry the admin's spelling ('Automatic'). Map a stored value onto the matching
   * option so edit mode doesn't show an empty select.
   */
  private matchOption(stored: string | undefined, options: string[]): string {
    const value = (stored ?? '').trim();
    if (!value) return '';
    const key = attrKey(value);
    return options.find((o) => attrKey(o) === key) ?? value;
  }

  onFuelTypeChange(value: string) {
    this.fuelType.set(value);
  }

  toggleFeature(feature: string) {
    this.selectedFeatures.update((list) =>
      list.includes(feature) ? list.filter((f) => f !== feature) : [...list, feature],
    );
  }

  isFeatureSelected(feature: string): boolean {
    return this.selectedFeatures().includes(feature);
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

  private isPositiveNumber(value: string): boolean {
    const n = Number(value);
    return value.trim() !== '' && !isNaN(n) && n > 0;
  }

  validateStep(): boolean {
    this.errors = {};

    if (this.currentStep === 1) {
      if (!this.vrn.trim()) this.errors['vrn'] = 'Please enter the registration number.';
      if (!this.make) this.errors['make'] = 'Please select car make.';
      if (!this.model.trim()) this.errors['model'] = 'Please enter car model.';
      if (!this.year) this.errors['year'] = 'Please select the year of manufacture.';
      if (!this.bodyType) this.errors['bodyType'] = 'Please select body type.';
      if (!this.fuelType()) this.errors['fuelType'] = 'Please select fuel type.';
      if (!this.transmission) this.errors['transmission'] = 'Please select transmission.';
      if (!this.engineCapacity.trim()) this.errors['engineCapacity'] = 'Please enter engine capacity.';
      if (!this.color.trim()) this.errors['color'] = 'Please enter the colour.';
      if (!this.isPositiveNumber(this.doorsCount)) this.errors['doorsCount'] = 'Please enter the number of doors.';
      if (!this.isPositiveNumber(this.seatingCapacity)) this.errors['seatingCapacity'] = 'Please enter the seating capacity.';
      if (this.mileage.trim() === '' || isNaN(Number(this.mileage)) || Number(this.mileage) < 0) {
        this.errors['mileage'] = 'Please enter the mileage.';
      }
      if (this.isElectric() && !this.isPositiveNumber(this.batteryRange)) {
        this.errors['batteryRange'] = 'Please enter the battery range for an electric/hybrid car.';
      }
      if (!this.condition) this.errors['condition'] = 'Please select the condition.';
    }

    if (this.currentStep === 2) {
      if (!this.isPositiveNumber(this.price)) this.errors['price'] = 'Please enter the asking price.';
      if (!this.location.trim()) this.errors['location'] = 'Please enter the area or city.';
      if (!this.description.trim()) this.errors['description'] = 'Please enter description.';
      else if (this.description.trim().length < 30)
        this.errors['description'] = 'Description must be at least 30 characters.';
    }

    if (this.currentStep === 3) {
      if (!this.phone.trim()) this.errors['phone'] = 'Please enter phone number.';
    }

    return Object.keys(this.errors).length === 0;
  }

  // ✅ Image upload with compression
  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    this.imageError.set('');
    if (!files) return;

    if (this.images().length + files.length > 10) {
      this.imageError.set(`Maximum 10 photos allowed. You can add ${10 - this.images().length} more.`);
      return;
    }

    Array.from(files).forEach((file: File) => {
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

          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          this.images.update(list => [...list, compressed]);
        };
        img.src = e.target?.result as string;
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

    // Firestore rejects `undefined`, so optional fields are only included when filled in.
    const optional: Record<string, string | number | string[]> = {};
    if (this.variant.trim()) optional['variant'] = this.variant.trim();
    if (this.registrationPlate.trim()) optional['registrationPlate'] = this.registrationPlate.trim();
    if (this.postcode.trim()) optional['postcode'] = this.postcode.trim().toUpperCase();
    if (this.selectedFeatures().length) optional['features'] = this.selectedFeatures();
    if (this.isElectric() && this.batteryRange.trim()) {
      optional['batteryRange'] = Number(this.batteryRange);
    }

    const baseData = {
      vrn:                this.vrn.trim().toUpperCase(),
      make:               this.make,
      model:              this.model.trim(),
      year:               parseInt(this.year),
      mileage:            Number(this.mileage),
      transmission:       this.transmission,
      fuelType:           this.fuelType(),
      engineDisplacement: this.engineCapacity.trim(),
      color:              this.color.trim() || 'Not specified',
      doorsCount:         Number(this.doorsCount),
      seatingCapacity:    Number(this.seatingCapacity),
      condition:          this.condition,
      bodyType:           this.bodyType,
      price:              parseFloat(this.price),
      description:        this.description.trim(),
      location:           this.location.trim(),
      phone:              this.phone.trim(),
      ...optional,
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
