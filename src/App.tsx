import React, { useState, useEffect } from 'react';
import {
  Home,
  ClipboardList,
  Package,
  Wallet,
  UserCircle,
  Sun,
  Moon,
  PlusCircle,
  Layers,
  Truck,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Info,
  Smartphone,
  Download,
} from 'lucide-react';
import {
  CATEGORY_IMAGE_FALLBACK,
  DemoChatMessage,
  DemoOrder,
  DemoOrderStatus,
  DemoPartnerProduct,
  DemoPartnerSettings,
  DemoShopProfile,
  DemoSubscriptionPayment,
  DemoWithdrawalRequest,
  INITIAL_DEMO_CHAT,
  INITIAL_DEMO_CUSTOMERS,
  INITIAL_DEMO_ORDERS,
  INITIAL_DEMO_PLANS,
  INITIAL_DEMO_PRODUCTS,
  INITIAL_DEMO_PROFILE,
  INITIAL_DEMO_SUB_PAYMENTS,
  INITIAL_DEMO_WITHDRAWALS,
  APP_ICON_URL,
} from './data/partnerDemoData.ts';
import {
  SafeAreaView,
  StatusBar,
  MobileStackHeader,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RNImage,
} from './components/rn/ReactNativePrimitives.tsx';
import {
  AuthScreenStep,
  PartnerAuthFlow,
} from './components/mobile/PartnerAuthFlow.tsx';
import {
  OrderSubView,
  PartnerOrdersModule,
} from './components/mobile/PartnerOrdersModule.tsx';
import {
  PartnerProductsModule,
  ProductSubView,
} from './components/mobile/PartnerProductsModule.tsx';
import {
  FinanceSubScreen,
  PartnerFinanceScreens,
} from './components/mobile/PartnerFinanceScreens.tsx';
import {
  PartnerProfileScreens,
  ProfileSubScreen,
} from './components/mobile/PartnerProfileScreens.tsx';

