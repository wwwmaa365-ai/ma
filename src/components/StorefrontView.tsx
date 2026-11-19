import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  ShoppingBag,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  Play,
  Plus,
  Minus,
  Trash2,
  FileText,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  CategoryNode,
  TenantStore,
  ProductItem,
  CouponCode,
  OrderRecord,
} from '../types/platform.ts';
import { ResilientImage } from './ResilientImage.tsx';
import { syncOrderToFirestore } from '../lib/firebase.ts';

interface CartEntry {
  product: ProductItem;
  variantLabel: string;
  priceInr: number;
  quantity: number;
}

interface StorefrontViewProps {
  tenant: TenantStore;
  categories: CategoryNode[];
  products: ProductItem[];
  coupons: CouponCode[];
  orders: OrderRecord[];
  onRefreshTenantData: () => Promise<void>;
  onOpenChatWithSeller: (orderId?: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  tenant,
  categories,
  products,
  coupons,
  orders,
  onRefreshTenantData,
  onOpenChatWithSeller,
}) => {
  const [deviceView, setDeviceView] = useState<'DESKTOP_WEB' | 'MOBILE_APP'>('DESKTOP_WEB');
  const [selectedLocation, setSelectedLocation] = useState<string>(
    `${tenant.city}, ${tenant.state} (781005)`
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('ALL');
  const [collectionTab, setCollectionTab] = useState<
    'ALL' | 'TRENDING' | 'BESTSELLERS' | 'NEW_ARRIVALS' | 'FESTIVAL'
  >('ALL');

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [showVideoPlayer, setShowVideoPlayer] = useState<boolean>(false);

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState<string>('Pranjal Kalita');
  const [customerPhone, setCustomerPhone] = useState<string>('+91 98641 55210');
  const [customerEmail, setCustomerEmail] = useState<string>('pranjal.kalita@assammusic.org');
  const [shippingAddress, setShippingAddress] = useState<string>(
    'House 42, Srimanta Sankardev Path, Beltola Survey'
  );
  const [shippingCity, setShippingCity] = useState<string>('Guwahati, Assam');
  const [shippingPincode, setShippingPincode] = useState<string>('781028');
  const [paymentMethod, setPaymentMethod] = useState<
    'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'NETBANKING' | 'COD'
  >('RAZORPAY_UPI');
  const [deliveryMode, setDeliveryMode] = useState<'OWN_DELIVERY' | 'COURIER_DELIVERY'>(
    tenant.deliveryConfig.ownDeliveryEnabled ? 'OWN_DELIVERY' : 'COURIER_DELIVERY'
  );
  const [checkoutSubmitting, setCheckoutSubmitting] = useState<boolean>(false);
  const [checkoutBanner, setCheckoutBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Razorpay Server-Side Webhook Handshake State
  const [pendingWebhookHandshake, setPendingWebhookHandshake] = useState<{
    order: OrderRecord;
    razorpayOrderId: string;
    merchantId: string;
    upiVpa: string;
    webhookTestPayload: Record<string, unknown>;
    webhookHmacSignature: string;
  } | null>(null);
  const [webhookStatusMsg, setWebhookStatusMsg] = useState<string>('');

  // Selected Order for Invoice or Live Tracking Modal
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<OrderRecord | null>(null);
  const [activeCustomerTab, setActiveCustomerTab] = useState<
    'CATALOG' | 'MY_ORDERS' | 'WISHLIST' | 'ACCOUNT'
  >('CATALOG');

  const activeCategoryObj = useMemo(
    () => categories.find((c) => c.name === activeCategory),
    [categories, activeCategory]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'ALL' && p.category !== activeCategory) return false;
      if (activeSubcategory !== 'ALL' && p.subcategory !== activeSubcategory) return false;
      if (collectionTab === 'TRENDING' && !p.isTrending) return false;
      if (collectionTab === 'BESTSELLERS' && !p.isBestSeller) return false;
      if (collectionTab === 'NEW_ARRIVALS' && !p.isNewArrival) return false;
      if (collectionTab === 'FESTIVAL' && !p.isFestivalOffer) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSub = p.subcategory.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        return matchName || matchSub || matchCat || matchSku;
      }
      return true;
    });
  }, [products, activeCategory, activeSubcategory, collectionTab, searchQuery]);

  const handleOpenProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setSelectedVariantIdx(0);
    setActiveImageIdx(0);
    setShowVideoPlayer(false);
    setRecentlyViewedIds((prev) => [
      product.productId,
      ...prev.filter((id) => id !== product.productId),
    ].slice(0, 4));
  };

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const addToCart = (product: ProductItem, variantIdx = 0, openDrawer = true) => {
    const variant = product.variants[variantIdx] || {
      label: 'Standard Concert Edition',
      priceDeltaInr: 0,
    };
    const unitPrice = product.priceInr + (variant.priceDeltaInr || 0);
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.productId === product.productId && item.variantLabel === variant.label
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          product,
          variantLabel: variant.label,
          priceInr: unitPrice,
          quantity: 1,
        },
      ];
    });
    if (openDrawer) setIsCartOpen(true);
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const nextQty = copy[idx].quantity + delta;
      if (nextQty <= 0) {
        copy.splice(idx, 1);
      } else {
        copy[idx].quantity = nextQty;
      }
      return copy;
    });
  };

  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.priceInr * item.quantity, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (cartSubtotal < appliedCoupon.minOrderInr) return 0;
    return Math.min(
      appliedCoupon.maxDiscountInr,
      Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100)
    );
  }, [cartSubtotal, appliedCoupon]);

  const afterDiscount = Math.max(0, cartSubtotal - discountAmount);
  const deliveryFee =
    cart.length === 0
      ? 0
      : afterDiscount >= tenant.deliveryConfig.freeDeliveryThresholdInr
      ? 0
      : tenant.deliveryConfig.baseDeliveryFeeInr;
  const cartTotal = afterDiscount + deliveryFee;

  const handleApplyCoupon = () => {
    const found = coupons.find(
      (c) => c.active && c.code.toUpperCase() === couponInput.trim().toUpperCase()
    );
    if (!found) {
      setCheckoutBanner({
        type: 'error',
        text: `Coupon "${couponInput}" is not valid for ${tenant.storeName}. Try ${
          coupons[0]?.code || 'SANJIT10'
        }.`,
      });
      return;
    }
    if (cartSubtotal < found.minOrderInr) {
      setCheckoutBanner({
        type: 'error',
        text: `Minimum order of ₹${found.minOrderInr.toLocaleString('en-IN')} required for ${found.code}.`,
      });
      return;
    }
    setAppliedCoupon(found);
    setCheckoutBanner({
      type: 'success',
      text: `Coupon ${found.code} (${found.discountPercent}% off) applied!`,
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutSubmitting(true);
    setCheckoutBanner(null);

    try {
      const res = await fetch(`/api/v1/tenant/${tenant.tenantId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.tenantId,
        },
        body: JSON.stringify({
          customerId: 'cust_pranjal_01',
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress,
          shippingCity,
          shippingPincode,
          couponCode: appliedCoupon?.code,
          paymentMethod,
          deliveryMode,
          items: cart.map((c) => ({
            productId: c.product.productId,
            variantLabel: c.variantLabel,
            quantity: c.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutBanner({
          type: 'error',
          text: data.message || data.error || 'Checkout failed',
        });
        setCheckoutSubmitting(false);
        return;
      }

      // Sync to Firestore if signed in with Google
      await syncOrderToFirestore({
        orderId: data.order.orderId,
        tenantId: tenant.tenantId,
        sellerOwnerId: tenant.ownerId,
        totalInr: data.order.totalInr,
        paymentMethod,
      });

      setCart([]);
      setAppliedCoupon(null);
      await onRefreshTenantData();

      if (data.paymentGatewayHandshake) {
        setPendingWebhookHandshake({
          order: data.order,
          ...data.paymentGatewayHandshake,
        });
        setWebhookStatusMsg(
          'Order created with status PENDING & stock reserved. Verify payment via server-side HMAC-SHA256 webhook below.'
        );
      } else {
        setCheckoutBanner({
          type: 'success',
          text: `COD Order ${data.order.orderId} confirmed! Delivery OTP: ${data.order.deliveryOtp}.`,
        });
        setIsCartOpen(false);
        setActiveCustomerTab('MY_ORDERS');
      }
    } catch (err) {
      setCheckoutBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Network error during checkout',
      });
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const triggerRazorpayWebhookVerification = async (useTamperedSignature = false) => {
    if (!pendingWebhookHandshake) return;
    try {
      const res = await fetch('/api/v1/payments/razorpay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': useTamperedSignature
            ? 'forged_client_signature_00000'
            : pendingWebhookHandshake.webhookHmacSignature,
        },
        body: JSON.stringify(pendingWebhookHandshake.webhookTestPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        setWebhookStatusMsg(`[HTTP ${res.status}] ${data.error}: ${data.message}`);
        return;
      }
      setWebhookStatusMsg(
        `[HTTP 200 VERIFIED_PAID] Server-side HMAC-SHA256 webhook verified payment ${data.order.razorpayPaymentId}. Stock committed!`
      );
      await onRefreshTenantData();
    } catch (err) {
      setWebhookStatusMsg(err instanceof Error ? err.message : 'Webhook call failed');
    }
  };

  const handleCustomerOrderAction = async (
    orderId: string,
    nextStatus: 'CANCELLED' | 'RETURN_REQUESTED'
  ) => {
    await fetch(`/api/v1/tenant/${tenant.tenantId}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenant.tenantId,
      },
      body: JSON.stringify({
        status: nextStatus,
        note:
          nextStatus === 'CANCELLED'
            ? 'Cancelled by customer prior to dispatch; reserved stock restored.'
            : 'Customer requested return & refund inspection.',
      }),
    });
    await onRefreshTenantData();
  };

  return (
    <div className="space-y-8">
      {/* Sub-header Storefront Control Strip: Location, Search, Device Viewport Switcher, Customer Sub-tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Location Selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <select
              aria-label="Delivery Location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="Guwahati, Assam (781005)">Deliver to: Guwahati, Assam (781005)</option>
              <option value="Jorhat, Assam (785001)">Deliver to: Jorhat, Assam (785001)</option>
              <option value="Dibrugarh, Assam (786001)">Deliver to: Dibrugarh, Assam (786001)</option>
              <option value="Kolkata, West Bengal (700016)">Deliver to: Kolkata, WB (700016)</option>
              <option value="New Delhi, NCR (110001)">Deliver to: New Delhi (110001)</option>
            </select>
          </div>

          {/* Live Search Bar */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search guitars, tablas, DJ mixers, Bihu dresses in ${tenant.storeName}...`}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-amber-500 focus:outline-none text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Customer Account Sub-navigation & Web/Mobile App Preview Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveCustomerTab('CATALOG')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCustomerTab === 'CATALOG'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Store Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveCustomerTab('MY_ORDERS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCustomerTab === 'MY_ORDERS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Orders & Tracking ({orders.length})
            </button>
            <button
              onClick={() => setActiveCustomerTab('WISHLIST')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCustomerTab === 'WISHLIST'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Wishlist ({wishlistIds.length})
            </button>
            <button
              onClick={() => setActiveCustomerTab('ACCOUNT')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCustomerTab === 'ACCOUNT'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Profile & Privacy
            </button>
          </div>

          {/* Desktop Website vs Android/iOS Customer App Frame Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setDeviceView('DESKTOP_WEB')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                deviceView === 'DESKTOP_WEB'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop Web</span>
            </button>
            <button
              onClick={() => setDeviceView('MOBILE_APP')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                deviceView === 'MOBILE_APP'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android / iOS App</span>
            </button>
          </div>

          {/* Shopping Bag Drawer Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: tenant.accentColor }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 rounded-lg hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            <span className="font-mono-tabular">· ₹{cartSubtotal.toLocaleString('en-IN')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Container (Supports Full 1440px Desktop or White-Label Android/iOS Mobile App Frame) */}
      <div
        className={
          deviceView === 'MOBILE_APP'
            ? 'max-w-[430px] mx-auto border-4 border-slate-800 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-950 p-4 space-y-6'
            : 'space-y-8'
        }
      >
        {deviceView === 'MOBILE_APP' && (
          <div
            style={{ backgroundColor: tenant.primaryColor }}
            className="rounded-2xl p-3.5 text-white flex items-center justify-between"
          >
            <div>
              <div className="text-xs opacity-80">Expo White-Label Customer App</div>
              <div className="text-sm font-bold">{tenant.whiteLabelAppConfig.appDisplayName}</div>
              <div className="text-[11px] font-mono-tabular opacity-75">
                {tenant.whiteLabelAppConfig.packageIdentifier} · {tenant.whiteLabelAppConfig.lastBuildVersion}
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ backgroundColor: tenant.accentColor }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-950 whitespace-nowrap shrink-0"
            >
              Bag ({cart.reduce((a, b) => a + b.quantity, 0)})
            </button>
          </div>
        )}

        {/* TAB 1: STORE CATALOG */}
        {activeCustomerTab === 'CATALOG' && (
          <>
            {/* 1. Storefront Hero Banner (Split-Screen Campaign Anchor) */}
            <section
              style={{ backgroundColor: tenant.primaryColor }}
              className="rounded-2xl overflow-hidden border border-white/10 text-white grid grid-cols-1 lg:grid-cols-12 items-stretch"
            >
              <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Unboxed Metadata Line */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/90 font-medium">
                    <span>{tenant.customDomain}</span>
                    <span aria-hidden="true">·</span>
                    <span>GST Verified: {tenant.gstNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>Free Insured Delivery above ₹{tenant.deliveryConfig.freeDeliveryThresholdInr.toLocaleString('en-IN')}</span>
                  </div>

                  <h1
                    className="font-serif-display font-bold tracking-tight text-white"
                    style={{
                      fontSize:
                        deviceView === 'MOBILE_APP' ? '2rem' : 'clamp(2.25rem, 3.8vw, 3.5rem)',
                      lineHeight: 1.12,
                      textWrap: 'balance',
                    }}
                  >
                    {tenant.tagline}
                  </h1>

                  <p className="text-sm lg:text-base text-slate-200/90 max-w-2xl leading-relaxed">
                    {tenant.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => {
                      setActiveCategory('ALL');
                      setCollectionTab('ALL');
                    }}
                    style={{ backgroundColor: tenant.accentColor }}
                    className="px-6 py-3 rounded-lg text-sm font-semibold text-slate-950 hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
                  >
                    Explore Concert Collection
                  </button>
                  <button
                    onClick={() => onOpenChatWithSeller()}
                    className="px-5 py-3 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    Ask Store Luthier / Stylist
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-[360px]">
                <ResilientImage
                  src={tenant.bannerUrl}
                  alt={tenant.storeName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6">
                  <div className="text-xs text-slate-200">
                    <span>{tenant.storeName} Showroom</span>
                    <span aria-hidden="true"> · </span>
                    <span>{tenant.address}, {tenant.city}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Interactive Category & Subcategory Taxonomy Bar */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <button
                    onClick={() => {
                      setActiveCategory('ALL');
                      setActiveSubcategory('ALL');
                    }}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      activeCategory === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.name);
                        setActiveSubcategory('ALL');
                      }}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        activeCategory === cat.name
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Curated Collection Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  {(
                    [
                      { id: 'ALL', label: 'All Items' },
                      { id: 'TRENDING', label: 'Trending' },
                      { id: 'BESTSELLERS', label: 'Best-Selling' },
                      { id: 'NEW_ARRIVALS', label: 'New Arrivals' },
                      { id: 'FESTIVAL', label: 'Festival Offers' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCollectionTab(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        collectionTab === tab.id
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory Filter Bar when a Master Category is selected */}
              {activeCategoryObj && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <button
                    onClick={() => setActiveSubcategory('ALL')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                      activeSubcategory === 'ALL'
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All {activeCategoryObj.name} ({activeCategoryObj.subcategories.length})
                  </button>
                  {activeCategoryObj.subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubcategory(sub)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                        activeSubcategory === sub
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* 3. Featured Collection Product Grid (Uniform 3-Column Layout, Unboxed Metadata) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif-display font-bold text-slate-900 dark:text-white">
                    {activeCategory === 'ALL' ? 'Curated Store Catalogue' : activeCategory}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span>Tenant ID: {tenant.tenantId}</span>
                    <span aria-hidden="true"> · </span>
                    <span>Showing {filteredProducts.length} verified instruments & costumes</span>
                    <span aria-hidden="true"> · </span>
                    <span>Coupon code {coupons[0]?.code || 'SANJIT10'} active at checkout</span>
                  </p>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
                  <p className="text-base font-medium text-slate-800 dark:text-slate-200">
                    No matching products in {tenant.storeName} for this filter.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Reset category filters or switch to another tenant store in the workspace switcher above.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('ALL');
                      setActiveSubcategory('ALL');
                      setCollectionTab('ALL');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div
                  className={
                    deviceView === 'MOBILE_APP'
                      ? 'grid grid-cols-1 gap-5'
                      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7'
                  }
                >
                  {filteredProducts.map((product) => {
                    const isWished = wishlistIds.includes(product.productId);
                    return (
                      <article
                        key={product.productId}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div>
                          {/* 4:3 Product Imagery Slot */}
                          <div
                            onClick={() => handleOpenProduct(product)}
                            className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                          >
                            <ResilientImage
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <button
                              type="button"
                              aria-label="Toggle Wishlist"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(product.productId);
                              }}
                              className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-slate-950/70 text-white flex items-center justify-center hover:bg-slate-950 transition-colors"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isWished ? 'fill-rose-500 text-rose-500' : 'text-white'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Card Body with Zero-Pill Unboxed Metadata */}
                          <div className="p-5 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span>{product.subcategory}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular">★ {product.rating} ({product.reviewCount})</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  product.stock <= product.lowStockThreshold
                                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }
                              >
                                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                              </span>
                            </div>

                            <h3
                              onClick={() => handleOpenProduct(product)}
                              className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                            >
                              {product.name}
                            </h3>

                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                        </div>

                        {/* Price Baseline & Quick Actions */}
                        <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-lg font-bold font-mono-tabular text-slate-900 dark:text-white">
                              ₹{product.priceInr.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-slate-400 font-mono-tabular">
                              <span className="line-through">
                                ₹{product.mrpInr.toLocaleString('en-IN')}
                              </span>
                              <span aria-hidden="true"> · </span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Save {product.discountPercent}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenProduct(product)}
                              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              disabled={product.stock <= 0}
                              onClick={() => addToCart(product, 0, true)}
                              style={{ backgroundColor: tenant.accentColor }}
                              className="px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-950 hover:opacity-95 disabled:opacity-40 transition-opacity whitespace-nowrap shrink-0"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 4. Craftsmanship & Recently Viewed Strip (Section Ceiling <= 4 sections) */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Luthier & Atelier Certified Quality</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Every acoustic guitar, tabla pair, DJ mixer, and stitched classical dance costume is inspected and certified prior to dispatch from {tenant.storeName}.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span>Own Fleet OTP & Insured Courier Delivery</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Track live GPS delivery coordinates or Shiprocket / Delhivery AWB milestones with 4-digit OTP handover protection.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>Server-Verified Razorpay UPI & GST Invoice</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Instant GST tax invoice generation ({tenant.gstNumber}) with HMAC-SHA256 verified Razorpay UPI, Cards, Netbanking, and Cash on Delivery.
                  </p>
                </div>
              </div>

              {recentlyViewedIds.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Recently Viewed in this Session:
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {recentlyViewedIds.map((id) => {
                      const prod = products.find((p) => p.productId === id);
                      if (!prod) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => handleOpenProduct(prod)}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                        >
                          {prod.name.slice(0, 42)}...
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* TAB 2: MY ORDERS, LIVE DELIVERY TRACKING, INVOICES, RETURNS */}
        {activeCustomerTab === 'MY_ORDERS' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif-display font-bold text-slate-900 dark:text-white">
                  My Orders & Live Shipment Tracking ({tenant.storeName})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  View real-time GPS checkpoints, 4-digit Delivery OTP, GST tax invoices, or request cancellations and returns.
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No orders placed yet in {tenant.storeName}.
                </p>
                <button
                  onClick={() => setActiveCustomerTab('CATALOG')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950"
                >
                  Browse Store Catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                            {ord.orderId}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">Invoice: {ord.invoiceNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>{new Date(ord.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          <span>Status: </span>
                          <strong className="text-amber-600 dark:text-amber-400">{ord.status}</strong>
                          <span aria-hidden="true"> · </span>
                          <span>Payment: </span>
                          <strong
                            className={
                              ord.paymentStatus === 'VERIFIED_PAID'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-500'
                            }
                          >
                            {ord.paymentStatus} ({ord.paymentMethod})
                          </strong>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono-tabular">
                            Delivery Handover OTP: <strong>{ord.deliveryOtp}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setActiveInvoiceOrder(ord)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                        >
                          View GST Invoice
                        </button>
                        <button
                          onClick={() => onOpenChatWithSeller(ord.orderId)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                        >
                          Chat Seller About Order
                        </button>
                        {ord.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCustomerOrderAction(ord.orderId, 'CANCELLED')}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-500 whitespace-nowrap shrink-0"
                          >
                            Cancel Order
                          </button>
                        )}
                        {ord.status === 'DELIVERED' && (
                          <button
                            onClick={() =>
                              handleCustomerOrderAction(ord.orderId, 'RETURN_REQUESTED')
                            }
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 whitespace-nowrap shrink-0"
                          >
                            Request Return / Refund
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items & Totals */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-7 space-y-2">
                        {ord.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/60"
                          >
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {item.name}
                              </div>
                              <div className="text-slate-500">
                                Variant: {item.variantLabel} · Qty: {item.quantity}
                              </div>
                            </div>
                            <div className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                              ₹{item.totalPriceInr.toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                          <span>Total Amount (incl. GST ₹{ord.gstAmountInr.toLocaleString('en-IN')})</span>
                          <span className="font-mono-tabular">
                            ₹{ord.totalInr.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Live Delivery Tracking Timeline */}
                      <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2.5">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>
                            Live Dispatch ({ord.deliveryMode === 'OWN_DELIVERY' ? `Partner: ${ord.assignedPartnerName || 'Assigned'}` : `${ord.courierProvider} AWB: ${ord.awbNumber}`})
                          </span>
                          <span className="font-mono-tabular text-[11px] text-slate-500">
                            GPS: {ord.trackingLocation.lat.toFixed(4)}, {ord.trackingLocation.lng.toFixed(4)}
                          </span>
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Current Checkpoint: {ord.trackingLocation.currentHub}
                        </div>
                        <div className="space-y-2 pt-1">
                          {ord.trackingHistory.map((h, i) => (
                            <div key={i} className="text-[11px] text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {h.status}
                              </span>
                              <span> · {h.location} · </span>
                              <span className="text-slate-400">{h.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: WISHLIST */}
        {activeCustomerTab === 'WISHLIST' && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-serif-display font-bold text-slate-900 dark:text-white">
              Saved Wishlist ({wishlistIds.length})
            </h2>
            {wishlistIds.length === 0 ? (
              <p className="text-xs text-slate-500">
                Click the heart icon on any instrument or dance costume to save it to your wishlist.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products
                  .filter((p) => wishlistIds.includes(p.productId))
                  .map((p) => (
                    <div
                      key={p.productId}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {p.name}
                        </div>
                        <div className="text-xs font-mono-tabular text-amber-500">
                          ₹{p.priceInr.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(p, 0, true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 whitespace-nowrap shrink-0"
                      >
                        Move to Cart
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: CUSTOMER ACCOUNT, SAVED ADDRESSES & PRIVACY CONTROLS */}
        {activeCustomerTab === 'ACCOUNT' && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Customer Profile & Saved Delivery Addresses
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone (OTP Verified)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Primary Delivery Address</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Privacy & PII Isolation Controls
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your contact and address PII is isolated inside `/users/&#123;userId&#125;/private/info` in Firestore and scoped exclusively to your verified account and the active seller store fulfilling your order.
              </p>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Receive FCM Push & SMS OTP alerts for live shipment milestones</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Allow store luthier/tailor to message me regarding custom sizing or tuning</span>
                </label>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* CONTIGUOUS PRODUCT DETAIL MODAL (PDP) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>{selectedProduct.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{selectedProduct.subcategory}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono-tabular">SKU: {selectedProduct.sku}</span>
                </div>
                <h2 className="text-2xl font-serif-display font-bold text-slate-900 dark:text-white mt-1">
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Multi-Image Gallery & Video Preview */}
              <div className="lg:col-span-6 space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  {showVideoPlayer ? (
                    <div className="w-full h-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <Play className="w-10 h-10 text-amber-400" />
                      <div className="text-sm font-semibold">
                        {selectedProduct.videoPreviewTitle || 'Studio Acoustic & Craftsmanship Demo'}
                      </div>
                      <p className="text-xs text-slate-400">
                        48kHz / 24-bit Direct Studio Mic Recording — Verified by {tenant.storeName}
                      </p>
                      <button
                        onClick={() => setShowVideoPlayer(false)}
                        className="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20"
                      >
                        Back to High-Res Photos
                      </button>
                    </div>
                  ) : (
                    <ResilientImage
                      src={selectedProduct.images[activeImageIdx] || selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedProduct.images.map((imgUrl, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowVideoPlayer(false);
                        setActiveImageIdx(i);
                      }}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 ${
                        !showVideoPlayer && activeImageIdx === i
                          ? 'border-amber-500'
                          : 'border-transparent opacity-70'
                      }`}
                    >
                      <ResilientImage src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    onClick={() => setShowVideoPlayer(true)}
                    className={`flex items-center gap-1.5 px-3 h-12 rounded-lg text-xs font-medium border ${
                      showVideoPlayer
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Studio Video</span>
                  </button>
                </div>

                {/* Technical Specifications Table */}
                <div className="pt-3 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Technical Specifications
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {Object.entries(selectedProduct.specifications).map(([k, v]) => (
                      <div key={k} className="flex justify-between p-2.5">
                        <span className="text-slate-500">{k}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-200 text-right">
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Contiguous Purchase Module */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold font-mono-tabular text-slate-900 dark:text-white">
                      ₹
                      {(
                        selectedProduct.priceInr +
                        (selectedProduct.variants[selectedVariantIdx]?.priceDeltaInr || 0)
                      ).toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-slate-400 line-through font-mono-tabular">
                      ₹{selectedProduct.mrpInr.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {selectedProduct.discountPercent}% OFF
                    </span>
                  </div>

                  <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  {/* Size / Color / Pitch Variant Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-900 dark:text-white">
                      Select Size / Finish / Pitch Variant:
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedProduct.variants.map((v, idx) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantIdx(idx)}
                          className={`p-3 rounded-lg border text-left text-xs flex items-center justify-between ${
                            selectedVariantIdx === idx
                              ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span>
                            {v.label} ({v.color} · {v.sizeOrFinish})
                          </span>
                          <span className="font-mono-tabular">
                            {v.priceDeltaInr > 0 ? `+₹${v.priceDeltaInr}` : 'Included'} · {v.stock} left
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Warranty, Delivery Estimate & Seller Info */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <strong>Seller Store:</strong> {tenant.storeName} ({tenant.city}, {tenant.state})
                    </div>
                    <div>
                      <strong>Warranty:</strong> {selectedProduct.warrantyMonths} Months Official Store & Manufacturer Warranty
                    </div>
                    <div>
                      <strong>Estimated Delivery:</strong> {selectedProduct.deliveryEstimateDays} to {selectedLocation}
                    </div>
                  </div>

                  {/* Primary Buy CTAs */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(selectedProduct, selectedVariantIdx, true);
                        setSelectedProduct(null);
                      }}
                      style={{ backgroundColor: tenant.accentColor }}
                      className="flex-1 py-3 px-5 rounded-lg text-sm font-semibold text-slate-950 hover:opacity-95 transition-opacity"
                    >
                      Buy Now & Checkout
                    </button>
                    <button
                      type="button"
                      onClick={() => addToCart(selectedProduct, selectedVariantIdx, false)}
                      className="py-3 px-5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>

                {/* Verified Customer Reviews */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                    <span>Verified Musician & Dancer Reviews ({selectedProduct.reviewCount})</span>
                    <span className="text-amber-500 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {selectedProduct.rating} / 5.0
                    </span>
                  </div>
                  {selectedProduct.reviews.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Verified rating {selectedProduct.rating}/5 across {selectedProduct.reviewCount} store purchases.
                    </p>
                  ) : (
                    selectedProduct.reviews.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1"
                      >
                        <div className="flex justify-between font-medium text-slate-900 dark:text-white">
                          <span>{r.customerName} · Verified Buyer</span>
                          <span className="font-mono-tabular text-amber-500">★ {r.rating}/5</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{r.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER CART & CHECKOUT DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full flex flex-col justify-between p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-serif-display font-bold text-slate-900 dark:text-white">
                    Shopping Bag · {tenant.storeName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Stock is reserved automatically during checkout
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {checkoutBanner && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    checkoutBanner.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {checkoutBanner.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{checkoutBanner.text}</span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
                  <p className="text-sm text-slate-500">Your shopping bag is empty.</p>
                </div>
              ) : (
                <>
                  {/* Itemized Cart List */}
                  <div className="space-y-3">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.product.productId}_${item.variantLabel}`}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            {item.product.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Variant: {item.variantLabel}
                          </div>
                          <div className="text-xs font-mono-tabular font-semibold text-amber-600 dark:text-amber-400">
                            ₹{(item.priceInr * item.quantity).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, -1)}
                            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono-tabular w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, 1)}
                            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCartQty(idx, -item.quantity)}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Box */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={`Enter coupon (e.g. ${coupons[0]?.code || 'SANJIT10'})`}
                      className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-700 text-white"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Price Breakdown */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-mono-tabular">
                        ₹{cartSubtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Coupon Discount ({appliedCoupon?.code})</span>
                        <span className="font-mono-tabular">
                          -₹{discountAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Insured Delivery Fee</span>
                      <span className="font-mono-tabular">
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                      <span>Total Payable</span>
                      <span className="font-mono-tabular">
                        ₹{cartTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Address & Payment Gateway Form */}
                  <form onSubmit={handlePlaceOrder} className="space-y-3 pt-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Shipping & Payment Configuration
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Full Name"
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Street Address / Landmark"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        required
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="City & State"
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        required
                        value={shippingPincode}
                        onChange={(e) => setShippingPincode(e.target.value)}
                        placeholder="PIN Code"
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-500">
                        Payment Gateway ({tenant.paymentConfig.razorpayMerchantId})
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {(
                          [
                            { id: 'RAZORPAY_UPI', label: `UPI (${tenant.paymentConfig.upiVpa})` },
                            { id: 'RAZORPAY_CARD', label: 'Credit / Debit Card' },
                            { id: 'NETBANKING', label: 'NetBanking' },
                            ...(tenant.paymentConfig.codEnabled
                              ? [{ id: 'COD', label: 'Cash on Delivery' }]
                              : []),
                          ] as const
                        ).map((pm) => (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() =>
                              setPaymentMethod(
                                pm.id as 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'NETBANKING' | 'COD'
                              )
                            }
                            className={`p-2.5 rounded-lg border text-left font-medium ${
                              paymentMethod === pm.id
                                ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white'
                                : 'border-slate-200 dark:border-slate-800 text-slate-500'
                            }`}
                          >
                            {pm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Method Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-500">
                        Fulfillment Method
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {tenant.deliveryConfig.ownDeliveryEnabled && (
                          <button
                            type="button"
                            onClick={() => setDeliveryMode('OWN_DELIVERY')}
                            className={`p-2 rounded-lg border text-left ${
                              deliveryMode === 'OWN_DELIVERY'
                                ? 'border-amber-500 bg-amber-500/10 font-semibold'
                                : 'border-slate-200 dark:border-slate-800 text-slate-500'
                            }`}
                          >
                            Own Store Fleet (OTP Handover)
                          </button>
                        )}
                        {tenant.deliveryConfig.courierDeliveryEnabled && (
                          <button
                            type="button"
                            onClick={() => setDeliveryMode('COURIER_DELIVERY')}
                            className={`p-2 rounded-lg border text-left ${
                              deliveryMode === 'COURIER_DELIVERY'
                                ? 'border-amber-500 bg-amber-500/10 font-semibold'
                                : 'border-slate-200 dark:border-slate-800 text-slate-500'
                            }`}
                          >
                            Courier ({tenant.deliveryConfig.defaultCourierProvider})
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutSubmitting}
                      style={{ backgroundColor: tenant.accentColor }}
                      className="w-full py-3 rounded-lg text-sm font-semibold text-slate-950 hover:opacity-95 transition-opacity"
                    >
                      {checkoutSubmitting
                        ? 'Reserving Stock & Initializing Order...'
                        : `Confirm Order · ₹${cartTotal.toLocaleString('en-IN')}`}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SERVER-SIDE RAZORPAY WEBHOOK HMAC-SHA256 VERIFICATION MODAL */}
      {pendingWebhookHandshake && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono-tabular text-amber-500">
                  Razorpay Payment Gateway · Server-Side Verification
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Order {pendingWebhookHandshake.order.orderId} (Status: {pendingWebhookHandshake.order.paymentStatus})
                </h3>
              </div>
              <button
                onClick={() => {
                  setPendingWebhookHandshake(null);
                  setIsCartOpen(false);
                  setActiveCustomerTab('MY_ORDERS');
                }}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Per Section 10 security rules, returning from the payment page does <strong>not</strong> mark an order paid. The backend requires a signed <code>x-razorpay-signature</code> HMAC-SHA256 webhook event and blocks duplicate webhook replays.
            </p>

            <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono-tabular text-[11px] space-y-1 text-slate-700 dark:text-slate-300 break-all">
              <div>Merchant ID: {pendingWebhookHandshake.merchantId}</div>
              <div>Razorpay Order ID: {pendingWebhookHandshake.razorpayOrderId}</div>
              <div>HMAC-SHA256 Signature: {pendingWebhookHandshake.webhookHmacSignature}</div>
            </div>

            {webhookStatusMsg && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-300 font-medium">
                {webhookStatusMsg}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => triggerRazorpayWebhookVerification(false)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Send Signed HMAC-SHA256 Webhook (Verify & Commit Stock)</span>
              </button>
              <button
                onClick={() => triggerRazorpayWebhookVerification(false)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replay Duplicate Webhook (Test Idempotency 409)</span>
              </button>
              <button
                onClick={() => triggerRazorpayWebhookVerification(true)}
                className="px-3 py-2.5 rounded-lg text-xs font-medium bg-rose-600/20 text-rose-400 hover:bg-rose-600/30"
              >
                Test Forged Signature (401)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GST TAX INVOICE MODAL */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tax Invoice (Original for Recipient)
                </div>
                <h3 className="text-xl font-bold mt-1">{tenant.storeName}</h3>
                <div className="text-xs text-slate-600">
                  {tenant.address}, {tenant.city}, {tenant.state} · GSTIN: {tenant.gstNumber}
                </div>
              </div>
              <div className="text-right font-mono-tabular text-xs">
                <div className="font-bold">Invoice #: {activeInvoiceOrder.invoiceNumber}</div>
                <div>Order ID: {activeInvoiceOrder.orderId}</div>
                <div>Date: {new Date(activeInvoiceOrder.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-500">Billed & Shipped To:</div>
                <div className="font-bold mt-0.5">{activeInvoiceOrder.customerName}</div>
                <div>{activeInvoiceOrder.shippingAddress}</div>
                <div>
                  {activeInvoiceOrder.shippingCity} - {activeInvoiceOrder.shippingPincode}
                </div>
                <div>Phone: {activeInvoiceOrder.customerPhone}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-500">Payment & Dispatch Details:</div>
                <div>Method: {activeInvoiceOrder.paymentMethod}</div>
                <div>Payment Status: {activeInvoiceOrder.paymentStatus}</div>
                <div>
                  Webhook Verified: {activeInvoiceOrder.webhookSignatureVerified ? 'YES (HMAC-SHA256)' : 'COD'}
                </div>
              </div>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-y border-slate-300 text-left">
                  <th className="py-2">Item & Variant</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono-tabular">
                {activeInvoiceOrder.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-sans">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-slate-500">{item.variantLabel}</div>
                    </td>
                    <td className="py-2.5 text-right">{item.quantity}</td>
                    <td className="py-2.5 text-right">
                      ₹{item.unitPriceInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      ₹{item.totalPriceInr.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-slate-300 pt-4 flex justify-between items-end text-xs">
              <div className="text-slate-500 max-w-xs">
                Computer-generated GST tax invoice issued by {tenant.storeName} on the Sanjit Musical Store SaaS Platform.
              </div>
              <div className="space-y-1 text-right font-mono-tabular">
                <div>Subtotal: ₹{activeInvoiceOrder.subtotalInr.toLocaleString('en-IN')}</div>
                {activeInvoiceOrder.discountInr > 0 && (
                  <div>Discount: -₹{activeInvoiceOrder.discountInr.toLocaleString('en-IN')}</div>
                )}
                <div>Included GST (12%): ₹{activeInvoiceOrder.gstAmountInr.toLocaleString('en-IN')}</div>
                <div className="text-base font-bold pt-1">
                  Grand Total: ₹{activeInvoiceOrder.totalInr.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white"
              >
                Print / Save PDF Invoice
              </button>
              <button
                onClick={() => setActiveInvoiceOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
