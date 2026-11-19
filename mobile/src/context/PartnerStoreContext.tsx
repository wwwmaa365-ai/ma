import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEMO_CHAT_MESSAGES,
  DEMO_CUSTOMER_REVIEWS,
  DEMO_CUSTOMERS,
  DEMO_ORDERS,
  DEMO_PRODUCTS,
  DEMO_SUBSCRIPTION_PAYMENTS,
  DEMO_SUBSCRIPTION_PLANS,
  DEMO_WITHDRAWALS,
  INITIAL_SHOP_PROFILE,
  PRODUCT_IMAGE_MAP,
} from '../data/demoData';
import {
  ChatThreadMessage,
  CustomerProfile,
  CustomerReviewItem,
  FcmChannelId,
  FcmRegistrationState,
  OrderStatus,
  PartnerNotificationItem,
  PartnerOrder,
  PartnerProduct,
  PartnerSettingsData,
  ProductCategory,
  ShopProfileData,
  SubscriptionPaymentItem,
  SubscriptionPlanItem,
  WithdrawalRequestItem,
} from '../types';
import {
  dispatchLocalFcmNotification,
  markFirestoreNotificationRead,
  registerForFcmPushNotifications,
  subscribeToSellerNotifications,
} from '../services/fcmService';
import {
  publishSellerReviewReply,
  sanitizeReplyText,
  subscribeToTenantReviews,
} from '../services/reviewService';
import { testFirestoreConnection } from '../services/firebaseConfig';

const INITIAL_DEMO_NOTIFICATIONS: PartnerNotificationItem[] = [
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
    source: 'DEMO_FCM',
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
    source: 'DEMO_FCM',
  },
  {
    id: 'notif_status_1002',
    type: 'ORDER_STATUS',
    channelId: 'order-status',
    title: 'Order #ORD-1002 Status: PACKED',
    body: 'Bharatanatyam Silk Costume Set is packed and ready for Shiprocket pickup.',
    referenceId: 'ORD-1002',
    priority: 'DEFAULT',
    read: true,
    timestamp: '1 hr ago',
    source: 'DEMO_FCM',
  },
];

interface PartnerStoreContextValue {
  isAuthenticated: boolean;
  pendingPhone: string;
  pendingOtp: string;
  shopProfile: ShopProfileData;
  products: PartnerProduct[];
  orders: PartnerOrder[];
  customers: CustomerProfile[];
  plans: SubscriptionPlanItem[];
  subscriptionPayments: SubscriptionPaymentItem[];
  withdrawals: WithdrawalRequestItem[];
  messages: ChatThreadMessage[];
  reviews: CustomerReviewItem[];
  pendingReviewCount: number;
  settings: PartnerSettingsData;
  notifications: PartnerNotificationItem[];
  unreadNotificationCount: number;
  fcmState: FcmRegistrationState;
  activeBanner: PartnerNotificationItem | null;
  dismissBanner: () => void;
  refreshFcmRegistration: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  simulateNewOrderFcmAlert: () => void;
  simulateOrderStatusFcmAlert: (orderId?: string) => void;
  simulateLowStockFcmAlert: () => void;
  startLoginOtp: (phone: string) => void;
  registerShopDemo: (payload: {
    shopName: string;
    ownerName: string;
    phone: string;
    city: string;
    gstNumber: string;
  }) => void;
  verifyOtpDemo: (code: string) => boolean;
  logoutDemo: () => void;
  addProduct: (payload: {
    name: string;
    category: ProductCategory;
    subcategory: string;
    priceInr: number;
    mrpInr: number;
    stock: number;
    lowStockThreshold: number;
    warrantyMonths: number;
    description: string;
  }) => void;
  updateProduct: (id: string, updates: Partial<PartnerProduct>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (id: string, nextStock: number, threshold?: number) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  recordUpiQrPayment: (orderId: string, utr: string, vpaUsed: string) => void;
  assignDeliveryRider: (orderId: string, riderName: string, courierName: string) => void;
  switchSubscriptionPlanDemo: (planId: 'starter' | 'growth' | 'enterprise') => void;
  requestWithdrawalDemo: (amountInr: number) => boolean;
  sendChatMessage: (customerId: string, customerName: string, text: string) => void;
  replyToCustomerReview: (reviewId: string, replyText: string) => void;
  updateShopProfile: (updates: Partial<ShopProfileData>) => void;
  updateSettings: (updates: Partial<PartnerSettingsData>) => void;
}

const PartnerStoreContext = createContext<PartnerStoreContextValue | null>(null);

export const PartnerStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('+91 98640 11022');
  const [pendingOtp] = useState('1234');
  const [shopProfile, setShopProfile] = useState<ShopProfileData>(INITIAL_SHOP_PROFILE);
  const [products, setProducts] = useState<PartnerProduct[]>(DEMO_PRODUCTS);
  const [orders, setOrders] = useState<PartnerOrder[]>(DEMO_ORDERS);
  const [customers] = useState<CustomerProfile[]>(DEMO_CUSTOMERS);
  const [plans] = useState<SubscriptionPlanItem[]>(DEMO_SUBSCRIPTION_PLANS);
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPaymentItem[]>(
    DEMO_SUBSCRIPTION_PAYMENTS
  );
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>(DEMO_WITHDRAWALS);
  const [messages, setMessages] = useState<ChatThreadMessage[]>(DEMO_CHAT_MESSAGES);
  const [reviews, setReviews] = useState<CustomerReviewItem[]>(DEMO_CUSTOMER_REVIEWS);
  const [settings, setSettings] = useState<PartnerSettingsData>({
    pushOrderAlerts: true,
    orderStatusAlerts: true,
    lowStockAlerts: true,
    codEnabled: true,
    autoAcceptOrders: false,
    vacationMode: false,
  });