export type BottomTabId = 'HOME' | 'ORDERS' | 'PRODUCTS' | 'EARNINGS' | 'PROFILE';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  // Auth Flow State (Screens 1-4: Splash, Login, Shop Registration, OTP Verification)
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authStep, setAuthStep] = useState<AuthScreenStep>('SPLASH');
  const [loginPhone, setLoginPhone] = useState('+91 98640 11022');

  // Exact 5 Bottom Navigation Tabs: Home, Orders, Products, Earnings, Profile
  const [activeTab, setActiveTab] = useState<BottomTabId>('HOME');
  const [orderSubView, setOrderSubView] = useState<OrderSubView>({ type: 'LIST' });
  const [productSubView, setProductSubView] = useState<ProductSubView>({ type: 'LIST' });
  const [financeSubScreen, setFinanceSubScreen] = useState<FinanceSubScreen>('EARNINGS');
  const [profileSubScreen, setProfileSubScreen] = useState<ProfileSubScreen>('PROFILE');

  // Responsive Android Screen Width Calibration (320, 360, 375, 390, 412, 430, or 100% Fluid)
  const [viewportPreset, setViewportPreset] = useState<
    'FLUID' | '320' | '360' | '375' | '390' | '412' | '430'
  >('FLUID');

  // Clearly Labelled Demo Mode Store State
  const [shopProfile, setShopProfile] = useState<DemoShopProfile>(INITIAL_DEMO_PROFILE);
  const [products, setProducts] = useState<DemoPartnerProduct[]>(INITIAL_DEMO_PRODUCTS);
  const [orders, setOrders] = useState<DemoOrder[]>(INITIAL_DEMO_ORDERS);
  const [customers] = useState(INITIAL_DEMO_CUSTOMERS);
  const [plans] = useState(INITIAL_DEMO_PLANS);
  const [subscriptionPayments, setSubscriptionPayments] = useState<DemoSubscriptionPayment[]>(
    INITIAL_DEMO_SUB_PAYMENTS
  );
  const [withdrawals, setWithdrawals] = useState<DemoWithdrawalRequest[]>(
    INITIAL_DEMO_WITHDRAWALS
  );
  const [messages, setMessages] = useState<DemoChatMessage[]>(INITIAL_DEMO_CHAT);
  const [settings, setSettings] = useState<DemoPartnerSettings>({
    pushOrderAlerts: true,
    lowStockAlerts: true,
    codEnabled: true,
    autoAcceptOrders: false,
    vacationMode: false,
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  const activePlan =
    plans.find((p) => p.id === shopProfile.activePlanId) || plans[1];

  // Demo Mode Actions
  const handleAddProduct = (
    payload: Omit<DemoPartnerProduct, 'id' | 'sku' | 'imageUrl'>
  ) => {
    const newItem: DemoPartnerProduct = {
      ...payload,
      id: `prod_${Date.now()}`,
      sku: `SMS-${Math.floor(1000 + Math.random() * 9000)}`,
      imageUrl: CATEGORY_IMAGE_FALLBACK[payload.category],
    };
    setProducts((prev) => [newItem, ...prev]);
  };

  const handleUpdateProduct = (
    id: string,
    updates: Partial<DemoPartnerProduct>
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateStock = (id: string, stock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, stock) } : p))
    );
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: DemoOrderStatus,
    note?: string
  ) => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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
                  note:
                    note ||
                    `Order status changed to ${status.replace(/_/g, ' ')} (Demo)`,
                },
              ],
            }
          : o
      )
    );
  };

  const handleAssignDelivery = (
    orderId: string,
    riderName: string,
    courierName: string
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, riderName, courierName } : o
      )
    );
  };

  const handleSwitchPlanDemo = (planId: 'starter' | 'growth' | 'enterprise') => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    setShopProfile((prev) => ({ ...prev, activePlanId: planId }));
    setSubscriptionPayments((prev) => [
      {
        id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        planName: `${plan.name} (Demo Simulation)`,
        amountInr: plan.monthlyPriceInr,
        date: 'Today (Demo)',
        mode: 'Demo Mode — No Real Charge',
        status: 'DEMO_RECORDED',
      },
      ...prev,
    ]);
  };

  const handleRequestWithdrawalDemo = (amountInr: number) => {
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
  };

  const handleSendChat = (text: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        customerId: 'cust_01',
        customerName: 'Ananya Borgohain',
        sender: 'SELLER',
        text,
        timestamp: time,
      },
    ]);
  };

  // Back Stack Navigation
  const canGoBack =
    !isAuthenticated
      ? authStep !== 'SPLASH'
      : (activeTab === 'ORDERS' && orderSubView.type !== 'LIST') ||
        (activeTab === 'PRODUCTS' && productSubView.type !== 'LIST') ||
        (activeTab === 'EARNINGS' && financeSubScreen !== 'EARNINGS') ||
        (activeTab === 'PROFILE' && profileSubScreen !== 'PROFILE');

  const handleBack = () => {
    if (!isAuthenticated) {
      if (authStep === 'OTP') setAuthStep('LOGIN');
      else if (authStep === 'REGISTER') setAuthStep('LOGIN');
      else if (authStep === 'LOGIN') setAuthStep('SPLASH');
      return;
    }
    if (activeTab === 'ORDERS' && orderSubView.type !== 'LIST') {
      setOrderSubView({ type: 'LIST' });
      return;
    }
    if (activeTab === 'PRODUCTS' && productSubView.type !== 'LIST') {
      setProductSubView({ type: 'LIST' });
      return;
    }
    if (activeTab === 'EARNINGS' && financeSubScreen !== 'EARNINGS') {
      setFinanceSubScreen('EARNINGS');
      return;
    }
    if (activeTab === 'PROFILE' && profileSubScreen !== 'PROFILE') {
      setProfileSubScreen('PROFILE');
      return;
    }
  };

  const selectTab = (tab: BottomTabId) => {
    setActiveTab(tab);
    setOrderSubView({ type: 'LIST' });
    setProductSubView({ type: 'LIST' });
    setFinanceSubScreen('EARNINGS');
    setProfileSubScreen('PROFILE');
  };

  // Header Title Logic across all 22 screens
  const getHeader = (): { title: string; subtitle: string } => {
    if (!isAuthenticated) {
      if (authStep === 'LOGIN') return { title: 'Partner Login', subtitle: 'SANJIT SHOP PARTNER' };
      if (authStep === 'REGISTER') return { title: 'Shop Registration', subtitle: 'SANJIT MUSICAL STORE' };
      return { title: 'OTP Verification', subtitle: `Code sent to ${loginPhone}` };
    }
    if (activeTab === 'HOME') {
      return {
        title: 'SANJIT SHOP PARTNER',
        subtitle: `${shopProfile.shopName} · Demo Mode`,
      };
    }
    if (activeTab === 'ORDERS') {
      if (orderSubView.type === 'DETAILS')
        return { title: `Order Details · ${orderSubView.orderId}`, subtitle: shopProfile.shopName };
      if (orderSubView.type === 'TRACKING')
        return { title: `Order Tracking · ${orderSubView.orderId}`, subtitle: 'Live Delivery Milestones' };
      if (orderSubView.type === 'CUSTOMER')
        return { title: 'Customer Details', subtitle: 'Verified Buyer History' };
      return { title: 'Orders', subtitle: `${orders.length} demo orders` };
    }
    if (activeTab === 'PRODUCTS') {
      if (productSubView.type === 'ADD_EDIT')
        return {
          title: productSubView.productId ? 'Edit Product' : 'Add Product',
          subtitle: shopProfile.shopName,
        };
      if (productSubView.type === 'INVENTORY')
        return { title: 'Inventory Management', subtitle: `${products.length} SKUs tracked` };
      return { title: 'Products', subtitle: `${products.length} sample & partner SKUs` };
    }
    if (activeTab === 'EARNINGS') {
      if (financeSubScreen === 'SALES_REPORTS')
        return { title: 'Sales Reports', subtitle: '7-Day Demo Analytics' };
      if (financeSubScreen === 'COMMISSION')
        return { title: 'Platform Commission', subtitle: `${activePlan.commissionPercent}% Plan Rate` };
      if (financeSubScreen === 'SUB_PLANS')
        return { title: 'Subscription Plans', subtitle: 'Demo Mode Preview' };
      if (financeSubScreen === 'SUB_PAYMENTS')
        return { title: 'Subscription Payments', subtitle: 'Demo Billing History' };
      if (financeSubScreen === 'WITHDRAWALS')
        return { title: 'Withdrawal Requests', subtitle: 'Demo Payout Simulator' };
      return { title: 'Earnings', subtitle: `${activePlan.name} · Demo Ledger` };
    }
    if (profileSubScreen === 'CHAT')
      return { title: 'Customer Chat', subtitle: shopProfile.shopName };
    if (profileSubScreen === 'DELIVERY')
      return { title: 'Delivery Management', subtitle: 'Own Riders & Courier AWB' };
    if (profileSubScreen === 'SETTINGS')
      return { title: 'App Settings', subtitle: 'SANJIT SHOP PARTNER' };
    if (profileSubScreen === 'APK_BUILD_GUIDE')
      return { title: 'Android APK & Widths', subtitle: 'in.sanjitmusical.shoppartner' };
    return { title: 'Shop Profile', subtitle: `${shopProfile.city}, ${shopProfile.state}` };
  };

  const header = getHeader();
  const validOrders = orders.filter((o) => o.status !== 'REJECTED');
  const grossSales = validOrders.reduce((s, o) => s + o.subtotalInr, 0);
  const totalCommission = validOrders.reduce((s, o) => s + o.commissionInr, 0);
  const netEarnings = grossSales - totalCommission;
  const newOrdersCount = orders.filter((o) => o.status === 'NEW').length;
  const lowStockProducts = products.filter(
    (p) => p.stock <= p.lowStockThreshold
  );

  const viewportStyle =
    viewportPreset === 'FLUID'
      ? undefined
      : { maxWidth: `${viewportPreset}px`, margin: '0 auto' };

  return (
    <div
      style={viewportStyle}
      className="w-full min-h-dvh flex flex-col overflow-x-hidden bg-[#F7F5FC] dark:bg-[#120924]"
    >
      <SafeAreaView onSwipeBack={canGoBack ? handleBack : undefined}>
        <StatusBar
          storeName="SANJIT SHOP PARTNER"
          syncStatus={
            viewportPreset === 'FLUID'
              ? 'Demo · 5G'
              : `${viewportPreset}px Android`
          }
        />

        {/* Hide Top Bar on Splash Screen */}
        {(!isAuthenticated && authStep === 'SPLASH') ? null : (
          <MobileStackHeader
            title={header.title}
            subtitle={header.subtitle}
            onBack={canGoBack ? handleBack : undefined}
            rightAction={
              <div className="flex flex-row items-center gap-1">
                {isAuthenticated && (
                  <button
                    type="button"
                    aria-label="Android Screen Widths & APK Guide"
                    onClick={() => {
                      setActiveTab('PROFILE');
                      setProfileSubScreen('APK_BUILD_GUIDE');
                    }}
                    className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-amber-300 hover:bg-white/10 active:scale-95 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Toggle Dark Mode"
                  onClick={() => setIsDark(!isDark)}
                  className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-white hover:bg-white/10 active:scale-95 cursor-pointer"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Moon className="w-4 h-4 text-purple-200" />
                  )}
                </button>
              </div>
            }
          />
        )}

        {/* Auth Screens 1-4 OR Authenticated 5-Tab Mobile App */}
        {!isAuthenticated ? (
          <PartnerAuthFlow
            step={authStep}
            onSetStep={setAuthStep}
            phone={loginPhone}
            onSetPhone={setLoginPhone}
            onRegisterShop={(payload) => {
              setShopProfile((prev) => ({
                ...prev,
                shopName: payload.shopName,
                ownerName: payload.ownerName,
                phone: payload.phone,
                city: payload.city,
                gstNumber: payload.gstNumber || prev.gstNumber,
              }));
            }}
            onVerifiedSuccess={() => setIsAuthenticated(true)}
          />
        ) : (
          <>
            <main className="flex-1 w-full flex flex-col min-w-0 overflow-x-hidden">
              {/* Screen 5: Seller Dashboard (Home Tab) */}
              {activeTab === 'HOME' && (
                <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Demo Mode Active:</strong> Test all 22 seller screens & 15 sample products. Demo payouts & orders are simulated (not live charges).
                    </span>
                  </div>

                  {/* Royal Purple & Gold Partner Dashboard Banner */}
                  <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#5B21B6] p-4 text-white shadow-md border border-amber-400/35 gap-3">
                    <div className="flex flex-row items-center gap-3 min-w-0">
                      <img
                        src={APP_ICON_URL}
                        alt="Sanjit Shop Partner"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl border border-amber-300/60 object-cover shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] font-bold tracking-widest text-amber-300">
                          SANJIT MUSICAL STORE · PARTNER
                        </span>
                        <Text
                          numberOfLines={1}
                          className="text-base font-extrabold text-white"
                        >
                          {shopProfile.shopName}
                        </Text>
                        <span className="text-[11px] text-purple-200 truncate">
                          {shopProfile.city}, {shopProfile.state} · {activePlan.name}
                        </span>
                      </div>
                    </div>

                    <div className="h-px w-full bg-white/15" />

                    <div className="flex flex-row items-end justify-between gap-2 flex-wrap">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-purple-200">
                          Net Demo Earnings
                        </span>
                        <span className="text-2xl font-extrabold font-mono-tabular text-white">
                          ₹{netEarnings.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] text-purple-200">
                          Commission ({activePlan.commissionPercent}%)
                        </span>
                        <span className="text-sm font-extrabold font-mono-tabular text-amber-300">
                          ₹{totalCommission.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </View>

                  {/* 2x2 Mobile KPI Grid */}
                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    <button
                      type="button"
                      onClick={() => selectTab('ORDERS')}
                      className="min-h-[82px] p-3 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs flex flex-col justify-between text-left active:scale-[0.98] cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-purple-200">
                        New Orders
                      </span>
                      <span className="text-xl font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                        {newOrdersCount}
                      </span>
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-amber-300">
                        {orders.length} total orders
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab('PRODUCTS')}
                      className="min-h-[82px] p-3 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs flex flex-col justify-between text-left active:scale-[0.98] cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-purple-200">
                        Products
                      </span>
                      <span className="text-xl font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                        {products.length}
                      </span>
                      <span className="text-[11px] font-mono-tabular text-slate-500 dark:text-purple-300">
                        /{activePlan.productLimit} limit
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('PRODUCTS');
                        setProductSubView({ type: 'INVENTORY' });
                      }}
                      className="min-h-[82px] p-3 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs flex flex-col justify-between text-left active:scale-[0.98] cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-purple-200">
                        Low Stock
                      </span>
                      <span className="text-xl font-extrabold font-mono-tabular text-amber-600 dark:text-amber-400">
                        {lowStockProducts.length}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        Tap to restock
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('EARNINGS');
                        setFinanceSubScreen('SALES_REPORTS');
                      }}
                      className="min-h-[82px] p-3 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs flex flex-col justify-between text-left active:scale-[0.98] cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-purple-200">
                        Gross Sales
                      </span>
                      <span className="text-lg font-extrabold font-mono-tabular text-slate-900 dark:text-white truncate">
                        ₹{grossSales.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-amber-300">
                        Sales chart →
                      </span>
                    </button>
                  </div>

                  {/* Quick Partner Actions */}
                  <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">
                      Quick Partner Actions
                    </Text>
                    <div className="grid grid-cols-2 gap-2">
                      <TouchableOpacity
                        onPress={() => {
                          setActiveTab('PRODUCTS');
                          setProductSubView({ type: 'ADD_EDIT' });
                        }}
                        className="bg-[#4C1D95] text-amber-300 font-bold text-xs"
                      >
                        <PlusCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate">Add Product</span>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setActiveTab('PRODUCTS');
                          setProductSubView({ type: 'INVENTORY' });
                        }}
                        className="bg-amber-500 text-slate-950 font-extrabold text-xs"
                      >
                        <Layers className="w-4 h-4 shrink-0" />
                        <span className="truncate">Inventory</span>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setActiveTab('PROFILE');
                          setProfileSubScreen('DELIVERY');
                        }}
                        className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 font-bold text-xs"
                      >
                        <Truck className="w-4 h-4 shrink-0" />
                        <span className="truncate">Delivery Desk</span>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setActiveTab('PROFILE');
                          setProfileSubScreen('CHAT');
                        }}
                        className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 font-bold text-xs"
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span className="truncate">Customer Chat</span>
                      </TouchableOpacity>
                    </div>
                  </View>

                  {/* Low Stock Spotlight */}
                  {lowStockProducts.length > 0 && (
                    <View className="w-full bg-amber-50/90 dark:bg-amber-950/30 rounded-2xl p-3.5 border border-amber-300/70 dark:border-amber-700/50 gap-2">
                      <div className="flex flex-row items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Low Stock Alert ({lowStockProducts.length} SKUs)</span>
                      </div>
                      {lowStockProducts.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#1E1136] border border-amber-200/80 dark:border-amber-800/50 flex flex-row items-center justify-between gap-2.5"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                            <RNImage
                              source={item.imageUrl}
                              alt={item.name}
                              fallbackCategory={item.category}
                            />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <Text
                              numberOfLines={1}
                              className="text-xs font-bold text-slate-900 dark:text-white"
                            >
                              {item.name}
                            </Text>
                            <span className="text-[11px] font-mono-tabular text-amber-700 dark:text-amber-300">
                              Stock: {item.stock} left
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item.id, item.stock + 5)}
                            className="min-h-[38px] px-3 rounded-xl bg-[#4C1D95] text-amber-300 text-xs font-bold shrink-0 cursor-pointer"
                          >
                            +5 Stock
                          </button>
                        </div>
                      ))}
                    </View>
                  )}

                  {/* Recent Orders */}
                  <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
                    <div className="flex flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-slate-900 dark:text-white">
                        Recent Orders
                      </Text>
                      <button
                        type="button"
                        onClick={() => selectTab('ORDERS')}
                        className="text-xs font-bold text-purple-800 dark:text-amber-300 cursor-pointer"
                      >
                        See All ({orders.length})
                      </button>
                    </div>
                    <div className="flex flex-col divide-y divide-purple-100 dark:divide-purple-900/50">
                      {orders.slice(0, 3).map((ord) => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('ORDERS');
                            setOrderSubView({ type: 'DETAILS', orderId: ord.id });
                          }}
                          className="w-full min-h-[60px] py-2.5 flex flex-row items-center justify-between gap-2 text-left cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-purple-900 dark:text-amber-300 font-mono-tabular truncate">
                              {ord.id} · {ord.customerName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-purple-300 truncate">
                              {ord.items[0]?.name} · {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex flex-row items-center gap-1 shrink-0">
                            <span className="text-xs font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                              ₹{ord.subtotalInr.toLocaleString('en-IN')}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </View>

                  {/* Direct Download Complete React Native + Expo Android ZIP */}
                  <a
                    href="/api/v1/download/expo-android-zip"
                    download="sanjit-shop-partner-expo-android.zip"
                    className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex flex-row items-center justify-between gap-2 shadow-sm active:scale-[0.99] transition-transform"
                  >
                    <span className="flex flex-row items-center gap-2 min-w-0">
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="truncate">Download Complete Expo Android Source (.ZIP)</span>
                    </span>
                    <span className="font-mono-tabular text-[10px] shrink-0">30 Files + CI</span>
                  </a>

                  {/* Auth Flow & All-22-Screen Quick Access Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthenticated(false);
                      setAuthStep('SPLASH');
                    }}
                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-purple-100/80 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex flex-row items-center justify-between text-xs font-bold text-purple-950 dark:text-amber-300 cursor-pointer"
                  >
                    <span className="flex flex-row items-center gap-2">
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      <span>Preview Onboarding (Splash · Login · Register · OTP)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </ScrollView>
              )}

              {/* Screens 9, 10, 11, 12 (Orders Tab) */}
              {activeTab === 'ORDERS' && (
                <PartnerOrdersModule
                  orders={orders}
                  customers={customers}
                  subView={orderSubView}
                  onSetSubView={setOrderSubView}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onOpenChat={() => {
                    setActiveTab('PROFILE');
                    setProfileSubScreen('CHAT');
                  }}
                />
              )}

              {/* Screens 6, 7, 8 (Products Tab) */}
              {activeTab === 'PRODUCTS' && (
                <PartnerProductsModule
                  products={products}
                  subView={productSubView}
                  onSetSubView={setProductSubView}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onUpdateStock={handleUpdateStock}
                />
              )}

              {/* Screens 13, 14, 15, 16, 17, 18 (Earnings Tab) */}
              {activeTab === 'EARNINGS' && (
                <PartnerFinanceScreens
                  subScreen={financeSubScreen}
                  onSetSubScreen={setFinanceSubScreen}
                  orders={orders}
                  shopProfile={shopProfile}
                  plans={plans}
                  subscriptionPayments={subscriptionPayments}
                  withdrawals={withdrawals}
                  onSwitchPlanDemo={handleSwitchPlanDemo}
                  onRequestWithdrawalDemo={handleRequestWithdrawalDemo}
                />
              )}

              {/* Screens 19, 20, 21, 22 + APK Guide (Profile Tab) */}
              {activeTab === 'PROFILE' && (
                <PartnerProfileScreens
                  subScreen={profileSubScreen}
                  onSetSubScreen={setProfileSubScreen}
                  shopProfile={shopProfile}
                  settings={settings}
                  orders={orders}
                  messages={messages}
                  onUpdateProfile={(u) =>
                    setShopProfile((prev) => ({ ...prev, ...u }))
                  }
                  onUpdateSettings={(u) =>
                    setSettings((prev) => ({ ...prev, ...u }))
                  }
                  onSendChat={handleSendChat}
                  onAssignDelivery={handleAssignDelivery}
                  onOpenOrderTracking={(orderId) => {
                    setActiveTab('ORDERS');
                    setOrderSubView({ type: 'TRACKING', orderId });
                  }}
                  onLogout={() => {
                    setIsAuthenticated(false);
                    setAuthStep('LOGIN');
                  }}
                  viewportPreset={viewportPreset}
                  onSetViewportPreset={setViewportPreset}
                />
              )}
            </main>

            {/* Exact 5 Mobile Bottom Navigation Tabs: Home, Orders, Products, Earnings, Profile */}
            <nav
              aria-label="Mobile Bottom Tabs"
              style={viewportStyle}
              className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#190D2E]/95 backdrop-blur-md border-t border-purple-200/80 dark:border-purple-900/80 grid grid-cols-5 items-center px-1 select-none"
            >
              {(
                [
                  { id: 'HOME', label: 'Home', icon: Home },
                  { id: 'ORDERS', label: 'Orders', icon: ClipboardList },
                  { id: 'PRODUCTS', label: 'Products', icon: Package },
                  { id: 'EARNINGS', label: 'Earnings', icon: Wallet },
                  { id: 'PROFILE', label: 'Profile', icon: UserCircle },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                      active
                        ? 'text-[#4C1D95] dark:text-amber-300 font-bold'
                        : 'text-slate-500 dark:text-purple-300 font-medium'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] tracking-tight truncate max-w-full">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </SafeAreaView>
    </div>
  );
}
