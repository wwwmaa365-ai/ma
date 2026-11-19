import React, { createContext, useContext, useState } from 'react';
import {
  DEMO_CHAT_MESSAGES,
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
  OrderStatus,
  PartnerOrder,
  PartnerProduct,
  PartnerSettingsData,
  ProductCategory,
  ShopProfileData,
  SubscriptionPaymentItem,
  SubscriptionPlanItem,
  WithdrawalRequestItem,
} from '../types';

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
  settings: PartnerSettingsData;
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
  assignDeliveryRider: (orderId: string, riderName: string, courierName: string) => void;
  switchSubscriptionPlanDemo: (planId: 'starter' | 'growth' | 'enterprise') => void;
  requestWithdrawalDemo: (amountInr: number) => boolean;
  sendChatMessage: (customerId: string, customerName: string, text: string) => void;
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
  const [settings, setSettings] = useState<PartnerSettingsData>({
    pushOrderAlerts: true,
    lowStockAlerts: true,
    codEnabled: true,
    autoAcceptOrders: false,
    vacationMode: false,
  });

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
  };

  const updateProduct = (id: string, updates: Partial<PartnerProduct>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateStock = (id: string, nextStock: number, threshold?: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              stock: Math.max(0, nextStock),
              lowStockThreshold: threshold !== undefined ? Math.max(1, threshold) : p.lowStockThreshold,
            }
          : p
      )
    );
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const updateShopProfile = (updates: Partial<ShopProfileData>) => {
    setShopProfile((prev) => ({ ...prev, ...updates }));
  };

  const updateSettings = (updates: Partial<PartnerSettingsData>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

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
        settings,
        startLoginOtp,
        registerShopDemo,
        verifyOtpDemo,
        logoutDemo,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        updateOrderStatus,
        assignDeliveryRider,
        switchSubscriptionPlanDemo,
        requestWithdrawalDemo,
        sendChatMessage,
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
