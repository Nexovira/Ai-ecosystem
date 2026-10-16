export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_FULFILLMENT'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentProviderType = 'PAYSTACK' | 'FLUTTERWAVE' | 'TEST_GATEWAY';

export interface DeliveryInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  state: string;
  city: string;
  address: string;
  deliveryNotes?: string;
}

export interface OrderItem {
  orderItemId: string;
  orderId: string;
  customerId: string;
  productId: string;
  sellerId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  imageSnapshot: string;
  unitPrice: number; // Stored numeric price snapshot
  quantity: number;
  currency: string;
  variantId?: string;
  variantSnapshot?: string;
  itemTotal: number;
  createdAt: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerEmail: string;
  orderReference: string;
  currency: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentId?: string;
  paymentReference?: string;
  paymentProvider?: PaymentProviderType;
  deliveryInfo: DeliveryInfo;
  items: OrderItem[];
  sellerIds: string[];
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface PaymentRecord {
  paymentId: string;
  orderId: string;
  userId: string;
  provider: PaymentProviderType;
  providerTransactionReference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  channel?: string;
  gatewayResponse?: string;
  environment: 'test' | 'live';
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
}

export interface ValidatedCheckoutItem {
  productId: string;
  sellerId: string;
  name: string;
  sku: string;
  image: string;
  unitPrice: number;
  quantity: number;
  currency: string;
  itemTotal: number;
  availableStock: number;
  variantId?: string;
  variantName?: string;
}

export interface CheckoutCalculation {
  items: ValidatedCheckoutItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;
  itemCount: number;
}

export interface CheckoutInitializeResponse {
  success: boolean;
  orderId: string;
  orderReference: string;
  paymentReference: string;
  paymentId: string;
  authorizationUrl?: string;
  amount: number;
  currency: string;
  provider: PaymentProviderType;
  environment: 'test' | 'live';
  error?: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  orderId: string;
  orderReference: string;
  amount: number;
  currency: string;
  order?: Order;
  error?: string;
  isTestMode?: boolean;
}
