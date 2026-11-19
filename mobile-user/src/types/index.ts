import { ImageSourcePropType } from 'react-native';

export type CategoryName =
  | 'Musical Instruments'
  | 'Electronic Equipment'
  | 'Dance Dresses'
  | 'Dance Accessories';

export type PaymentMethod = 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'COD';

export type OrderStatus =
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface ShopInfo {
  tenantId: string;
  ownerId: string;
  storeName: string;
  tagline: string;
  city: string;
  state: string;
  address: string;
  primaryColor: string;
  accentColor: string;
  upiVpa: string;
  codEnabled: boolean;
  cardsEnabled: boolean;
  baseDeliveryFeeInr: number;
  freeDeliveryThresholdInr: number;
  rating: number;
  verified: boolean;
}

export interface StoreProduct {
  id: string;
  tenantId: string;
  shopName: string;
  name: string;
  sku: string;
  category: CategoryName;
  subcategory: string;
  priceInr: number;
  mrpInr: number;
  stock: number;
  warrantyMonths: number;
  deliveryEstimate: string;
  rating: number;
  reviewCount: number;
  description: string;
  variants: string[];
  specifications: Record<string, string>;
  image: ImageSourcePropType;
  isFeatured?: boolean;
  isNewArrival?: boolean;
}

export interface CartItem {
  product: StoreProduct;
  variant: string;
  qty: number;
}

export interface CouponItem {
  code: string;
  title: string;
  discountPercent: number;
  maxDiscountInr: number;
  minOrderInr: number;
}

export interface OrderTrackingStep {
  status: OrderStatus;
  location: string;
  timestamp: string;
  note: string;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  variant: string;
  qty: number;
  unitPriceInr: number;
}

export interface CustomerOrder {
  id: string;
  tenantId: string;
  shopName: string;
  invoiceNo: string;
  items: OrderLineItem[];
  subtotalInr: number;
  discountInr: number;
  couponCode?: string;
  deliveryFeeInr: number;
  totalInr: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'VERIFIED_PAID' | 'REFUNDED';
  upiRefId?: string;
  status: OrderStatus;
  deliveryOtp: string;
  courierName: string;
  awbCode: string;
  shippingAddress: string;
  createdAt: string;
  trackingHistory: OrderTrackingStep[];
  syncedToBackend?: boolean;
  syncedToFirestore?: boolean;
}

export interface CustomerReview {
  id: string;
  tenantId: string;
  scope: 'STORE' | 'PRODUCT';
  productId: string;
  productName: string;
  orderRef: string;
  customerName: string;
  rating: number;
  comment: string;
  sellerReply?: string;
  createdAt: string;
  verifiedPurchase: boolean;
}

export interface StoreChatMessage {
  id: string;
  tenantId: string;
  sender: 'CUSTOMER' | 'STORE';
  text: string;
  timestamp: string;
}

export interface CustomerUserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  authMode: 'FIREBASE' | 'DEMO';
  emailVerified: boolean;
}

export interface PushRegistrationState {
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'demo';
  fcmToken: string | null;
  deviceName: string;
  firestoreSynced: boolean;
  channels: string[];
  lastSyncedAt: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  ProductDetail: { productId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Shop: { initialCategory?: CategoryName | 'ALL'; initialTenantId?: string } | undefined;
  Cart: undefined;
  Orders: undefined;
  Account: undefined;
};
