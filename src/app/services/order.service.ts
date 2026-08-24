import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { getFirebaseDb } from '../core/firebase/firebase';
import { AuthService } from './auth.service';
import { CreateOrderInput, Order, OrderStatus } from '../models/order.model';

/** Firestore Timestamp | ISO string -> ISO string. */
function toIso(value: unknown): string {
  const v = value as { toDate?: () => Date } | string | undefined;
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    return v.toDate().toISOString();
  }
  return typeof v === 'string' ? v : '';
}

/** Booking references are short, unambiguous and easy to read out on the phone. */
function makeReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `AF-${out}`;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly db = getFirebaseDb();
  private readonly auth = inject(AuthService);

  /** Emits whenever an order is created or changes, so open views can refresh. */
  private readonly ordersUpdated = new BehaviorSubject<boolean>(false);
  readonly ordersUpdated$ = this.ordersUpdated.asObservable();

  private notifyUpdate(): void {
    this.ordersUpdated.next(true);
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('You must be signed in to place a booking.');

    const payload: Omit<Order, 'id'> = {
      ...input,
      reference: makeReference(),
      buyerId: uid,
      paymentMethod: 'bank_transfer',
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
    };

    const ref = await addDoc(collection(this.db, 'orders'), payload);
    this.notifyUpdate();
    return { id: ref.id, ...payload };
  }

  async getOrderById(id: string): Promise<Order | null> {
    if (!id) return null;
    const snap = await getDoc(doc(this.db, 'orders', id));
    if (!snap.exists()) return null;
    return this.toModel(snap.id, snap.data());
  }

  /** Orders placed by the signed-in buyer, newest first. */
  async getMyOrders(max = 50): Promise<Order[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(collection(this.db, 'orders'), where('buyerId', '==', uid), limit(max));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => this.toModel(d.id, d.data()))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  /** Every order — staff only (reads are gated by security rules). */
  async getAllOrders(max = 200): Promise<Order[]> {
    const q = query(collection(this.db, 'orders'), orderBy('createdAt', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.toModel(d.id, d.data()));
  }

  /** Buyer submits the bank-transfer reference; moves the order into review. */
  async submitPaymentReference(id: string, reference: string): Promise<void> {
    await updateDoc(doc(this.db, 'orders', id), {
      paymentReference: reference,
      status: 'payment_review' satisfies OrderStatus,
      updatedAt: new Date().toISOString(),
    });
    this.notifyUpdate();
  }

  /** Buyer cancels their own booking (only while it is still unpaid/in review). */
  async cancelOrder(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'orders', id), {
      status: 'cancelled' satisfies OrderStatus,
      updatedAt: new Date().toISOString(),
    });
    this.notifyUpdate();
  }

  /** Staff transition (confirm / complete / cancel), with an optional note for the buyer. */
  async setStatus(id: string, status: OrderStatus, statusNote = ''): Promise<void> {
    await updateDoc(doc(this.db, 'orders', id), {
      status,
      statusNote,
      updatedAt: new Date().toISOString(),
    });
    this.notifyUpdate();
  }

  private toModel(id: string, data: Record<string, unknown>): Order {
    return {
      id,
      reference: (data['reference'] as string) ?? '',
      carId: (data['carId'] as string) ?? '',
      carTitle: (data['carTitle'] as string) ?? '',
      carImage: (data['carImage'] as string) ?? '',
      carPrice: Number(data['carPrice'] ?? 0),
      carLocation: (data['carLocation'] as string) ?? '',
      sellerId: (data['sellerId'] as string) ?? '',
      buyerId: (data['buyerId'] as string) ?? '',
      buyerName: (data['buyerName'] as string) ?? '',
      buyerEmail: (data['buyerEmail'] as string) ?? '',
      buyerPhone: (data['buyerPhone'] as string) ?? '',
      cnic: (data['cnic'] as string) ?? '',
      deliveryMethod: (data['deliveryMethod'] as Order['deliveryMethod']) ?? 'pickup',
      city: (data['city'] as string) ?? '',
      address: (data['address'] as string) ?? '',
      notes: (data['notes'] as string) ?? '',
      depositAmount: Number(data['depositAmount'] ?? 0),
      balanceAmount: Number(data['balanceAmount'] ?? 0),
      paymentMethod: 'bank_transfer',
      paymentReference: (data['paymentReference'] as string) ?? '',
      status: (data['status'] as OrderStatus) ?? 'pending_payment',
      statusNote: (data['statusNote'] as string) ?? '',
      createdAt: toIso(data['createdAt']),
      updatedAt: toIso(data['updatedAt']),
    };
  }
}
