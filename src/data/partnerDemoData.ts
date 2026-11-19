export type PartnerCategory =
  | 'Musical Instruments'
  | 'Electronic Equipment'
  | 'Dance Dresses'
  | 'Dance Accessories';

export interface DemoPartnerProduct {
  id: string;
  name: string;
  sku: string;
  category: PartnerCategory;
  subcategory: string;
  priceInr: number;
  mrpInr: number;
  stock: number;
  lowStockThreshold: number;
  warrantyMonths: number;
  description: string;
  imageUrl: string;
}

export type DemoOrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED';

export interface DemoOrder {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  pincode: string;
  items: { productId: string; name: string; qty: number; unitPriceInr: number }[];
  subtotalInr: number;
  commissionInr: number;
  netEarningInr: number;
  paymentMethod: 'Demo UPI' | 'Demo Card' | 'Cash on Delivery' | 'In-Store UPI QR';
  upiPaymentStatus?: 'PENDING' | 'PAID_UPI_QR';
  upiUtr?: string;
  upiPaidAt?: string;
  upiVpaUsed?: string;
  status: DemoOrderStatus;
  deliveryOtp: string;
  courierName: string;
  awbCode: string;
  riderName: string;
  riderPhone: string;
  createdAt: string;
  trackingHistory: { status: string; location: string; timestamp: string; note: string }[];
}

