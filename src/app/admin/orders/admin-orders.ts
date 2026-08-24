import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../services/order.service';
import { CarService } from '../../services/car.service';
import { CheckoutSettingsService } from '../../core/services/checkout-settings.service';
import { ORDER_STATUS_LABELS, Order, OrderStatus } from '../../models/order.model';

type StatusFilter = 'all' | OrderStatus;

/** Staff view of car bookings: verify deposits, confirm sales, cancel. */
@Component({
  selector: 'app-admin-orders',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly carService = inject(CarService);
  private readonly checkout = inject(CheckoutSettingsService);
  private readonly cdr = inject(ChangeDetectorRef);

  orders: Order[] = [];
  loading = true;
  loadError = '';
  busyId = '';
  filter: StatusFilter = 'all';

  readonly filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'payment_review', label: 'Needs verification' },
    { key: 'pending_payment', label: 'Awaiting deposit' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.orders = await this.orderService.getAllOrders();
      this.loadError = '';
    } catch (err) {
      console.error('Error loading orders:', err);
      this.orders = [];
      this.loadError = 'Could not load bookings. Check your permissions and try again.';
    } finally {
      this.loading = false;
      // Firestore resolves outside Angular's zone — force the view to update.
      this.cdr.detectChanges();
    }
  }

  setFilter(key: StatusFilter): void {
    this.filter = key;
  }

  get filtered(): Order[] {
    if (this.filter === 'all') return this.orders;
    return this.orders.filter((o) => o.status === this.filter);
  }

  countFor(key: StatusFilter): number {
    if (key === 'all') return this.orders.length;
    return this.orders.filter((o) => o.status === key).length;
  }

  get depositTotal(): number {
    return this.orders
      .filter((o) => o.status === 'confirmed' || o.status === 'completed')
      .reduce((sum, o) => sum + (o.depositAmount || 0), 0);
  }

  label(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] ?? status;
  }

  money(amount: number): string {
    return this.checkout.format(amount);
  }

  /** Deposit verified: confirm the booking and take the car off the market. */
  async confirm(order: Order): Promise<void> {
    if (!order.id) return;
    if (!confirm(`Confirm booking ${order.reference}? This marks the car as sold.`)) return;

    this.busyId = order.id;
    try {
      await this.orderService.setStatus(order.id, 'confirmed', 'Deposit verified by our team.');
      if (order.carId) {
        try {
          await this.carService.updateCar(order.carId, { status: 'sold' });
        } catch (err) {
          console.error('Could not mark the car as sold:', err);
        }
      }
      await this.load();
    } catch (err) {
      console.error('Confirming the booking failed:', err);
      alert('Could not confirm this booking. Please try again.');
    } finally {
      this.busyId = '';
      this.cdr.detectChanges();
    }
  }

  async complete(order: Order): Promise<void> {
    if (!order.id) return;
    this.busyId = order.id;
    try {
      await this.orderService.setStatus(order.id, 'completed', 'Vehicle handed over.');
      await this.load();
    } catch (err) {
      console.error('Completing the booking failed:', err);
      alert('Could not update this booking. Please try again.');
    } finally {
      this.busyId = '';
      this.cdr.detectChanges();
    }
  }

  /** Cancelling releases the car back onto the market if it had been marked sold. */
  async cancel(order: Order): Promise<void> {
    if (!order.id) return;
    const reason = prompt('Reason for cancelling (shown to the buyer):') ?? '';
    if (reason === null) return;

    this.busyId = order.id;
    try {
      await this.orderService.setStatus(order.id, 'cancelled', reason);
      if (order.status === 'confirmed' && order.carId) {
        try {
          await this.carService.updateCar(order.carId, { status: 'approved' });
        } catch (err) {
          console.error('Could not re-list the car:', err);
        }
      }
      await this.load();
    } catch (err) {
      console.error('Cancelling the booking failed:', err);
      alert('Could not cancel this booking. Please try again.');
    } finally {
      this.busyId = '';
      this.cdr.detectChanges();
    }
  }
}