  const [notifications, setNotifications] = useState<PartnerNotificationItem[]>(
    INITIAL_DEMO_NOTIFICATIONS
  );
  const [activeBanner, setActiveBanner] = useState<PartnerNotificationItem | null>(null);
  const [fcmState, setFcmState] = useState<FcmRegistrationState>({
    permissionStatus: 'undetermined',
    fcmToken: null,
    deviceName: 'Android Seller Device',
    isLiveFcm: false,
    firestoreSynced: false,
    lastSyncedAt: null,
    channels: ['order-alerts', 'order-status', 'low-stock'],
  });

  const getEnabledChannels = (cfg: PartnerSettingsData): FcmChannelId[] => {
    const ch: FcmChannelId[] = [];
    if (cfg.pushOrderAlerts) ch.push('order-alerts');
    if (cfg.orderStatusAlerts) ch.push('order-status');
    if (cfg.lowStockAlerts) ch.push('low-stock');
    return ch.length > 0 ? ch : ['order-alerts'];
  };

  const pushInAppAndSystemAlert = (item: PartnerNotificationItem) => {
    setNotifications((prev) => [item, ...prev].slice(0, 40));
    setActiveBanner(item);
    void dispatchLocalFcmNotification({
      type: item.type,
      channelId: item.channelId,
      title: item.title,
      body: item.body,
      referenceId: item.referenceId,
    });
  };

  const refreshFcmRegistration = async () => {
    const state = await registerForFcmPushNotifications(
      'sanjit_musical_guwahati',
      getEnabledChannels(settings)
    );
    setFcmState(state);
  };