export interface DemoCustomer {
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

export interface DemoSubscriptionPlan {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  monthlyPriceInr: number;
  commissionPercent: number;
  productLimit: number;
  features: string[];
}

export interface DemoSubscriptionPayment {
  id: string;
  planName: string;
  amountInr: number;
  date: string;
  mode: string;
  status: 'DEMO_RECORDED' | 'PENDING_DEMO';
}

export interface DemoWithdrawalRequest {
  id: string;
  amountInr: number;
  bankAccount: string;
  upiId: string;
  requestedAt: string;
  status: 'DEMO_PENDING' | 'DEMO_PROCESSED';
}

export interface DemoChatMessage {
  id: string;
  customerId: string;
  customerName: string;
  sender: 'CUSTOMER' | 'SELLER';
  text: string;
  timestamp: string;
  orderRef?: string;
}

export interface DemoShopProfile {
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
}

export type DemoFcmChannelId = 'order-alerts' | 'order-status' | 'low-stock';

export type DemoNotificationType = 'NEW_ORDER' | 'ORDER_STATUS' | 'LOW_STOCK';

export interface DemoNotificationItem {
  id: string;
  type: DemoNotificationType;
  channelId: DemoFcmChannelId;
  title: string;
  body: string;
  referenceId: string;
  priority: 'HIGH' | 'DEFAULT';
  read: boolean;
  timestamp: string;
}

export interface DemoPartnerSettings {
  pushOrderAlerts: boolean;
  orderStatusAlerts: boolean;
  lowStockAlerts: boolean;
  codEnabled: boolean;
  autoAcceptOrders: boolean;
  vacationMode: boolean;
}

export const INITIAL_DEMO_NOTIFICATIONS: DemoNotificationItem[] = [
  {
    id: 'notif_ord_1001',
    type: 'NEW_ORDER',
    channelId: 'order-alerts',
    title: 'New Order #ORD-1001 · ₹24,999',
    body: 'Ananya Borgohain ordered 1× Yamaha Acoustic Guitar F310 (Demo UPI). Tap to accept.',
    referenceId: 'ORD-1001',
    priority: 'HIGH',
    read: false,
    timestamp: '2 mins ago',
  },
  {
    id: 'notif_stock_tabla',
    type: 'LOW_STOCK',
    channelId: 'low-stock',
    title: 'Low Stock Alert · Professional Copper Tabla Set',
    body: 'Only 2 units left (threshold: 3). Restock soon to avoid missing orders.',
    referenceId: 'prod_tabla',
    priority: 'HIGH',
    read: false,
    timestamp: '14 mins ago',
  },
  {
    id: 'notif_status_1002',
    type: 'ORDER_STATUS',
    channelId: 'order-status',
    title: 'Order #ORD-1002 → PACKED',
    body: 'Bharatanatyam Silk Costume Set is packed and ready for Shiprocket pickup.',
    referenceId: 'ORD-1002',
    priority: 'DEFAULT',
    read: true,
    timestamp: '1 hr ago',
  },
];

export const APP_ICON_URL = '/src/assets/images/app_icon_sanjit_partner_1795067998809.jpg';

const IMG_GUITAR = '/src/assets/images/product_acoustic_guitar_1795061118777.jpg';
const IMG_KEYBOARD = '/src/assets/images/product_keyboard_piano_1795067998429.jpg';
const IMG_TABLA = '/src/assets/images/product_tabla_set_1795061118537.jpg';
const IMG_DJ = '/src/assets/images/product_dj_mixer_1795061118856.jpg';
const IMG_BHARATANATYAM = '/src/assets/images/product_bharatanatyam_dress_1795061118744.jpg';
const IMG_BIHU = '/src/assets/images/product_bihu_ghungroo_1795067999271.jpg';

export const CATEGORY_IMAGE_FALLBACK: Record<PartnerCategory, string> = {
  'Musical Instruments': IMG_GUITAR,
  'Electronic Equipment': IMG_DJ,
  'Dance Dresses': IMG_BHARATANATYAM,
  'Dance Accessories': IMG_BIHU,
};

/** All 15 sample products explicitly requested */
export const INITIAL_DEMO_PRODUCTS: DemoPartnerProduct[] = [
  {
    id: 'prod_01',
    name: 'Acoustic Dreadnought Guitar (Solid Spruce)',
    sku: 'SMS-GTR-01',
    category: 'Musical Instruments',
    subcategory: 'Guitar',
    priceInr: 12499,
    mrpInr: 15999,
    stock: 14,
    lowStockThreshold: 4,
    warrantyMonths: 12,
    description: '41-inch spruce top acoustic guitar with truss rod and padded gig bag.',
    imageUrl: IMG_GUITAR,
  },
  {
    id: 'prod_02',
    name: 'Arranger Keyboard 61-Key Touch Response',
    sku: 'SMS-KBD-02',
    category: 'Musical Instruments',
    subcategory: 'Keyboard',
    priceInr: 18500,
    mrpInr: 22499,
    stock: 8,
    lowStockThreshold: 3,
    warrantyMonths: 24,
    description: '61 touch-sensitive keys with 700+ Indian & Western rhythms and USB MIDI.',
    imageUrl: IMG_KEYBOARD,
  },
  {
    id: 'prod_03',
    name: '88-Key Weighted Digital Stage Piano',
    sku: 'SMS-PNO-03',
    category: 'Musical Instruments',
    subcategory: 'Piano',
    priceInr: 54900,
    mrpInr: 64900,
    stock: 3,
    lowStockThreshold: 3,
    warrantyMonths: 24,
    description: 'Hammer-action 88-key digital piano with sustain pedal and studio grand voices.',
    imageUrl: IMG_KEYBOARD,
  },
  {
    id: 'prod_04',
    name: 'Concert Brass Bayan & Sheesham Tabla Set',
    sku: 'SMS-TBL-04',
    category: 'Musical Instruments',
    subcategory: 'Tabla',
    priceInr: 9800,
    mrpInr: 12500,
    stock: 11,
    lowStockThreshold: 4,
    warrantyMonths: 6,
    description: 'Hand-tuned copper-brass bayan and seasoned sheesham dayan with rings & hammer.',
    imageUrl: IMG_TABLA,
  },
  {
    id: 'prod_05',
    name: 'Professional Nut-Bolt Mango Wood Dholak',
    sku: 'SMS-DHL-05',
    category: 'Musical Instruments',
    subcategory: 'Dholak',
    priceInr: 4250,
    mrpInr: 5600,
    stock: 16,
    lowStockThreshold: 5,
    warrantyMonths: 6,
    description: 'Tunable nut-bolt folk & bhajan dholak with padded carry cover and tuning wrench.',
    imageUrl: IMG_TABLA,
  },
  {
    id: 'prod_06',
    name: '9-Stopper Double Reed Teakwood Harmonium',
    sku: 'SMS-HRM-06',
    category: 'Musical Instruments',
    subcategory: 'Harmonium',
    priceInr: 14900,
    mrpInr: 18500,
    stock: 2,
    lowStockThreshold: 3,
    warrantyMonths: 12,
    description: 'Scale-changer ready folding harmonium with 42 keys, coupler, and bass-male reeds.',
    imageUrl: IMG_KEYBOARD,
  },
  {
    id: 'prod_07',
    name: 'Assam Bamboo C-Natural Concert Bansuri Flute',
    sku: 'SMS-FLT-07',
    category: 'Musical Instruments',
    subcategory: 'Flute',
    priceInr: 1650,
    mrpInr: 2200,
    stock: 28,
    lowStockThreshold: 6,
    warrantyMonths: 3,
    description: 'Seasoned Assam bamboo 19-inch C-middle concert flute with silk thread binding.',
    imageUrl: IMG_GUITAR,
  },
  {
    id: 'prod_08',
    name: '4-Channel Pro Club DJ Mixer & USB Interface',
    sku: 'SMS-DJM-08',
    category: 'Electronic Equipment',
    subcategory: 'DJ Mixer',
    priceInr: 32999,
    mrpInr: 39999,
    stock: 5,
    lowStockThreshold: 2,
    warrantyMonths: 12,
    description: '4-deck performance DJ mixer with dual mic XLR inputs, FX bank, and club outputs.',
    imageUrl: IMG_DJ,
  },
  {
    id: 'prod_09',
    name: '1200W Dual-Channel Stage Power Amplifier',
    sku: 'SMS-AMP-09',
    category: 'Electronic Equipment',
    subcategory: 'Amplifier',
    priceInr: 21500,
    mrpInr: 26500,
    stock: 6,
    lowStockThreshold: 2,
    warrantyMonths: 12,
    description: 'Heavy-duty class-AB rack amplifier with thermal protection for live concerts.',
    imageUrl: IMG_DJ,
  },
  {
    id: 'prod_10',
    name: '15-Inch Active PA Stage Speakers (Pair)',
    sku: 'SMS-SPK-10',
    category: 'Electronic Equipment',
    subcategory: 'Speakers',
    priceInr: 28400,
    mrpInr: 34000,
    stock: 4,
    lowStockThreshold: 3,
    warrantyMonths: 12,
    description: '1000W peak active PA speaker pair with Bluetooth, XLR line-in, and tripod mount.',
    imageUrl: IMG_DJ,
  },
  {
    id: 'prod_11',
    name: 'Dual UHF Wireless Handheld Microphone Set',
    sku: 'SMS-MIC-11',
    category: 'Electronic Equipment',
    subcategory: 'Microphone',
    priceInr: 6850,
    mrpInr: 8900,
    stock: 19,
    lowStockThreshold: 5,
    warrantyMonths: 12,
    description: 'Anti-feedback cardioid UHF wireless mic pair with 80m stage range receiver.',
    imageUrl: IMG_DJ,
  },
  {
    id: 'prod_12',
    name: 'Kanchipuram Silk Bharatanatyam Dance Dress',
    sku: 'SMS-BHR-12',
    category: 'Dance Dresses',
    subcategory: 'Bharatanatyam dresses',
    priceInr: 5499,
    mrpInr: 6999,
    stock: 12,
    lowStockThreshold: 4,
    warrantyMonths: 0,
    description: 'Ready-stitched pleated fan costume in temple purple & gold zari border (S to XL).',
    imageUrl: IMG_BHARATANATYAM,
  },
  {
    id: 'prod_13',
    name: 'Royal Anarkali Kathak Performance Dress',
    sku: 'SMS-KTH-13',
    category: 'Dance Dresses',
    subcategory: 'Kathak dresses',
    priceInr: 4899,
    mrpInr: 6200,
    stock: 9,
    lowStockThreshold: 3,
    warrantyMonths: 0,
    description: '16-kali full-flare georgette & brocade Kathak anarkali with churidar and dupatta.',
    imageUrl: IMG_BHARATANATYAM,
  },
  {
    id: 'prod_14',
    name: 'Authentic Assamese Muga Silk Bihu Costume',
    sku: 'SMS-BHU-14',
    category: 'Dance Dresses',
    subcategory: 'Bihu costumes',
    priceInr: 4599,
    mrpInr: 5999,
    stock: 2,
    lowStockThreshold: 4,
    warrantyMonths: 0,
    description: 'Traditional ivory-gold mekhela chador with woven red motifs and matching blouse.',
    imageUrl: IMG_BIHU,
  },
  {
    id: 'prod_15',
    name: '100+100 Brass Bell Velvet Pad Ghungroo Pair',
    sku: 'SMS-GHN-15',
    category: 'Dance Accessories',
    subcategory: 'Ghungroo',
    priceInr: 1899,
    mrpInr: 2499,
    stock: 25,
    lowStockThreshold: 6,
    warrantyMonths: 0,
    description: '16-number resonant solid brass bells hand-stitched onto cushioned velvet ankle pads.',
    imageUrl: IMG_BIHU,
  },
];

export const INITIAL_DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    id: 'cust_01',
    name: 'Ananya Borgohain',
    phone: '+91 98640 44120',
    email: 'ananya.b@demo-sanjit.in',
    city: 'Guwahati',
    address: 'House 19, Chandmari Colony, Guwahati, Assam 781003',
    totalOrders: 4,
    totalSpentInr: 36496,
    joinedDate: '12 Jan 2026',
    notes: 'Prefers evening delivery after 5 PM. Classical dance academy instructor.',
  },
  {
    id: 'cust_02',
    name: 'Rohan Kulkarni',
    phone: '+91 98220 71845',
    email: 'rohan.k@demo-sanjit.in',
    city: 'Jorhat',
    address: 'AT Road, Near Gar-Ali Crossing, Jorhat, Assam 785001',
    totalOrders: 2,
    totalSpentInr: 51499,
    joinedDate: '04 Feb 2026',
    notes: 'Event sound engineer — orders DJ mixers, speakers, and microphones.',
  },
  {
    id: 'cust_03',
    name: 'Meenakshi Iyer',
    phone: '+91 94350 88219',
    email: 'meenakshi.i@demo-sanjit.in',
    city: 'Dibrugarh',
    address: 'Milan Nagar Lane 4, Dibrugarh, Assam 786003',
    totalOrders: 3,
    totalSpentInr: 21697,
    joinedDate: '19 Feb 2026',
    notes: 'Bulk school dance costume buyer.',
  },
];

