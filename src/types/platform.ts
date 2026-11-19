export type PlatformRole =
  | 'CUSTOMER'
  | 'SELLER_ADMIN'
  | 'MASTER_ADMIN'
  | 'DELIVERY_PARTNER'
  | 'STAFF_MANAGER';

export type WorkspacePortal =
  | 'STOREFRONT'
  | 'MOBILE_APP_PREVIEW'
  | 'SELLER_ADMIN'
  | 'MASTER_ADMIN'
  | 'DELIVERY_PARTNER'
  | 'STAFF_PANEL'
  | 'WHITELABEL_APP_BUILDER'
  | 'API_DOCS_TESTS';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  order: number;
  subcategories: string[];
}

export interface SubscriptionPlan {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  audienceLabel: string;
  monthlyPriceInr: number;
  yearlyPriceInr: number;
  productLimit: number;
  staffLimit: number;
  commissionRatePercent: number;
  androidAppEnabled: boolean;
  iosAppEnabled: boolean;
  customDomainEnabled: boolean;
  features: string[];
}

export interface TenantStore {
  tenantId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  storeName: string;
  tagline: string;
  description: string;
  logoText: string;
  bannerUrl: string;
  primaryColor: string;
  accentColor: string;
  customDomain: string;
  address: string;
  city: string;
  state: string;
  gstNumber: string;
  planId: 'starter' | 'growth' | 'enterprise';
  subscriptionStatus: 'ACTIVE' | 'PENDING' | 'EXPIRED';
  subscriptionExpiry: string;
  status: 'active' | 'pending' | 'suspended';
  deliveryConfig: {
    ownDeliveryEnabled: boolean;
    courierDeliveryEnabled: boolean;
    baseDeliveryFeeInr: number;
    freeDeliveryThresholdInr: number;
    defaultCourierProvider: 'Shiprocket' | 'Delhivery' | 'BlueDart';
    shiprocketApiKeyConfigured: boolean;
    delhiveryTokenConfigured: boolean;
  };
  paymentConfig: {
    razorpayMerchantId: string;
    upiVpa: string;
    codEnabled: boolean;
    cardsEnabled: boolean;
    netbankingEnabled: boolean;
    webhookSecretConfigured: boolean;
  };
  whiteLabelAppConfig: {
    appDisplayName: string;
    packageIdentifier: string;
    bundleIdentifier: string;
    splashColor: string;
    themeColor: string;
    androidBuildStatus: 'NOT_STARTED' | 'QUEUED' | 'BUILDING' | 'ARTIFACT_READY';
    iosBuildStatus: 'NOT_STARTED' | 'QUEUED' | 'BUILDING' | 'ARTIFACT_READY';
    lastBuildVersion: string;
    lastBuildTimestamp?: string;
    androidArtifactUrl?: string;
    iosArtifactUrl?: string;
  };
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  color: string;
  sizeOrFinish: string;
  priceDeltaInr: number;
  stock: number;
  sku: string;
}

export interface ProductReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface ProductItem {
  productId: string;
  tenantId: string;
  ownerId: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  priceInr: number;
  mrpInr: number;
  discountPercent: number;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  warrantyMonths: number;
  deliveryEstimateDays: string;
  description: string;
  specifications: Record<string, string>;
  images: string[];
  videoPreviewTitle?: string;
  variants: ProductVariant[];
  reviews: ProductReview[];
  rating: number;
  reviewCount: number;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFestivalOffer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponCode {
  id: string;
  tenantId: string;
  code: string;
  discountPercent: number;
  maxDiscountInr: number;
  minOrderInr: number;
  active: boolean;
  expiryDate: string;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  variantLabel: string;
  quantity: number;
  unitPriceInr: number;
  totalPriceInr: number;
}

export interface OrderRecord {
  orderId: string;
  invoiceNumber: string;
  tenantId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPincode: string;
  items: OrderLineItem[];
  subtotalInr: number;
  discountInr: number;
  couponCode?: string;
  deliveryFeeInr: number;
  gstAmountInr: number;
  totalInr: number;
  platformCommissionInr: number;
  netSellerPayoutInr: number;
  paymentMethod: 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'NETBANKING' | 'COD';
  paymentStatus: 'PENDING' | 'VERIFIED_PAID' | 'REFUNDED' | 'FAILED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  webhookSignatureVerified: boolean;
  status:
    | 'CONFIRMED'
    | 'PACKED'
    | 'SHIPPED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURN_REQUESTED'
    | 'REFUNDED';
  deliveryMode: 'OWN_DELIVERY' | 'COURIER_DELIVERY';
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  deliveryOtp: string;
  courierProvider?: 'Shiprocket' | 'Delhivery' | 'BlueDart';
  awbNumber?: string;
  shippingLabelUrl?: string;
  trackingLocation: {
    lat: number;
    lng: number;
    currentHub: string;
    updatedAt: string;
  };
  trackingHistory: {
    status: string;
    location: string;
    timestamp: string;
    note: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartner {
  partnerId: string;
  tenantId: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  currentZone: string;
  lat: number;
  lng: number;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE';
  completedDeliveries: number;
  rating: number;
}

export interface StaffMember {
  staffId: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  roleTitle: 'Catalog Manager' | 'Order Fulfillment Lead' | 'Inventory Auditor' | 'Support Specialist';
  permissions: string[];
  active: boolean;
  joinedAt: string;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  tenantId: string;
  senderId: string;
  senderName: string;
  senderRole: PlatformRole;
  recipientId: string;
  orderId?: string;
  body: string;
  attachmentUrl?: string;
  flagged: boolean;
  read: boolean;
  createdAt: string;
}

export interface SubscriptionPaymentRecord {
  paymentId: string;
  tenantId: string;
  storeName: string;
  planId: 'starter' | 'growth' | 'enterprise';
  billingCycle: 'MONTHLY' | 'YEARLY';
  amountInr: number;
  transactionRef: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paidAt: string;
}

export interface AppBuildJob {
  jobId: string;
  tenantId: string;
  storeName: string;
  platform: 'ANDROID_APK_AAB' | 'IOS_IPA';
  easProfile: 'production-whitelabel';
  packageId: string;
  version: string;
  status: 'QUEUED' | 'BUILDING' | 'ARTIFACT_READY' | 'FAILED';
  artifactDownloadUrl?: string;
  logs: string[];
  initiatedBy: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  tenantId: string;
  recipientRole: PlatformRole | 'ALL';
  type:
    | 'NEW_ORDER'
    | 'ORDER_CONFIRMED'
    | 'PAYMENT_VERIFIED'
    | 'ORDER_SHIPPED'
    | 'OUT_FOR_DELIVERY'
    | 'ORDER_DELIVERED'
    | 'LOW_STOCK'
    | 'SUBSCRIPTION_EXPIRY'
    | 'CHAT_MESSAGE';
  title: string;
  body: string;
  channel: 'FCM_PUSH' | 'EMAIL' | 'SMS';
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string;
  actorRole: PlatformRole;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  timestamp: string;
}
