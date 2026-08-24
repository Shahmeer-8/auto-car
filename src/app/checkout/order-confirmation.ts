import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { CheckoutSettingsService } from '../core/services/checkout-settings.service';
import { ORDER_STATUS_LABELS, Order, OrderStatus } from '../models/order.model';

/** Post-booking screen: reference, payment instructions and status tracking. */
@Component({
  selector: 'app-order-confirmation',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-confirmation.html',
  styleUrls: ['./order-confirmation.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmation implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orders = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly checkout = inject(CheckoutSettingsService);

  readonly settings = this.checkout.settings;

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly paymentRef = signal('');
  readonly saving = signal(false);
  readonly actionError = signal('');
  readonly copied = signal('');

  readonly statusLabel = computed(() => {
    const s = this.order()?.status;
    return s ? ORDER_STATUS_LABELS[s] : '';
  });

  /** Steps shown in the tracker, in order. */
  readonly steps: { key: OrderStatus; label: string }[] = [
    { key: 'pending_payment', label: 'Booked' },
    { key: 'payment_review', label: 'Payment sent' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
  ];

  readonly currentStepIndex = computed(() => {
    const status = this.order()?.status;
    if (!status || status === 'cancelled') return -1;
    return this.steps.findIndex((s) => s.key === status);
  });

  readonly canSubmitPayment = computed(() => this.order()?.status === 'pending_payment');
  readonly canCancel = computed(() => {
    const s = this.order()?.status;
    return s === 'pending_payment' || s === 'payment_review';
  });

  async ngOnInit(): Promise<void> {
    await this.auth.waitUntilReady();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    await this.load(id);
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const order = await this.orders.getOrderById(id);
      if (!order) this.notFound.set(true);
      else {
        this.order.set(order);
        this.paymentRef.set(order.paymentReference ?? '');
      }
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  format(amount: number): string {
    return this.checkout.format(amount);
  }

  whatsappUrl(): string {
    const o = this.order();
    const number = (this.settings().whatsapp || '').replace(/\D/g, '') || '818027439931';
    const text = encodeURIComponent(
      `Hi AutoFlex, I have placed booking ${o?.reference ?? ''} for the ${o?.carTitle ?? 'car'}.`,
    );
    return `https://wa.me/${number}?text=${text}`;
  }

  async copy(value: string, field: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(field);
      setTimeout(() => this.copied.set(''), 2000);
    } catch {
      // clipboard blocked — the value is visible on screen anyway
    }
  }

  async submitPayment(): Promise<void> {
    const o = this.order();
    if (!o?.id) return;
    const ref = this.paymentRef().trim();
    if (!ref) {
      this.actionError.set('Please enter the transfer reference or transaction ID.');
      return;
    }

    this.actionError.set('');
    this.saving.set(true);
    try {
      await this.orders.submitPaymentReference(o.id, ref);
      this.order.set({ ...o, paymentReference: ref, status: 'payment_review' });
    } catch (err) {
      console.error('Submitting payment reference failed:', err);
      this.actionError.set('Could not save your reference. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  async cancelBooking(): Promise<void> {
    const o = this.order();
    if (!o?.id) return;
    if (!confirm('Cancel this booking? The reserved car will be released to other buyers.')) return;

    this.actionError.set('');
    this.saving.set(true);
    try {
      await this.orders.cancelOrder(o.id);
      this.order.set({ ...o, status: 'cancelled' });
    } catch (err) {
      console.error('Cancelling booking failed:', err);
      this.actionError.set('Could not cancel the booking. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