export const INITIAL_DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'ORD-5104',
    invoiceNo: 'INV-2026-5104',
    customerId: 'cust_01',
    customerName: 'Ananya Borgohain',
    customerPhone: '+91 98640 44120',
    customerEmail: 'ananya.b@demo-sanjit.in',
    address: 'House 19, Chandmari Colony, Guwahati, Assam',
    city: 'Guwahati',
    pincode: '781003',
    items: [
      { productId: 'prod_14', name: 'Authentic Assamese Muga Silk Bihu Costume', qty: 1, unitPriceInr: 4599 },
      { productId: 'prod_15', name: '100+100 Brass Bell Velvet Pad Ghungroo Pair', qty: 1, unitPriceInr: 1899 },
    ],
    subtotalInr: 6498,
    commissionInr: 325,
    netEarningInr: 6173,
    paymentMethod: 'Demo UPI',
    status: 'NEW',
    deliveryOtp: '4829',
    courierName: 'Sanjit Own Rider',
    awbCode: 'SMS-GUW-9041',
    riderName: 'Bikram Das',
    riderPhone: '+91 97060 11223',
    createdAt: 'Today, 10:18 AM',
    trackingHistory: [
      { status: 'NEW', location: 'Guwahati Flagship Store', timestamp: 'Today, 10:18 AM', note: 'New demo order received via customer app' },
    ],
  },
  {
    id: 'ORD-5103',
    invoiceNo: 'INV-2026-5103',
    customerId: 'cust_02',
    customerName: 'Rohan Kulkarni',
    customerPhone: '+91 98220 71845',
    customerEmail: 'rohan.k@demo-sanjit.in',
    address: 'AT Road, Near Gar-Ali Crossing, Jorhat, Assam',
    city: 'Jorhat',
    pincode: '785001',
    items: [
      { productId: 'prod_08', name: '4-Channel Pro Club DJ Mixer & USB Interface', qty: 1, unitPriceInr: 32999 },
    ],
    subtotalInr: 32999,
    commissionInr: 1650,
    netEarningInr: 31349,
    paymentMethod: 'Demo Card',
    status: 'PACKED',
    deliveryOtp: '7194',
    courierName: 'Shiprocket Express',
    awbCode: 'SRK-88201944',
    riderName: 'Raju Kalita',
    riderPhone: '+91 98641 22334',
    createdAt: 'Yesterday, 06:42 PM',
    trackingHistory: [
      { status: 'NEW', location: 'Guwahati Store', timestamp: 'Yesterday, 06:42 PM', note: 'Demo order placed' },
      { status: 'ACCEPTED', location: 'Guwahati Store', timestamp: 'Yesterday, 06:55 PM', note: 'Seller accepted order' },
      { status: 'PACKED', location: 'Guwahati Dispatch Desk', timestamp: 'Today, 09:10 AM', note: 'Shockproof flight box sealed' },
    ],
  },
  {
    id: 'ORD-5102',
    invoiceNo: 'INV-2026-5102',
    customerId: 'cust_03',
    customerName: 'Meenakshi Iyer',
    customerPhone: '+91 94350 88219',
    customerEmail: 'meenakshi.i@demo-sanjit.in',
    address: 'Milan Nagar Lane 4, Dibrugarh, Assam',
    city: 'Dibrugarh',
    pincode: '786003',
    items: [
      { productId: 'prod_12', name: 'Kanchipuram Silk Bharatanatyam Dance Dress', qty: 2, unitPriceInr: 5499 },
      { productId: 'prod_04', name: 'Concert Brass Bayan & Sheesham Tabla Set', qty: 1, unitPriceInr: 9800 },
    ],
    subtotalInr: 20798,
    commissionInr: 1040,
    netEarningInr: 19758,
    paymentMethod: 'Cash on Delivery',
    status: 'OUT_FOR_DELIVERY',
    deliveryOtp: '3051',
    courierName: 'Delhivery Surface',
    awbCode: 'DLV-44902188',
    riderName: 'Pranjal Gogoi',
    riderPhone: '+91 94351 77665',
    createdAt: '2 days ago',
    trackingHistory: [
      { status: 'NEW', location: 'Guwahati Store', timestamp: '2 days ago', note: 'Order created (COD)' },
      { status: 'SHIPPED', location: 'Guwahati Hub', timestamp: 'Yesterday, 02:15 PM', note: 'Dispatched via Delhivery' },
      { status: 'OUT_FOR_DELIVERY', location: 'Dibrugarh Hub', timestamp: 'Today, 08:40 AM', note: 'Out for delivery with rider Pranjal Gogoi' },
    ],
  },
  {
    id: 'ORD-5101',
    invoiceNo: 'INV-2026-5101',
    customerId: 'cust_01',
    customerName: 'Ananya Borgohain',
    customerPhone: '+91 98640 44120',
    customerEmail: 'ananya.b@demo-sanjit.in',
    address: 'House 19, Chandmari Colony, Guwahati, Assam',
    city: 'Guwahati',
    pincode: '781003',
    items: [
      { productId: 'prod_01', name: 'Acoustic Dreadnought Guitar (Solid Spruce)', qty: 1, unitPriceInr: 12499 },
    ],
    subtotalInr: 12499,
    commissionInr: 625,
    netEarningInr: 11874,
    paymentMethod: 'Demo UPI',
    status: 'DELIVERED',
    deliveryOtp: '9920',
    courierName: 'Sanjit Own Rider',
    awbCode: 'SMS-GUW-8910',
    riderName: 'Bikram Das',
    riderPhone: '+91 97060 11223',
    createdAt: '4 days ago',
    trackingHistory: [
      { status: 'NEW', location: 'Guwahati Store', timestamp: '4 days ago', note: 'Demo order received' },
      { status: 'DELIVERED', location: 'Chandmari, Guwahati', timestamp: '3 days ago', note: 'Delivered & verified with 4-digit OTP' },
    ],
  },
];

