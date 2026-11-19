import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  INITIAL_CHAT_MESSAGES,
  INITIAL_COUPONS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_SHOPS,
  INITIAL_USER_PROFILE,
} from '../data/storeData';
import {
  CartItem,
  CouponItem,
  CustomerOrder,
  CustomerReview,
  CustomerUserProfile,
  PaymentMethod,
  PushRegistrationState,
  ShopInfo,
  StoreChatMessage,
  StoreProduct,
} from '../types';
import { auth, testFirestoreConnection } from '../services/firebaseConfig';
import {
  cancelOrderOnBackend,
  fetchBackendShops,
  sendChatMessageToBackend,
  submitOrderToBackend,
} from '../services/apiService';
import {
  DEFAULT_TENANT_ID,
  subscribeToCustomerOrdersInFirestore,
  syncCustomerProfileToFirestore,
  syncOrderCancelToFirestore,
  syncOrderToFirestore,
  syncReviewToFirestore,
} from '../services/storeService';
import {
  registerCustomerPushNotifications,
  triggerCustomerOrderNotification,
} from '../services/pushNotificationService';

export interface AuthActionResult {
  ok: boolean;
  message: string;
}

export interface PlaceOrderResult {
  order: CustomerOrder;
  syncedToBackend: boolean;
  syncedToFirestore: boolean;
}

