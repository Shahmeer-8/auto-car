import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CarService } from '../services/car.service';
import { AuthService } from '../services/auth.service';
import { CheckoutSettingsService } from '../core/services/checkout-settings.service';
import { CarListing, ListingStatus } from '../models/car.model';

interface CarDetailView {
  id?: string;
  name: string;
  price: string;
  km: string;
  transmission: string;
  body: string;
  grade: string;
  badge: string;
  image: string;
  fuelType?: string;
  color?: string;
  condition?: string;
  description?: string;
  location?: string;
  phone?: string;
  ownerName?: string;
  submittedAt?: string;
  isUserListing?: boolean;
  status?: ListingStatus;
  sellerId?: string;
  priceValue?: number;

  // ── Extra vehicle details captured on the listing form ──
  vrn?: string;
  registrationPlate?: string;
  variant?: string;
  engineCapacity?: string;
  doorsCount?: number;
  seatingCapacity?: number;
  batteryRange?: number;
  postcode?: string;
  features?: string[];
}

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './car-detail.html',
  styleUrls: ['./car-detail.css'],
})
export class CarDetail implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly checkout = inject(CheckoutSettingsService);
  private readonly router = inject(Router);

  car: CarDetailView | null = null;
  selectedImage = '';
  images: string[] = [];
  isLoading = true;
  notFound = false;

  private readonly staticCars: CarDetailView[] = [
    {
      id: 'static-1',
      name: '2022 Toyota Land Cruiser',
      price: '$45,000',
      km: '28,000 km',
      transmission: 'Automatic',
      body: 'SUV',
      grade: '4.5',
      badge: 'Grade 4.5',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
    },
    {
      id: 'static-2',
      name: '2021 Honda CR-V',
      price: '$22,500',
      km: '32,000 km',
      transmission: 'Automatic',
      body: 'SUV',
      grade: '4.0',
      badge: 'Hot Deal',
      image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=800&q=80',
    },
    {
      id: 'static-3',
      name: '2022 Nissan X-Trail',
      price: '$24,000',
      km: '21,000 km',
      transmission: 'Automatic',
      body: 'SUV',
      grade: '4.5',
      badge: 'Popular',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    },
    {
      id: 'static-4',
      name: '2022 Mazda CX-5',
      price: '$26,000',
      km: '19,000 km',
      transmission: 'Automatic',
      body: 'SUV',
      grade: '4.5',
      badge: 'Premium',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
    },
    {
      id: 'static-5',
      name: '2021 Subaru Forester',
      price: '$21,000',
      km: '35,000 km',
      transmission: 'Automatic',
      body: 'SUV',
      grade: '4.0',
      badge: 'Great Deal',
      image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80',
    },
    {
      id: 'static-6',
      name: '2020 Toyota Hilux',
      price: '$32,000',
      km: '45,000 km',
      transmission: 'Manual',
      body: 'Truck',
      grade: '4.0',
      badge: 'Hot Deal',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    },
    {
      id: 'static-7',
      name: '2022 Lexus RX 350',
      price: '$54,000',
      km: '12,000 km',
      transmission: 'Automatic',
      body: 'SUV',
      grade: '4.5',
      badge: 'Premium',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
    },
    {
      id: 'static-8',
      name: '2021 Mitsubishi Pajero',
      price: '$29,500',
      km: '38,000 km',
      transmission: 'Automatic',
      body: 'SUV',
      grade: '4.0',
      badge: 'Grade 4',
      image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private carService: CarService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound = true;
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    await this.loadCar(id);
  }

  private async loadCar(id: string) {
    this.isLoading = true;
    this.notFound = false;

    try {
      const listing = await this.carService.getCarById(id);
      if (listing) {
        this.setFromListing(listing);
        return;
      }

      const numId = Number(id);
      if (!isNaN(numId) && numId >= 1 && numId <= this.staticCars.length) {
        const staticCar = this.staticCars[numId - 1];
        this.car = staticCar;
        this.images = [staticCar.image];
        this.selectedImage = staticCar.image;
        return;
      }

      this.notFound = true;
    } catch {
      this.notFound = true;
    } finally {
      this.isLoading = false;
      // Firestore reads resolve outside Angular's zone; force the view to update.
      this.cdr.detectChanges();
    }
  }

  private setFromListing(found: CarListing) {
    const name = [found.year, found.make, found.model, found.variant]
      .filter(Boolean)
      .join(' ');

    this.car = {
      id: found.id,
      name,
      price: '$' + found.price?.toLocaleString(),
      km: found.mileage?.toLocaleString() + ' km',
      transmission: found.transmission,
      body: found.bodyType || 'N/A',
      grade: 'N/A',
      badge:
        found.status === 'sold'
          ? 'Sold'
          : found.status === 'approved'
            ? 'Approved'
            : 'Pending',
      image: found.images?.[0] || 'placeholder-car.svg',
      fuelType: found.fuelType,
      color: found.color,
      condition: found.condition,
      description: found.description,
      location: found.location,
      phone: found.phone,
      ownerName: found.ownerName,
      submittedAt: found.submittedAt,
      isUserListing: true,
      status: found.status,
      sellerId: found.sellerId,
      priceValue: Number(found.price) || 0,

      vrn: found.vrn,
      registrationPlate: found.registrationPlate ?? found.registeredIn,
      variant: found.variant,
      engineCapacity: found.engineDisplacement,
      doorsCount: found.doorsCount,
      seatingCapacity: found.seatingCapacity,
      batteryRange: found.batteryRange,
      postcode: found.postcode,
      features: found.features ?? [],
    };
    this.images =
      found.images?.length > 0 ? found.images : ['placeholder-car.svg'];
    this.selectedImage = this.images[0];
  }

  selectImage(img: string) {
    this.selectedImage = img;
  }

  /** A real (non-demo) listing that is still on sale and isn't the viewer's own car. */
  get canBuy(): boolean {
    const car = this.car;
    if (!car?.isUserListing || !car.id) return false;
    if (car.status !== 'approved') return false;
    return car.sellerId !== this.auth.currentUser?.uid;
  }

  get isSold(): boolean {
    return this.car?.status === 'sold';
  }

  get isOwnListing(): boolean {
    return !!this.car?.sellerId && this.car.sellerId === this.auth.currentUser?.uid;
  }

  /** Booking deposit shown on the buy button, e.g. "Reserve for $25,000". */
  get depositLabel(): string {
    return this.checkout.format(this.checkout.depositFor(this.car?.priceValue ?? 0));
  }

  /** Buying requires an account: send guests to login and come straight back here. */
  startPurchase(): void {
    const id = this.car?.id;
    if (!id) return;

    if (!this.auth.isAuthenticated) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/checkout/${id}` },
      });
      return;
    }

    void this.router.navigate(['/checkout', id]);
  }

  /**
   * Builds a working wa.me link from the seller's phone number.
   * Strips formatting; treats a local leading-zero number as Pakistani (+92);
   * falls back to the AutoFlex business line if no usable number is present.
   */
  whatsappUrl(): string {
    let digits = (this.car?.phone ?? '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = '92' + digits.slice(1);
    const number = digits.length >= 8 ? digits : '818027439931';
    const text = encodeURIComponent(
      `Hi, I'm interested in your ${this.car?.name ?? 'car'} listed on AutoFlex.`,
    );
    return `https://wa.me/${number}?text=${text}`;
  }
}