export const INITIAL_DEMO_PLANS: DemoSubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter Shop Plan',
    monthlyPriceInr: 999,
    commissionPercent: 8,
    productLimit: 50,
    features: ['Up to 50 products', 'Branded online catalog', '8% platform commission', 'Standard seller support'],
  },
  {
    id: 'growth',
    name: 'Growth Partner Plan',
    monthlyPriceInr: 2499,
    commissionPercent: 5,
    productLimit: 300,
    features: ['Up to 300 products', 'Android white-label APK', '5% platform commission', 'Courier AWB & OTP delivery'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Flagship Plan',
    monthlyPriceInr: 5999,
    commissionPercent: 2,
    productLimit: 2500,
    features: ['Up to 2,500 products', 'Android + iOS white-label apps', '2% lowest commission', 'Custom domain & priority SLA'],
  },
];

export const INITIAL_DEMO_SUB_PAYMENTS: DemoSubscriptionPayment[] = [
  {
    id: 'SUB-902',
    planName: 'Growth Partner Plan (Demo)',
    amountInr: 2499,
    date: '01 Nov 2026',
    mode: 'Demo UPI Simulation',
    status: 'DEMO_RECORDED',
  },
  {
    id: 'SUB-874',
    planName: 'Growth Partner Plan (Demo)',
    amountInr: 2499,
    date: '01 Oct 2026',
    mode: 'Demo Card Simulation',
    status: 'DEMO_RECORDED',
  },
];