interface CustomerContextValue {
  isAuthenticated: boolean;
  authLoading: boolean;
  shops: ShopInfo[];
  selectedShop: ShopInfo;
  selectShop: (tenantId: string) => void;
  products: StoreProduct[];
  coupons: CouponItem[];
  cart: CartItem[];
  cartShop: ShopInfo | null;
  wishlistIds: string[];
  orders: CustomerOrder[];
  reviews: CustomerReview[];
  chatMessages: StoreChatMessage[];
  profile: CustomerUserProfile;
  pushState: PushRegistrationState;
  appliedCoupon: CouponItem | null;
  cartCount: number;
  cartSubtotal: number;
  discountInr: number;
  deliveryFeeInr: number;
  cartTotal: number;
  loginWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  registerWithEmail: (input: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<AuthActionResult>;
  continueAsDemoCustomer: () => void;
  logout: () => Promise<void>;
  enablePushNotifications: () => Promise<PushRegistrationState>;
  addToCart: (product: StoreProduct, variant?: string, replaceCartOnShopSwitch?: boolean) => 'ADDED' | 'DIFFERENT_SHOP';
  updateCartQty: (productId: string, variant: string, delta: number) => void;
  removeFromCart: (productId: string, variant: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  placeOrder: (params: {
    paymentMethod: PaymentMethod;
    upiRefId?: string;
    shippingAddress: string;
  }) => Promise<PlaceOrderResult>;
  cancelOrder: (orderId: string) => Promise<void>;
  submitReview: (input: {
    tenantId: string;
    productId: string;
    productName: string;
    orderRef: string;
    rating: number;
    comment: string;
  }) => Promise<void>;
  sendChatMessage: (text: string) => void;
  updateProfileInfo: (patch: Partial<CustomerUserProfile>) => void;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

const INITIAL_PUSH_STATE: PushRegistrationState = {
  permissionStatus: 'undetermined',
  fcmToken: null,
  deviceName: 'Android Device',
  firestoreSynced: false,
  channels: ['order-updates', 'promotions'],
  lastSyncedAt: 'Not registered yet',
};

function friendlyAuthError(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Invalid email or password. Please check your credentials or register a new account.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (code.includes('weak-password')) {
    return 'Password should be at least 6 characters long.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'Email/Password sign-in is not enabled yet in Firebase Console. Use Quick Demo Shopper below to test right away.';
  }
  if (code.includes('network-request-failed')) {
    return 'Network unavailable. Check your internet connection or use Quick Demo Shopper.';
  }
  return 'Could not complete authentication. You can continue with Quick Demo Shopper.';
}

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [shops, setShops] = useState<ShopInfo[]>(INITIAL_SHOPS);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(DEFAULT_TENANT_ID);
  const [products] = useState<StoreProduct[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([
    'prod_sanjit_guitar_01',
    'prod_xyz_ghungroo_02',
  ]);
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS);
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [chatMessages, setChatMessages] = useState<StoreChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [profile, setProfile] = useState<CustomerUserProfile>(INITIAL_USER_PROFILE);
  const [pushState, setPushState] = useState<PushRegistrationState>(INITIAL_PUSH_STATE);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);

  const selectedShop = useMemo(
    () => shops.find((s) => s.tenantId === selectedTenantId) || shops[0] || INITIAL_SHOPS[0],
    [shops, selectedTenantId]
  );

  const cartShop = useMemo(() => {
    if (cart.length === 0) return null;
    const tid = cart[0].product.tenantId;
    return shops.find((s) => s.tenantId === tid) || selectedShop;
  }, [cart, shops, selectedShop]);

  // Verify Firestore connectivity & pull live shops from shared Express backend
  useEffect(() => {
    testFirestoreConnection().catch(() => {});
    fetchBackendShops()
      .then((liveShops) => {
        if (liveShops && liveShops.length > 0) {
          setShops(liveShops);
        }
      })
      .catch(() => {});
  }, []);

  // Observe Firebase Auth session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setProfile((prev) => ({
          ...prev,
          uid: fbUser.uid,
          name: fbUser.displayName || prev.name,
          email: fbUser.email || prev.email,
          authMode: 'FIREBASE',
          emailVerified: fbUser.emailVerified,
        }));
        setIsAuthenticated(true);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Live Firestore order status sync when signed in with verified Firebase customer
  useEffect(() => {
    if (!isAuthenticated || profile.authMode !== 'FIREBASE' || !profile.emailVerified) {
      return;
    }
    const unsub = subscribeToCustomerOrdersInFirestore(selectedShop.tenantId, (statusMap) => {
      setOrders((prev) =>
        prev.map((order) => {
          const liveStatus = statusMap[order.id];
          if (!liveStatus || liveStatus === order.status) return order;
          return {
            ...order,
            status: liveStatus,
            trackingHistory: [
              ...order.trackingHistory,
              {
                status: liveStatus,
                location: `${order.shopName} Partner App`,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                note: `Live status updated to ${liveStatus.replace(/_/g, ' ')} by Shop Partner.`,
              },
            ],
          };
        })
      );
    });
    return () => unsub();
  }, [isAuthenticated, profile.authMode, profile.emailVerified, selectedShop.tenantId]);

  const selectShop = (tenantId: string) => {
    const found = shops.find((s) => s.tenantId === tenantId);
    if (found) {
      setSelectedTenantId(found.tenantId);
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = cred.user;
      setProfile((prev) => ({
        ...prev,
        uid: fbUser.uid,
        name: fbUser.displayName || prev.name,
        email: fbUser.email || email.trim(),
        authMode: 'FIREBASE',
        emailVerified: fbUser.emailVerified,
      }));
      setIsAuthenticated(true);
      registerCustomerPushNotifications(selectedShop.tenantId)
        .then(setPushState)
        .catch(() => {});
      return {
        ok: true,
        message: fbUser.emailVerified
          ? 'Signed in with verified Firebase account.'
          : 'Signed in! Verify your email link to enable live cloud Firestore sync.',
      };
    } catch (err) {
      return { ok: false, message: friendlyAuthError(err) };
    }
  };

  const registerWithEmail = async (input: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<AuthActionResult> => {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        input.email.trim(),
        input.password
      );
      const fbUser = cred.user;
      await updateProfile(fbUser, { displayName: input.name.trim() }).catch(() => {});
      await sendEmailVerification(fbUser).catch(() => {});

      const nextProfile: CustomerUserProfile = {
        ...profile,
        uid: fbUser.uid,
        name: input.name.trim(),
        phone: input.phone.trim() || profile.phone,
        email: input.email.trim(),
        authMode: 'FIREBASE',
        emailVerified: fbUser.emailVerified,
      };
      setProfile(nextProfile);
      setIsAuthenticated(true);

      syncCustomerProfileToFirestore({
        tenantId: selectedShop.tenantId,
        displayName: nextProfile.name,
        email: nextProfile.email,
        phone: nextProfile.phone,
        address: `${nextProfile.address}, ${nextProfile.city}, ${nextProfile.state} - ${nextProfile.pincode}`,
      }).catch(() => {});

      registerCustomerPushNotifications(selectedShop.tenantId)
        .then(setPushState)
        .catch(() => {});

      return {
        ok: true,
        message: 'Account created! Verification link sent to your email.',
      };
    } catch (err) {
      return { ok: false, message: friendlyAuthError(err) };
    }
  };

  const continueAsDemoCustomer = () => {
    setProfile({
      ...INITIAL_USER_PROFILE,
      authMode: 'DEMO',
      emailVerified: false,
    });
    setIsAuthenticated(true);
    registerCustomerPushNotifications(selectedShop.tenantId)
      .then(setPushState)
      .catch(() => {});
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setCart([]);
    setAppliedCoupon(null);
  };

  const enablePushNotifications = async (): Promise<PushRegistrationState> => {
    const state = await registerCustomerPushNotifications(selectedShop.tenantId);
    setPushState(state);
    return state;
  };

  const addToCart = (
    product: StoreProduct,
    variant?: string,
    replaceCartOnShopSwitch = false
  ): 'ADDED' | 'DIFFERENT_SHOP' => {
    const chosenVariant = variant || product.variants[0] || 'Standard';

    if (cart.length > 0 && cart[0].product.tenantId !== product.tenantId) {
      if (!replaceCartOnShopSwitch) {
        return 'DIFFERENT_SHOP';
      }
      setAppliedCoupon(null);
      setCart([{ product, variant: chosenVariant, qty: 1 }]);
      return 'ADDED';
    }

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.product.id === product.id && item.variant === chosenVariant
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(product.stock, next[idx].qty + 1) };
        return next;
      }
      return [...prev, { product, variant: chosenVariant, qty: 1 }];
    });
    return 'ADDED';
  };

  const updateCartQty = (productId: string, variant: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId || item.variant !== variant) return item;
          const nextQty = item.qty + delta;
          if (nextQty <= 0) return null;
          return { ...item, qty: Math.min(item.product.stock, nextQty) };
        })
        .filter((x): x is CartItem => x !== null)
    );
  };

  const removeFromCart = (productId: string, variant: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.variant === variant))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.priceInr * item.qty, 0),
    [cart]
  );

  const discountInr = useMemo(() => {
    if (!appliedCoupon || cartSubtotal < appliedCoupon.minOrderInr) return 0;
    const raw = Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100);
    return Math.min(raw, appliedCoupon.maxDiscountInr);
  }, [appliedCoupon, cartSubtotal]);

  const deliveryFeeInr = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    const activeShop = cartShop || selectedShop;
    return cartSubtotal >= activeShop.freeDeliveryThresholdInr
      ? 0
      : activeShop.baseDeliveryFeeInr;
  }, [cartSubtotal, cartShop, selectedShop]);

  const cartTotal = Math.max(0, cartSubtotal - discountInr + deliveryFeeInr);

  const applyCoupon = (rawCode: string): { ok: boolean; message: string } => {
    const code = rawCode.trim().toUpperCase();
    const found = INITIAL_COUPONS.find((c) => c.code === code);
    if (!found) {
      return { ok: false, message: 'Invalid coupon code. Try SANJIT10 or BIHU15.' };
    }
    if (cartSubtotal < found.minOrderInr) {
      return {
        ok: false,
        message: `Minimum order ₹${found.minOrderInr.toLocaleString('en-IN')} required for ${found.code}.`,
      };
    }
    setAppliedCoupon(found);
    return { ok: true, message: `${found.code} applied successfully!` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const placeOrder = async (params: {
    paymentMethod: PaymentMethod;
    upiRefId?: string;
    shippingAddress: string;
  }): Promise<PlaceOrderResult> => {
    const targetShop = cartShop || selectedShop;
    const targetTenantId = targetShop.tenantId;
    const now = new Date();

    // 1. Send to shared Express backend using exact shop tenantId so the correct Shop Partner App receives it immediately
    const backendRes = await submitOrderToBackend({
      tenantId: targetTenantId,
      customerId: profile.uid,
      customerName: profile.name,
      customerPhone: profile.phone,
      customerEmail: profile.email,
      shippingAddress: params.shippingAddress,
      shippingCity: profile.city,
      shippingPincode: profile.pincode,
      items: cart.map((item) => ({
        productId: item.product.id,
        variantLabel: item.variant,
        quantity: item.qty,
      })),
      couponCode: appliedCoupon?.code,
      paymentMethod: params.paymentMethod,
    });

    const randomDigits = Math.floor(10000 + Math.random() * 89999);
    const orderId = backendRes?.orderId || `ORD-USR-${randomDigits}`;
    const invoiceNo = backendRes?.invoiceNumber || `INV-2026-${randomDigits}`;
    const deliveryOtp = backendRes?.deliveryOtp || String(Math.floor(1000 + Math.random() * 9000));
    const paymentStatus: CustomerOrder['paymentStatus'] =
      backendRes?.paymentStatus ||
      (params.paymentMethod === 'COD' ? 'PENDING' : 'VERIFIED_PAID');

    // 2. Also sync to shared Firestore tenants/{tenantId}/orders/{orderId} (with sellerOwnerId) when signed in with verified Firebase account
    let syncedToFirestore = false;
    try {
      syncedToFirestore = await syncOrderToFirestore({
        tenantId: targetTenantId,
        orderId,
        totalInr: cartTotal,
        paymentMethod: params.paymentMethod,
      });
    } catch {
      syncedToFirestore = false;
    }

    const newOrder: CustomerOrder = {
      id: orderId,
      tenantId: targetTenantId,
      shopName: targetShop.storeName,
      invoiceNo,
      items: cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        variant: c.variant,
        qty: c.qty,
        unitPriceInr: c.product.priceInr,
      })),
      subtotalInr: cartSubtotal,
      discountInr,
      couponCode: appliedCoupon?.code,
      deliveryFeeInr,
      totalInr: cartTotal,
      paymentMethod: params.paymentMethod,
      paymentStatus,
      upiRefId: params.upiRefId,
      status: 'CONFIRMED',
      deliveryOtp,
      courierName: `${targetShop.storeName} Express / Shiprocket`,
      awbCode: `SRK-AS-${Math.floor(1000000 + Math.random() * 8999999)}`,
      shippingAddress: params.shippingAddress,
      createdAt: now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      syncedToBackend: Boolean(backendRes),
      syncedToFirestore,
      trackingHistory: [
        {
          status: 'CONFIRMED',
          location: `${targetShop.storeName} — ${targetShop.city}`,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note:
            params.paymentMethod === 'COD'
              ? `Order confirmed & routed to ${targetShop.storeName} Partner App (Cash on Delivery).`
              : `Payment verified & routed to ${targetShop.storeName} Partner App${
                  params.upiRefId ? ` (Ref: ${params.upiRefId})` : ''
                }.`,
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    // 3. Fire real-time local push notification alert on the customer's device
    triggerCustomerOrderNotification({
      title: `Order Confirmed • ${targetShop.storeName}`,
      body: `Order ${orderId} (₹${newOrder.totalInr.toLocaleString('en-IN')}) sent to ${targetShop.storeName}. Delivery OTP: ${deliveryOtp}`,
      orderId,
    }).catch(() => {});

    return {
      order: newOrder,
      syncedToBackend: Boolean(backendRes),
      syncedToFirestore,
    };
  };

  const cancelOrder = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    const tenantId = target?.tenantId || selectedShop.tenantId;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'VERIFIED_PAID' ? 'REFUNDED' : order.paymentStatus,
          trackingHistory: [
            ...order.trackingHistory,
            {
              status: 'CANCELLED',
              location: 'Customer App',
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              note: 'Order cancelled by customer before shipment.',
            },
          ],
        };
      })
    );

    cancelOrderOnBackend({ tenantId, orderId, customerId: profile.uid }).catch(() => {});
    syncOrderCancelToFirestore(tenantId, orderId).catch(() => {});

    triggerCustomerOrderNotification({
      title: 'Order Cancelled',
      body: `Order ${orderId} has been cancelled and ${target?.shopName || 'the store'} has been notified.`,
      orderId,
    }).catch(() => {});
  };

  const submitReview = async (input: {
    tenantId: string;
    productId: string;
    productName: string;
    orderRef: string;
    rating: number;
    comment: string;
  }) => {
    const reviewId = `rev_${Date.now()}`;
    const newReview: CustomerReview = {
      id: reviewId,
      tenantId: input.tenantId,
      scope: 'PRODUCT',
      productId: input.productId,
      productName: input.productName,
      orderRef: input.orderRef,
      customerName: profile.name,
      rating: input.rating,
      comment: input.comment.trim(),
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      verifiedPurchase: true,
    };
    setReviews((prev) => [newReview, ...prev]);

    syncReviewToFirestore({
      tenantId: input.tenantId,
      reviewId,
      scope: 'PRODUCT',
      productId: input.productId,
      productName: input.productName,
      orderRef: input.orderRef,
      customerName: profile.name,
      rating: input.rating,
      comment: input.comment,
    }).catch(() => {});
  };

  const sendChatMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const activeShop = selectedShop;

    const userMsg: StoreChatMessage = {
      id: `chat_${Date.now()}`,
      tenantId: activeShop.tenantId,
      sender: 'CUSTOMER',
      text: trimmed,
      timestamp: nowTime,
    };
    setChatMessages((prev) => [...prev, userMsg]);

    sendChatMessageToBackend({
      tenantId: activeShop.tenantId,
      senderId: profile.uid,
      senderName: profile.name,
      body: trimmed,
    }).catch(() => {});

    setTimeout(() => {
      const reply: StoreChatMessage = {
        id: `chat_reply_${Date.now()}`,
        tenantId: activeShop.tenantId,
        sender: 'STORE',
        text: `Thanks ${profile.name.split(' ')[0]}! ${activeShop.storeName} (${activeShop.city}) received your message and our team will respond right away.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 850);
  };

  const updateProfileInfo = (patch: Partial<CustomerUserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...patch };
      if (updated.authMode === 'FIREBASE' && updated.emailVerified) {
        syncCustomerProfileToFirestore({
          tenantId: selectedShop.tenantId,
          displayName: updated.name,
          email: updated.email,
          phone: updated.phone,
          address: `${updated.address}, ${updated.city}, ${updated.state} - ${updated.pincode}`,
        }).catch(() => {});
      }
      return updated;
    });
  };

  return (
    <CustomerContext.Provider
      value={{
        isAuthenticated,
        authLoading,
        shops,
        selectedShop,
        selectShop,
        products,
        coupons: INITIAL_COUPONS,
        cart,
        cartShop,
        wishlistIds,
        orders,
        reviews,
        chatMessages,
        profile,
        pushState,
        appliedCoupon,
        cartCount,
        cartSubtotal,
        discountInr,
        deliveryFeeInr,
        cartTotal,
        loginWithEmail,
        registerWithEmail,
        continueAsDemoCustomer,
        logout,
        enablePushNotifications,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        applyCoupon,
        removeCoupon,
        placeOrder,
        cancelOrder,
        submitReview,
        sendChatMessage,
        updateProfileInfo,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used inside CustomerProvider');
  return ctx;
}
