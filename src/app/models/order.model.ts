/**
 * A purchase booking placed by a signed-in buyer against an approved listing.
 *
 * Flow: buyer reserves a car with a refundable booking deposit ->
 * 'pending_payment' -> buyer transfers the deposit and submits the reference ->
 * 'payment_review' -> staff verify the transfer -> 'confirmed' (the listing is
 * marked sold) -> 'completed' on handover. Either side can end it at 'cancelled'.
 */
export type OrderStatus =
  | 'pending_payment'
  | 'payment_review'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type DeliveryMethod = 'pickup' | 'delivery';

export interface Order {
  id?: string;

  /** Human-friendly booking reference shown to the buyer, e.g. AF-7QK2M9. */
  reference: string;

  // Snapshot of the car at booking time (so the order stays readable if the listing changes).
  carId: string;
  carTitle: string;
  carImage: string;
  carPrice: number;
  carLocation: string;
  sellerId: string;

  // Buyer
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  cnic?: string;

  // Fulfilment
  deliveryMethod: DeliveryMethod;
  city: string;
  address?: string;
  notes?: string;

  // Money
  depositAmount: number;
  balanceAmount: number;
  paymentMethod: 'bank_transfer';
  paymentReference?: string;

  status: OrderStatus;
  statusNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderInput {
  carId: string;
  carTitle: string;
  carImage: string;
  carPrice: number;
  carLocation: string;
  sellerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  cnic?: string;
  deliveryMethod: DeliveryMethod;
  city: string;
  address?: string;
  notes?: string;
  depositAmount: number;
  balanceAmount: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting deposit',
  payment_review: 'Verifying payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