export const INITIAL_DEMO_WITHDRAWALS: DemoWithdrawalRequest[] = [
  {
    id: 'WDR-301',
    amountInr: 18500,
    bankAccount: 'SBI •••• 4821',
    upiId: 'sanjitmusical@sbi',
    requestedAt: '14 Nov 2026',
    status: 'DEMO_PROCESSED',
  },
];

export const INITIAL_DEMO_CHAT: DemoChatMessage[] = [
  {
    id: 'msg_1',
    customerId: 'cust_01',
    customerName: 'Ananya Borgohain',
    sender: 'CUSTOMER',
    text: 'Namaskar! Does the Muga Silk Bihu costume include the stitched blouse for size M?',
    timestamp: '10:22 AM',
    orderRef: 'ORD-5104',
  },
  {
    id: 'msg_2',
    customerId: 'cust_01',
    customerName: 'Ananya Borgohain',
    sender: 'SELLER',
    text: 'Namaskar Ananya ji! Yes, size M stitched blouse piece and brass ghungroo pouch are packed together.',
    timestamp: '10:25 AM',
    orderRef: 'ORD-5104',
  },
  {
    id: 'msg_3',
    customerId: 'cust_02',
    customerName: 'Rohan Kulkarni',
    sender: 'CUSTOMER',
    text: 'Please share the Shiprocket AWB for the 4-Channel DJ Mixer order ORD-5103.',
    timestamp: 'Yesterday',
    orderRef: 'ORD-5103',
  },
];

