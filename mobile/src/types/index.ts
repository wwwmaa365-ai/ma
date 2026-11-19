import { ImageSourcePropType } from 'react-native';

export type ProductCategory =
  | 'Musical Instruments'
  | 'Electronic Equipment'
  | 'Dance Dresses'
  | 'Dance Accessories';

export interface PartnerProduct {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  subcategory: string;
  priceInr: number;
  mrpInr: number;
  stock: number;
  lowStockThreshold: number;
  warrantyMonths: number;
  description: string;
  image: ImageSourcePropType;
  active: boolean;
}

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED';

export interface TrackingStep {
  status: string;
  location: string;
  timestamp: string;
  note: string;
}

export interface PartnerOrder {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  pincode: string;
  items: {
    productId: string;
    name: string;
    qty: number;
    unitPriceInr: number;
  }[];
  subtotalInr: number;
  platformCommissionInr: number;
  netEarningInr: number;
  paymentMethod: 'Demo UPI' | 'Demo Card' | 'Cash on Delivery';
  status: OrderStatus;
  deliveryOtp: string;
  courierName: string;
  awbCode: string;
  riderName: string;
  riderPhone: string;
  createdAt: string;
  trackingHistory: TrackingStep[];
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  totalOrders: number;
  totalSpentInr: number;
  joinedDate: string;
  notes: string;
}

export interface SubscriptionPlanItem {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  monthlyPriceInr: number;
  commissionPercent: number;
  productLimit: number;
  features: string[];
}

export interface SubscriptionPaymentItem {
  id: string;
  planName: string;
  amountInr: number;
  date: string;
  mode: string;
  status: 'DEMO_RECORDED' | 'PENDING_DEMO';
}

export interface WithdrawalRequestItem {
  id: string;
  amountInr: number;
  bankAccount: string;
  upiId: string;
  requestedAt: string;
  status: 'DEMO_PENDING' | 'DEMO_PROCESSED';
}

export interface ChatThreadMessage {
  id: string;
  customerId: string;
  customerName: string;
  sender: 'CUSTOMER' | 'SELLER';
  text: string;
  timestamp: string;
  orderRef?: string;
}

export interface ShopProfileData {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  upiId: string;
  bankAccountMasked: string;
  activePlanId: 'starter' | 'growth' | 'enterprise';
  isRegistered: boolean;
  demoMode: boolean;
}

export interface PartnerSettingsData {
  pushOrderAlerts: boolean;
  lowStockAlerts: boolean;
  codEnabled: boolean;
  autoAcceptOrders: boolean;
  vacationMode: boolean;
}
