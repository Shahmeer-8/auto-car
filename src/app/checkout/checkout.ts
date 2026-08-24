import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CarService } from '../services/car.service';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { CheckoutSettingsService } from '../core/services/checkout-settings.service';
import { CarListing } from '../models/car.model';
import { DeliveryMethod } from '../models/order.model';

/** Reserve-a-car checkout: buyer details -> review -> booking placed. */
@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly carService = inject(CarService);
  private readonly orders = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly checkout = inject(CheckoutSettingsService);

  readonly settings = this.checkout.settings;

  readonly car = signal<CarListing | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly unavailable = signal('');
  readonly placing = signal(false);
  readonly submitError = signal('');

  readonly step = signal<1 | 2>(1);

  // Buyer details
  readonly fullName = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly cnic = signal('');
  readonly city = signal('');
  readonly deliveryMethod = signal<DeliveryMethod>('pickup');
  readonly address = signal('');
  readonly notes = signal('');
  readonly acceptTerms = signal(false);

  readonly errors = signal<Record<string, string>>({});

  readonly deposit = computed(() => this.checkout.depositFor(this.car()?.price ?? 0));
  readonly balance = computed(() => Math.max(0, (this.car()?.price ?? 0) - this.deposit()));

  async ngOnInit(): Promise<void> {
    await this.auth.waitUntilReady();

    const id = this.route.snapshot.paramMap.get('carId');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    // Prefill from the signed-in profile.
    this.fullName.set(this.auth.getUserDisplayName());
    this.email.set(this.auth.getUserEmail());

    try {
      const car = await this.carService.getCarById(id);
      if (!car) {
        this.notFound.set(true);
      } else {
        this.car.set(car);
        if (car.status !== 'approved') {
          this.unavailable.set(
            car.status === 'sold'
              ? 'This car has already been sold.'
              : 'This listing is not available for booking yet.',
          );
        } else if (car.sellerId && car.sellerId === this.auth.currentUser?.uid) {
          this.unavailable.set('This is your own listing — you cannot book it.');
        }
        this.city.set(car.location ?? '');
      }
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  setDelivery(method: DeliveryMethod): void {
    this.deliveryMethod.set(method);
  }

  format(amount: number): string {
    return this.checkout.format(amount);
  }

  private validateDetails(): boolean {
    const errs: Record<string, string> = {};
    if (!this.fullName().trim()) errs['fullName'] = 'Please enter your full name.';
    if (!this.email().trim()) errs['email'] = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()))
      errs['email'] = 'Please enter a valid email address.';
    if (!this.phone().trim()) errs['phone'] = 'Please enter a contact number.';
    else if (this.phone().replace(/\D/g, '').length < 10)
      errs['phone'] = 'Please enter a valid phone number.';
    if (!this.city().trim()) errs['city'] = 'Please enter your city.';
    if (this.deliveryMethod() === 'delivery' && !this.address().trim())
      errs['address'] = 'Please enter the delivery address.';
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  goToReview(): void {
    if (!this.validateDetails()) return;
    this.step.set(2);
    window.scrollTo(0, 0);
  }

  backToDetails(): void {
    this.step.set(1);
    window.scrollTo(0, 0);
  }

  async placeBooking(): Promise<void> {
    const car = this.car();
    if (!car || this.unavailable()) return;

    if (!this.acceptTerms()) {
      this.submitError.set('Please accept the booking terms to continue.');
      return;
    }

    this.submitError.set('');
    this.placing.set(true);

    try {
      const order = await this.orders.createOrder({
        carId: car.id!,
        carTitle: `${car.year} ${car.make} ${car.model}`,
        carImage: car.images?.[0] ?? '',
        carPrice: Number(car.price) || 0,
        carLocation: car.location ?? '',
        sellerId: car.sellerId ?? '',
        buyerName: this.fullName().trim(),
        buyerEmail: this.email().trim(),
        buyerPhone: this.phone().trim(),
        cnic: this.cnic().trim(),
        deliveryMethod: this.deliveryMethod(),
        city: this.city().trim(),
        address: this.address().trim(),
        notes: this.notes().trim(),
        depositAmount: this.deposit(),
        balanceAmount: this.balance(),
      });

      void this.router.navigate(['/order', order.id]);
    } catch (err) {
      console.error('Booking failed:', err);
      this.submitError.set(
        'We could not place your booking. Please check your connection and try again.',
      );
    } finally {
      this.placing.set(false);
    }
  }
}