export const WEEKLY_DEMO_SALES = [
  { label: 'Mon', salesInr: 8400, orders: 4 },
  { label: 'Tue', salesInr: 12900, orders: 6 },
  { label: 'Wed', salesInr: 6500, orders: 3 },
  { label: 'Thu', salesInr: 19400, orders: 8 },
  { label: 'Fri', salesInr: 14200, orders: 6 },
  { label: 'Sat', salesInr: 26800, orders: 11 },
  { label: 'Sun', salesInr: 21500, orders: 9 },
];

export const INITIAL_DEMO_PROFILE: DemoShopProfile = {
  shopName: 'Sanjit Musical & Dance Emporium',
  ownerName: 'Sanjit Kalita',
  phone: '+91 98640 11022',
  email: 'partner@sanjitmusical.in',
  gstNumber: '18AABCS1429B1Z5',
  address: 'GS Road, Bhangagarh, Near Musik Plaza',
  city: 'Guwahati',
  state: 'Assam',
  pincode: '781005',
  upiId: 'sanjitmusical@sbi',
  bankAccountMasked: 'SBI •••• 4821 (IFSC: SBIN0004122)',
  activePlanId: 'growth',
};

export type DemoReviewScope = 'STORE' | 'PRODUCT';
export type DemoReviewStatus = 'PENDING_REPLY' | 'REPLIED';

export interface DemoCustomerReview {
  id: string;
  scope: DemoReviewScope;
  productId: string;
  productName: string;
  orderRef: string;
  customerId: string;
  customerName: string;
  customerCity: string;
  rating: number;
  comment: string;
  createdAt: string;
  sellerReply?: string;
  sellerRepliedAt?: string;
  status: DemoReviewStatus;
  verifiedPurchase: boolean;
}