  useEffect(() => {
    void testFirestoreConnection();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshFcmRegistration();
    const unsubscribeNotifs = subscribeToSellerNotifications(
      'sanjit_musical_guwahati',
      (liveItems) => {
        if (liveItems.length > 0) {
          setNotifications((prev) => {
            const demoOnly = prev.filter((n) => n.source === 'DEMO_FCM');
            return [...liveItems, ...demoOnly].slice(0, 40);
          });
        }
      }
    );
    const unsubscribeReviews = subscribeToTenantReviews(
      'sanjit_musical_guwahati',
      (liveReviews) => {
        if (liveReviews.length > 0) {
          setReviews((prev) => {
            const demoOnly = prev.filter((r) => r.source === 'DEMO_LOCAL');
            return [...liveReviews, ...demoOnly];
          });
        }
      }
    );
    return () => {
      unsubscribeNotifs();
      unsubscribeReviews();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!activeBanner) return;
    const timer = setTimeout(() => setActiveBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [activeBanner]);

  const dismissBanner = () => setActiveBanner(null);

  const markNotificationRead = (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (target && target.source === 'FCM_LIVE' && !target.read) {
      void markFirestoreNotificationRead('sanjit_musical_guwahati', id).catch(() => {});
    }
  };

  const markAllNotificationsRead = () => {
    notifications.forEach((n) => {
      if (n.source === 'FCM_LIVE' && !n.read) {
        void markFirestoreNotificationRead('sanjit_musical_guwahati', n.id).catch(() => {});
      }
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const simulateNewOrderFcmAlert = () => {
    if (!settings.pushOrderAlerts) return;
    const picked = products[Math.floor(Math.random() * Math.min(products.length, 6))] || products[0];
    const orderNum = Math.floor(1100 + Math.random() * 8800);
    const orderId = `ORD-${orderNum}`;
    const commission = Math.round(picked.priceInr * 0.08);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder: PartnerOrder = {
      id: orderId,
      invoiceNo: `INV-SMS-${orderNum}`,
      customerId: 'cust_01',
      customerName: 'Pranjal Medhi',
      customerPhone: '+91 97062 44210',
      customerEmail: 'pranjal.medhi@example.in',
      address: '21 Zoo Road, Near Shraddhanjali Kanan',
      city: 'Guwahati',
      pincode: '781024',
      items: [
        {
          productId: picked.id,
          name: picked.name,
          qty: 1,
          unitPriceInr: picked.priceInr,
        },
      ],
      subtotalInr: picked.priceInr,
      platformCommissionInr: commission,
      netEarningInr: picked.priceInr - commission,
      paymentMethod: 'Demo UPI',
      status: settings.autoAcceptOrders ? 'ACCEPTED' : 'NEW',
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
      courierName: 'Sanjit Own Rider',
      awbCode: `AWB-${Math.floor(100000 + Math.random() * 900000)}`,
      riderName: 'Bikram Das',
      riderPhone: '+91 98641 22019',
      createdAt: `Today, ${nowTime}`,
      trackingHistory: [
        {
          status: settings.autoAcceptOrders ? 'ACCEPTED' : 'NEW',
          location: shopProfile.city,
          timestamp: `Today, ${nowTime}`,
          note: 'Incoming order received via real-time FCM alert (Demo)',
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);

    pushInAppAndSystemAlert({
      id: `notif_new_${Date.now()}`,
      type: 'NEW_ORDER',
      channelId: 'order-alerts',
      title: `New Order #${orderId} · ₹${picked.priceInr.toLocaleString('en-IN')}`,
      body: `Pranjal Medhi ordered 1× ${picked.name}. Tap to review & accept.`,
      referenceId: orderId,
      priority: 'HIGH',
      read: false,
      timestamp: nowTime,
      source: 'DEMO_FCM',
    });
  };

  const simulateOrderStatusFcmAlert = (targetOrderId?: string) => {
    if (!settings.orderStatusAlerts) return;
    const ord = (targetOrderId ? orders.find((o) => o.id === targetOrderId) : orders[0]) || orders[0];
    if (!ord) return;
    const nextStatus: OrderStatus =
      ord.status === 'NEW'
        ? 'ACCEPTED'
        : ord.status === 'ACCEPTED'
        ? 'PACKED'
        : ord.status === 'PACKED'
        ? 'SHIPPED'
        : ord.status === 'SHIPPED'
        ? 'OUT_FOR_DELIVERY'
        : 'DELIVERED';
    updateOrderStatus(ord.id, nextStatus, `FCM status push triggered (${nextStatus.replace(/_/g, ' ')})`);
  };

  const simulateLowStockFcmAlert = () => {
    if (!settings.lowStockAlerts) return;
    const lowItem =
      products.find((p) => p.stock <= p.lowStockThreshold) || products[0];
    if (!lowItem) return;
    const nextQty = Math.min(lowItem.stock, Math.max(1, lowItem.lowStockThreshold - 1));
    updateStock(lowItem.id, nextQty);
  };

  const startLoginOtp = (phone: string) => {
    setPendingPhone(phone.trim() || '+91 98640 11022');
  };

  const registerShopDemo = (payload: {
    shopName: string;
    ownerName: string;
    phone: string;
    city: string;
    gstNumber: string;
  }) => {
    setPendingPhone(payload.phone);
    setShopProfile((prev) => ({
      ...prev,
      shopName: payload.shopName,
      ownerName: payload.ownerName,
      phone: payload.phone,
      city: payload.city,
      gstNumber: payload.gstNumber || prev.gstNumber,
      isRegistered: true,
    }));
  };

  const verifyOtpDemo = (code: string) => {
    if (code.trim() === pendingOtp || code.trim().length === 4) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutDemo = () => {
    setIsAuthenticated(false);
  };

  const addProduct: PartnerStoreContextValue['addProduct'] = (payload) => {
    const img =
      payload.category === 'Electronic Equipment'
        ? PRODUCT_IMAGE_MAP.dj
        : payload.category === 'Dance Dresses'
        ? PRODUCT_IMAGE_MAP.bharatanatyam
        : payload.category === 'Dance Accessories'
        ? PRODUCT_IMAGE_MAP.bihu
        : PRODUCT_IMAGE_MAP.guitar;

    const newItem: PartnerProduct = {
      id: `prod_${Date.now()}`,
      name: payload.name,
      sku: `SMS-${Math.floor(1000 + Math.random() * 9000)}`,
      category: payload.category,
      subcategory: payload.subcategory,
      priceInr: payload.priceInr,
      mrpInr: Math.max(payload.priceInr, payload.mrpInr),
      stock: payload.stock,
      lowStockThreshold: payload.lowStockThreshold,
      warrantyMonths: payload.warrantyMonths,
      description: payload.description,
      image: img,
      active: true,
    };
    setProducts((prev) => [newItem, ...prev]);

    if (settings.lowStockAlerts && newItem.stock <= newItem.lowStockThreshold) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      pushInAppAndSystemAlert({
        id: `notif_stock_${Date.now()}`,
        type: 'LOW_STOCK',
        channelId: 'low-stock',
        title: `Low Stock Alert · ${newItem.name}`,
        body: `Added with only ${newItem.stock} units in stock (threshold: ${newItem.lowStockThreshold}).`,
        referenceId: newItem.id,
        priority: 'HIGH',
        read: false,
        timestamp: nowTime,
        source: 'DEMO_FCM',
      });
    }
  };

  const updateProduct = (id: string, updates: Partial<PartnerProduct>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateStock = (id: string, nextStock: number, threshold?: number) => {
    const safeStock = Math.max(0, nextStock);
    const existingItem = products.find((p) => p.id === id);
    const activeThreshold =
      threshold !== undefined ? Math.max(1, threshold) : existingItem?.lowStockThreshold ?? 3;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              stock: safeStock,
              lowStockThreshold: activeThreshold,
            }
          : p
      )
    );

    if (existingItem && settings.lowStockAlerts && safeStock <= activeThreshold) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      pushInAppAndSystemAlert({
        id: `notif_low_${Date.now()}`,
        type: 'LOW_STOCK',
        channelId: 'low-stock',
        title: `Low Stock Alert · ${existingItem.name}`,
        body:
          safeStock === 0
            ? `Out of stock (0 units left)! Restock immediately to keep listing live.`
            : `Only ${safeStock} unit${safeStock === 1 ? '' : 's'} left (threshold: ${activeThreshold}). Tap to restock.`,
        referenceId: existingItem.id,
        priority: 'HIGH',
        read: false,
        timestamp: nowTime,
        source: 'DEMO_FCM',
      });
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetOrder = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              trackingHistory: [
                ...o.trackingHistory,
                {
                  status,
                  location: shopProfile.city,
                  timestamp: `Today, ${time}`,
                  note: note || `Order status updated to ${status.replace(/_/g, ' ')} (Demo)`,
                },
              ],
            }
          : o
      )
    );

    if (settings.orderStatusAlerts && targetOrder) {
      const cleanLabel = status.replace(/_/g, ' ');
      pushInAppAndSystemAlert({
        id: `notif_st_${Date.now()}`,
        type: 'ORDER_STATUS',
        channelId: 'order-status',
        title: `Order #${orderId} → ${cleanLabel}`,
        body: `${targetOrder.customerName}'s order (${targetOrder.items[0]?.name || 'Item'}) is now ${cleanLabel}.`,
        referenceId: orderId,
        priority: status === 'DELIVERED' || status === 'REJECTED' ? 'HIGH' : 'DEFAULT',
        read: false,
        timestamp: time,
        source: 'DEMO_FCM',
      });
    }
  };

  const recordUpiQrPayment = (orderId: string, utr: string, vpaUsed: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetOrder = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentMethod: 'In-Store UPI QR',
              upiPaymentStatus: 'PAID_UPI_QR',
              upiUtr: utr,
              upiVpaUsed: vpaUsed,
              upiPaidAt: `Today, ${time}`,
              trackingHistory: [
                ...o.trackingHistory,
                {
                  status: 'UPI_QR_PAID',
                  location: shopProfile.city,
                  timestamp: `Today, ${time}`,
                  note: `In-store UPI QR payment recorded (Demo) · UTR: ${utr} · VPA: ${vpaUsed}`,
                },
              ],
            }
          : o
      )
    );