export const INITIAL_DEMO_REVIEWS: DemoCustomerReview[] = [
  {
    id: 'rev_501',
    scope: 'PRODUCT',
    productId: 'prod_01',
    productName: 'Acoustic Dreadnought Guitar (Solid Spruce)',
    orderRef: 'ORD-5101',
    customerId: 'cust_01',
    customerName: 'Ananya Borgohain',
    customerCity: 'Guwahati',
    rating: 5,
    comment:
      'Rich spruce resonance right out of the box and the truss rod setup was already stage-ready. Padded gig bag feels sturdy for daily classes.',
    createdAt: 'Today, 11:20 AM',
    status: 'PENDING_REPLY',
    verifiedPurchase: true,
  },
  {
    id: 'rev_502',
    scope: 'STORE',
    productId: 'store_overall',
    productName: 'Sanjit Musical & Dance Emporium (Store)',
    orderRef: 'ORD-5104',
    customerId: 'cust_03',
    customerName: 'Debashish Baruah',
    customerCity: 'Dibrugarh',
    rating: 4,
    comment:
      'Very knowledgeable staff who helped us pick the right Muga Bihu costume size over chat. Packaging was neat, though Shiprocket took one extra day.',
    createdAt: 'Today, 09:05 AM',
    status: 'PENDING_REPLY',
    verifiedPurchase: true,
  },
  {
    id: 'rev_503',
    scope: 'PRODUCT',
    productId: 'prod_08',
    productName: '4-Channel Pro Club DJ Mixer & USB Interface',
    orderRef: 'ORD-5103',
    customerId: 'cust_02',
    customerName: 'Rohan Kulkarni',
    customerCity: 'Shillong',
    rating: 3,
    comment:
      'Mixer channels and FX bank perform well for our club gig, but the box did not include a printed quick-start guide for USB routing.',
    createdAt: 'Yesterday',
    status: 'PENDING_REPLY',
    verifiedPurchase: true,
  },
  {
    id: 'rev_504',
    scope: 'PRODUCT',
    productId: 'prod_04',
    productName: 'Concert Brass Bayan & Sheesham Tabla Set',
    orderRef: 'ORD-5098',
    customerId: 'cust_04',
    customerName: 'Meenakshi Iyer',
    customerCity: 'Silchar',
    rating: 5,
    comment:
      'Authentic concert tone on the sheesham dayan and heavy copper-brass bayan. Tuning hammer and cushions arrived safely wrapped.',
    createdAt: '2 days ago',
    sellerReply:
      'Namaskar Meenakshi ji! Thank you for trusting Sanjit Musical Store. Wishing you wonderful concert recitals ahead—reach out anytime for re-skinning or tuning tips.',
    sellerRepliedAt: '2 days ago',
    status: 'REPLIED',
    verifiedPurchase: true,
  },
  {
    id: 'rev_505',
    scope: 'PRODUCT',
    productId: 'prod_12',
    productName: 'Kanchipuram Silk Bharatanatyam Dance Dress',
    orderRef: 'ORD-5095',
    customerId: 'cust_05',
    customerName: 'Priyanka Sharma',
    customerCity: 'Jorhat',
    rating: 5,
    comment:
      'The purple and gold zari border looked stunning under stage lights during our arangetram. Fan pleats open cleanly during araimandi.',
    createdAt: '4 days ago',
    sellerReply:
      'Thank you so much Priyanka ji! Delighted to hear the zari costume shone during your arangetram performance.',
    sellerRepliedAt: '3 days ago',
    status: 'REPLIED',
    verifiedPurchase: true,
  },
  {
    id: 'rev_506',
    scope: 'STORE',
    productId: 'store_overall',
    productName: 'Sanjit Musical & Dance Emporium (Store)',
    orderRef: 'ORD-5089',
    customerId: 'cust_06',
    customerName: 'Arjun Hazarika',
    customerCity: 'Tezpur',
    rating: 5,
    comment:
      'Fast counter UPI QR checkout and genuine GST invoice for our school music department bulk purchase. Best musical store in Assam.',
    createdAt: '5 days ago',
    status: 'PENDING_REPLY',
    verifiedPurchase: true,
  },
  {
    id: 'rev_507',
    scope: 'PRODUCT',
    productId: 'prod_15',
    productName: '100+100 Brass Bell Velvet Pad Ghungroo Pair',
    orderRef: 'ORD-5082',
    customerId: 'cust_01',
    customerName: 'Ananya Borgohain',
    customerCity: 'Guwahati',
    rating: 4,
    comment:
      'Crisp brass bell tone and very comfortable velvet padding for 2-hour Kathak practice sessions.',
    createdAt: '1 week ago',
    sellerReply:
      'Glad you love the velvet cushioning and bell tone, Ananya ji! Keep shining on stage.',
    sellerRepliedAt: '6 days ago',
    status: 'REPLIED',
    verifiedPurchase: true,
  },
];