    if (settings.orderStatusAlerts && targetOrder) {
      pushInAppAndSystemAlert({
        id: `notif_upi_${Date.now()}`,
        type: 'ORDER_STATUS',
        channelId: 'order-status',
        title: `UPI QR Received · ₹${targetOrder.subtotalInr.toLocaleString('en-IN')}`,
        body: `Order #${orderId} paid via counter UPI QR (UTR: ${utr}).`,
        referenceId: orderId,
        priority: 'HIGH',
        read: false,
        timestamp: time,
        source: 'DEMO_FCM',
      });
    }
  };

  const assignDeliveryRider = (orderId: string, riderName: string, courierName: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              riderName,
              courierName,
              awbCode: o.awbCode || `AWB-${Math.floor(100000 + Math.random() * 900000)}`,
            }
          : o
      )
    );
  };

  const switchSubscriptionPlanDemo = (planId: 'starter' | 'growth' | 'enterprise') => {
    const target = plans.find((p) => p.id === planId);
    if (!target) return;
    setShopProfile((prev) => ({ ...prev, activePlanId: planId }));
    setSubscriptionPayments((prev) => [
      {
        id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        planName: `${target.name} (Demo Simulation)`,
        amountInr: target.monthlyPriceInr,
        date: 'Today (Demo)',
        mode: 'Demo Mode — No Real Charge',
        status: 'DEMO_RECORDED',
      },
      ...prev,
    ]);
  };

  const requestWithdrawalDemo = (amountInr: number) => {
    if (amountInr < 500) return false;
    setWithdrawals((prev) => [
      {
        id: `WDR-${Math.floor(400 + Math.random() * 599)}`,
        amountInr,
        bankAccount: shopProfile.bankAccountMasked,
        upiId: shopProfile.upiId,
        requestedAt: 'Just now (Demo)',
        status: 'DEMO_PENDING',
      },
      ...prev,
    ]);
    return true;
  };

  const sendChatMessage = (customerId: string, customerName: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        customerId,
        customerName,
        sender: 'SELLER',
        text: trimmed,
        timestamp: time,
      },
    ]);
  };

  const replyToCustomerReview = (reviewId: string, replyText: string) => {
    const clean = sanitizeReplyText(replyText);
    if (clean.length < 2) return;
    const target = reviews.find((r) => r.id === reviewId);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              sellerReply: clean,
              sellerRepliedAt: `Today, ${time}`,
              status: 'REPLIED',
            }
          : r
      )
    );

    if (target?.source === 'FIRESTORE_LIVE') {
      void publishSellerReviewReply('sanjit_musical_guwahati', reviewId, clean).catch(() => {});
    }
  };

  const updateShopProfile = (updates: Partial<ShopProfileData>) => {
    setShopProfile((prev) => ({ ...prev, ...updates }));
  };

  const updateSettings = (updates: Partial<PartnerSettingsData>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      setFcmState((f) => ({ ...f, channels: getEnabledChannels(next) }));
      return next;
    });
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;
  const pendingReviewCount = reviews.filter((r) => r.status === 'PENDING_REPLY').length;

  return (
    <PartnerStoreContext.Provider
      value={{
        isAuthenticated,
        pendingPhone,
        pendingOtp,
        shopProfile,
        products,
        orders,
        customers,
        plans,
        subscriptionPayments,
        withdrawals,
        messages,
        reviews,
        pendingReviewCount,
        settings,
        notifications,
        unreadNotificationCount,
        fcmState,
        activeBanner,
        dismissBanner,
        refreshFcmRegistration,
        markNotificationRead,
        markAllNotificationsRead,
        simulateNewOrderFcmAlert,
        simulateOrderStatusFcmAlert,
        simulateLowStockFcmAlert,
        startLoginOtp,
        registerShopDemo,
        verifyOtpDemo,
        logoutDemo,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        updateOrderStatus,
        recordUpiQrPayment,
        assignDeliveryRider,
        switchSubscriptionPlanDemo,
        requestWithdrawalDemo,
        sendChatMessage,
        replyToCustomerReview,
        updateShopProfile,
        updateSettings,
      }}
    >
      {children}
    </PartnerStoreContext.Provider>
  );
};

export function usePartnerStore() {
  const ctx = useContext(PartnerStoreContext);
  if (!ctx) throw new Error('usePartnerStore must be used inside PartnerStoreProvider');
  return ctx;
}
