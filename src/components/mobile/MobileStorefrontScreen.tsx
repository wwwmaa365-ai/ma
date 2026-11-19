import React, { useState } from 'react';
import {
  Search,
  MapPin,
  ShoppingCart,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  CheckCircle2,
  Play,
  Sparkles,
} from 'lucide-react';
import {
  CategoryNode,
  CouponCode,
  OrderRecord,
  ProductItem,
  TenantStore,
} from '../../types/platform.ts';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RNImage,
  BottomSheetModal,
} from '../rn/ReactNativePrimitives.tsx';

export interface MobileStorefrontScreenProps {
  activeTenant: TenantStore;
  categories: CategoryNode[];
  products: ProductItem[];
  coupons: CouponCode[];
  onCheckoutOrder: (payload: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPincode: string;
    paymentMethod: 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'NETBANKING' | 'COD';
    couponCode?: string;
    items: {
      productId: string;
      variantLabel: string;
      quantity: number;
    }[];
  }) => Promise<{ ok: boolean; order?: OrderRecord; error?: string }>;
  selectedProduct: ProductItem | null;
  onSelectProduct: (product: ProductItem | null) => void;
}

interface CartEntry {
  product: ProductItem;
  variantLabel: string;
  quantity: number;
}

export const MobileStorefrontScreen: React.FC<MobileStorefrontScreenProps> = ({
  activeTenant,
  categories,
  products,
  coupons,
  onCheckoutOrder,
  selectedProduct,
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('ALL');
  const [deliveryPincode, setDeliveryPincode] = useState('781005 · Guwahati');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([
    ...(products[0]
      ? [
          {
            product: products[0],
            variantLabel:
              products[0].variants[0]?.label || 'Standard Concert Finish',
            quantity: 1,
          },
        ]
      : []),
  ]);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [playingVideoPreview, setPlayingVideoPreview] = useState(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('Priyanka Baruah');
  const [customerPhone, setCustomerPhone] = useState('+91 98640 77210');
  const [shippingAddress, setShippingAddress] = useState(
    'House 24, Seuj Nagar, Beltola Survey'
  );
  const [shippingCity, setShippingCity] = useState('Guwahati');
  const [shippingPincode, setShippingPincode] = useState('781028');
  const [couponCode, setCouponCode] = useState(coupons[0]?.code || '');
  const [paymentMethod, setPaymentMethod] = useState<
    'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'COD'
  >('RAZORPAY_UPI');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (product: ProductItem, variantLabel?: string) => {
    const label =
      variantLabel || product.variants[0]?.label || 'Standard Edition';
    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.product.productId === product.productId && c.variantLabel === label
      );
      if (existing) {
        return prev.map((c) =>
          c.product.productId === product.productId && c.variantLabel === label
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { product, variantLabel: label, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, variantLabel: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product.productId === productId && c.variantLabel === variantLabel
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, c) => acc + c.product.priceInr * c.quantity,
    0
  );
  const activeCouponObj = coupons.find(
    (c) =>
      c.active &&
      c.code.toUpperCase() === couponCode.trim().toUpperCase() &&
      cartSubtotal >= c.minOrderInr
  );
  const discountInr = activeCouponObj
    ? Math.min(
        activeCouponObj.maxDiscountInr,
        Math.round((cartSubtotal * activeCouponObj.discountPercent) / 100)
      )
    : 0;
  const deliveryFeeInr =
    cartSubtotal === 0
      ? 0
      : cartSubtotal >= activeTenant.deliveryConfig.freeDeliveryThresholdInr
      ? 0
      : activeTenant.deliveryConfig.baseDeliveryFeeInr;
  const grandTotalInr = Math.max(0, cartSubtotal - discountInr + deliveryFeeInr);

  const selectedCategoryNode = categories.find((c) => c.name === activeCategory);

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      activeCategory === 'ALL' || p.category === activeCategory;
    const matchesSub =
      activeSubcategory === 'ALL' || p.subcategory === activeSubcategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCat && matchesSub && matchesQuery;
  });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutError('');
    setCheckoutBusy(true);
    try {
      const res = await onCheckoutOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: 'customer@sanjitmusical.in',
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity.trim(),
        shippingPincode: shippingPincode.trim(),
        paymentMethod,
        couponCode: activeCouponObj?.code,
        items: cart.map((c) => ({
          productId: c.product.productId,
          variantLabel: c.variantLabel,
          quantity: c.quantity,
        })),
      });
      if (!res.ok || !res.order) {
        setCheckoutError(res.error || 'Checkout failed.');
      } else {
        setConfirmedOrder(res.order);
        setCart([]);
      }
    } finally {
      setCheckoutBusy(false);
    }
  };

  // Native Stack Screen: Product Details View
  if (selectedProduct) {
    const variant =
      selectedProduct.variants[selectedVariantIdx] ||
      selectedProduct.variants[0];
    const isWished = wishlistIds.includes(selectedProduct.productId);
    const availableStock =
      selectedProduct.stock - selectedProduct.reservedStock;

    return (
      <div className="w-full flex-1 flex flex-col min-w-0">
        <ScrollView contentContainerClassName="px-3.5 pt-3 pb-32 gap-3.5">
          {/* Product Image Card (Zero Distortion) */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-xs">
            <RNImage
              source={selectedProduct.images[0]}
              alt={selectedProduct.name}
              aspectClassName="aspect-square"
              fallbackCategory={selectedProduct.category}
            />
            <button
              type="button"
              onClick={() => toggleWishlist(selectedProduct.productId)}
              aria-label="Toggle Wishlist"
              className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/90 dark:bg-purple-950/90 backdrop-blur-xs flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
            >
              <Heart
                className={`w-5 h-5 ${
                  isWished
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-purple-900 dark:text-amber-300'
                }`}
              />
            </button>
          </div>

          {/* Acoustic / Stage Demo Video Toggle */}
          {selectedProduct.videoPreviewTitle && (
            <button
              type="button"
              onClick={() => setPlayingVideoPreview(!playingVideoPreview)}
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#3B0764] to-[#5B21B6] text-white border border-amber-400/30 flex flex-row items-center justify-between gap-2 active:scale-[0.99] cursor-pointer"
            >
              <div className="flex flex-row items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-slate-950" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs font-bold text-amber-300 truncate">
                    {selectedProduct.videoPreviewTitle}
                  </span>
                  <span className="text-[11px] text-purple-200 truncate">
                    {playingVideoPreview
                      ? 'Playing studio soundcheck preview...'
                      : 'Tap to preview studio soundcheck'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono-tabular text-amber-200 shrink-0">
                0:45 HD
              </span>
            </button>
          )}

          {/* Title, Price, Rating & Stock Card */}
          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
            <div className="flex flex-row items-center justify-between gap-2 text-xs text-purple-700 dark:text-amber-300 font-medium">
              <span className="truncate">
                {selectedProduct.category} · {selectedProduct.subcategory}
              </span>
              <span className="flex flex-row items-center gap-1 font-bold text-amber-600 dark:text-amber-400 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{selectedProduct.rating}</span>
                <span className="text-slate-400">
                  ({selectedProduct.reviewCount})
                </span>
              </span>
            </div>

            <Text className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
              {selectedProduct.name}
            </Text>

            <div className="flex flex-row items-baseline gap-2.5 flex-wrap">
              <span className="text-xl font-extrabold text-purple-950 dark:text-amber-300 font-mono-tabular">
                ₹{selectedProduct.priceInr.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400 line-through font-mono-tabular">
                ₹{selectedProduct.mrpInr.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Save {selectedProduct.discountPercent}%
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-purple-200 leading-relaxed mt-1">
              {selectedProduct.description}
            </p>

            {/* Variant Selector */}
            {selectedProduct.variants.length > 0 && (
              <div className="pt-2 border-t border-purple-100 dark:border-purple-900/50 flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-purple-100">
                  Select Finish / Size Variant
                </span>
                <div className="flex flex-row flex-wrap gap-2">
                  {selectedProduct.variants.map((v, idx) => {
                    const active = idx === selectedVariantIdx;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantIdx(idx)}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#4C1D95] text-amber-300 border border-amber-400/50'
                            : 'bg-purple-50 dark:bg-purple-950/60 text-slate-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {v.label} ({v.color})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery & Warranty Promises */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100 dark:border-purple-900/50 text-xs">
              <div className="flex flex-row items-center gap-2 text-slate-700 dark:text-purple-200">
                <Truck className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0" />
                <span className="truncate">
                  {selectedProduct.deliveryEstimateDays}
                </span>
              </div>
              <div className="flex flex-row items-center gap-2 text-slate-700 dark:text-purple-200">
                <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0" />
                <span className="truncate">
                  {selectedProduct.warrantyMonths} Mo Warranty
                </span>
              </div>
            </div>
          </View>

          {/* Technical Specifications Card */}
          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
            <Text className="text-xs font-bold text-slate-900 dark:text-white">
              Technical Specifications
            </Text>
            <div className="flex flex-col divide-y divide-purple-100 dark:divide-purple-900/50">
              {Object.entries(selectedProduct.specifications).map(
                ([key, val]) => (
                  <div
                    key={key}
                    className="py-2 flex flex-row items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-slate-500 dark:text-purple-300">
                      {key}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-right">
                      {val}
                    </span>
                  </div>
                )
              )}
            </div>
          </View>

          {/* Verified Customer Reviews */}
          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
            <Text className="text-xs font-bold text-slate-900 dark:text-white">
              Customer Reviews ({selectedProduct.reviews.length})
            </Text>
            {selectedProduct.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/50 flex flex-col gap-1"
              >
                <div className="flex flex-row items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {rev.customerName}
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    ★ {rev.rating}.0
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-purple-200">
                  {rev.comment}
                </p>
              </div>
            ))}
          </View>
        </ScrollView>

        {/* Sticky Thumb-Zone Add to Cart / Buy Now Bar */}
        <div className="fixed bottom-16 left-0 right-0 z-30 px-3.5 py-2.5 bg-white/95 dark:bg-[#1A0E30]/95 backdrop-blur-md border-t border-purple-200 dark:border-purple-800 flex flex-row items-center gap-2.5">
          <TouchableOpacity
            disabled={availableStock <= 0}
            onPress={() => {
              addToCart(selectedProduct, variant?.label);
              setCartSheetOpen(true);
            }}
            className="flex-1 bg-purple-100 dark:bg-purple-950 text-purple-950 dark:text-amber-300 border border-purple-300 dark:border-purple-700 font-bold text-xs"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">Add to Cart</span>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={availableStock <= 0}
            onPress={() => {
              addToCart(selectedProduct, variant?.label);
              setCartSheetOpen(true);
            }}
            className="flex-1 bg-gradient-to-r from-[#4C1D95] to-[#6D28D9] text-amber-300 font-bold text-xs shadow-md"
          >
            <span className="truncate">Buy Now · ₹{selectedProduct.priceInr.toLocaleString('en-IN')}</span>
          </TouchableOpacity>
        </div>
      </div>
    );
  }

  return (
    <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
      {/* Top Location & Mobile Cart Bar */}
      <div className="flex flex-row items-center justify-between gap-2 w-full">
        <button
          type="button"
          onClick={() =>
            setDeliveryPincode((prev) =>
              prev.includes('Guwahati')
                ? '785001 · Jorhat, Assam'
                : '781005 · Guwahati'
            )
          }
          className="min-h-[42px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 flex flex-row items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-purple-100 min-w-0 flex-1 active:scale-98 cursor-pointer"
        >
          <MapPin className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0" />
          <span className="truncate">Deliver to {deliveryPincode}</span>
        </button>

        <button
          type="button"
          onClick={() => setCartSheetOpen(true)}
          className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-[#4C1D95] text-amber-300 text-xs font-bold flex flex-row items-center gap-1.5 shrink-0 shadow-xs active:scale-95 cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span className="font-mono-tabular">Cart ({cartCount})</span>
        </button>
      </div>

      {/* Mobile Product Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-purple-600 dark:text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTenant.storeName}...`}
          className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-200 dark:border-purple-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-purple-700"
        />
      </div>

      {/* Promotional Festival Hero Banner (16:9 Mobile Card with Scrim) */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-amber-400/40 shadow-md">
        <RNImage
          source={activeTenant.bannerUrl}
          alt={activeTenant.storeName}
          aspectClassName="aspect-[16/9]"
          fallbackCategory="Musical Instruments"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E0538]/95 via-[#2E1065]/65 to-transparent p-3.5 flex flex-col justify-end">
          <div className="flex flex-row items-center gap-1.5 text-[11px] font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {activeTenant.storeName} · Festival Offer
            </span>
          </div>
          <h2 className="text-base font-extrabold text-white leading-tight mt-0.5 line-clamp-2">
            {activeTenant.tagline}
          </h2>
          {coupons[0] && (
            <span className="text-[11px] text-purple-200 mt-1 font-mono-tabular">
              Use code <strong className="text-amber-300">{coupons[0].code}</strong> for{' '}
              {coupons[0].discountPercent}% off up to ₹{coupons[0].maxDiscountInr}
            </span>
          )}
        </div>
      </div>

      {/* Category Filter Buttons */}
      <ScrollView horizontal className="pb-0.5">
        <button
          type="button"
          onClick={() => {
            setActiveCategory('ALL');
            setActiveSubcategory('ALL');
          }}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeCategory === 'ALL'
              ? 'bg-[#4C1D95] text-amber-300 shadow-xs'
              : 'bg-white dark:bg-[#1E1136] text-slate-700 dark:text-purple-200 border border-purple-100 dark:border-purple-900/60'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCategory(cat.name);
              setActiveSubcategory('ALL');
            }}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              activeCategory === cat.name
                ? 'bg-[#4C1D95] text-amber-300 shadow-xs'
                : 'bg-white dark:bg-[#1E1136] text-slate-700 dark:text-purple-200 border border-purple-100 dark:border-purple-900/60'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </ScrollView>

      {/* Subcategory Scroller when a Master Category is active */}
      {selectedCategoryNode && (
        <ScrollView horizontal className="pb-0.5">
          <button
            type="button"
            onClick={() => setActiveSubcategory('ALL')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubcategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200'
            }`}
          >
            All {selectedCategoryNode.name}
          </button>
          {selectedCategoryNode.subcategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setActiveSubcategory(sub)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubcategory === sub
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </ScrollView>
      )}

      {/* Responsive 2-Column Mobile Product Cards Grid (Fits 320px to 430px+) */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {filteredProducts.map((product) => {
          const isWished = wishlistIds.includes(product.productId);
          return (
            <div
              key={product.productId}
              className="w-full rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs overflow-hidden flex flex-col justify-between min-w-0"
            >
              <div
                onClick={() => {
                  setSelectedVariantIdx(0);
                  onSelectProduct(product);
                }}
                className="flex flex-col cursor-pointer min-w-0"
              >
                <div className="relative w-full">
                  <RNImage
                    source={product.images[0]}
                    alt={product.name}
                    aspectClassName="aspect-square"
                    fallbackCategory={product.category}
                  />
                  <button
                    type="button"
                    aria-label="Wishlist item"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.productId);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-purple-950/90 flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWished
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-purple-800 dark:text-amber-300'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-2.5 flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-medium text-purple-700 dark:text-amber-300 truncate">
                    {product.subcategory}
                  </span>
                  <Text
                    numberOfLines={2}
                    className="text-xs font-bold text-slate-900 dark:text-white leading-snug min-h-[32px]"
                  >
                    {product.name}
                  </Text>
                  <div className="flex flex-row items-baseline gap-1.5 flex-wrap mt-0.5">
                    <span className="text-xs font-extrabold text-purple-950 dark:text-amber-300 font-mono-tabular">
                      ₹{product.priceInr.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      -{product.discountPercent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-2.5 pb-2.5">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product);
                    setCartSheetOpen(true);
                  }}
                  className="w-full min-h-[40px] rounded-xl bg-[#4C1D95] text-amber-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Add to Cart</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Shopping Cart & Razorpay UPI / COD Checkout Bottom Sheet */}
      <BottomSheetModal
        visible={cartSheetOpen}
        title={
          confirmedOrder
            ? `Order Confirmed · ${confirmedOrder.orderId}`
            : `Shopping Cart (${cartCount} items)`
        }
        subtitle={activeTenant.storeName}
        onClose={() => {
          setCartSheetOpen(false);
          setConfirmedOrder(null);
        }}
      >
        {confirmedOrder ? (
          <div className="flex flex-col gap-3.5 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center text-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Order Placed Successfully!
              </h3>
              <p className="text-xs text-slate-600 dark:text-purple-200">
                Invoice <strong>{confirmedOrder.invoiceNumber}</strong> ·
                Delivery OTP:{' '}
                <strong className="text-purple-900 dark:text-amber-300 font-mono-tabular">
                  {confirmedOrder.deliveryOtp}
                </strong>
              </p>
              <span className="text-sm font-extrabold text-purple-950 dark:text-amber-300 font-mono-tabular">
                Total Paid: ₹{confirmedOrder.totalInr.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                setCartSheetOpen(false);
              }}
              className="w-full min-h-[48px] rounded-xl bg-[#4C1D95] text-amber-300 font-bold text-sm cursor-pointer"
            >
              Done & Continue Shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-purple-400" />
            <p className="text-xs text-slate-500 dark:text-purple-300">
              Your mobile cart is empty. Tap any product to add items.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3">
            {/* Cart Items */}
            <div className="flex flex-col gap-2">
              {cart.map((entry) => (
                <div
                  key={`${entry.product.productId}_${entry.variantLabel}`}
                  className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex flex-row items-center justify-between gap-2"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {entry.product.name}
                    </Text>
                    <span className="text-[11px] text-slate-500 dark:text-purple-300 font-mono-tabular">
                      ₹{entry.product.priceInr.toLocaleString('en-IN')} ×{' '}
                      {entry.quantity}
                    </span>
                  </div>

                  <div className="flex flex-row items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQty(
                          entry.product.productId,
                          entry.variantLabel,
                          -1
                        )
                      }
                      className="w-9 h-9 rounded-lg bg-white dark:bg-[#1E1136] border border-purple-200 dark:border-purple-700 flex items-center justify-center text-slate-800 dark:text-white cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold font-mono-tabular">
                      {entry.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQty(
                          entry.product.productId,
                          entry.variantLabel,
                          1
                        )
                      }
                      className="w-9 h-9 rounded-lg bg-[#4C1D95] text-amber-300 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Bar */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                Promo Coupon Code
              </label>
              <div className="flex flex-row gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
                />
                {coupons.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCouponCode(c.code)}
                    className="min-h-[44px] px-3 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono-tabular shrink-0 cursor-pointer"
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Delivery Fields */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Mobile Number"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <input
              type="text"
              required
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Delivery House / Street Address"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                placeholder="City"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                required
                value={shippingPincode}
                onChange={(e) => setShippingPincode(e.target.value)}
                placeholder="PIN Code"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'RAZORPAY_UPI', label: 'Razorpay UPI' },
                  { id: 'RAZORPAY_CARD', label: 'Card / Net' },
                  { id: 'COD', label: 'Cash (COD)' },
                ] as const
              ).map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`min-h-[42px] px-2 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                    paymentMethod === pm.id
                      ? 'bg-[#4C1D95] text-amber-300 border border-amber-400/50'
                      : 'bg-purple-50 dark:bg-purple-950/60 text-slate-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            {/* Bill Summary */}
            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/50 flex flex-col gap-1 text-xs">
              <div className="flex flex-row justify-between text-slate-600 dark:text-purple-200">
                <span>Items Subtotal</span>
                <span className="font-mono-tabular">
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </span>
              </div>
              {discountInr > 0 && (
                <div className="flex flex-row justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Coupon Discount ({activeCouponObj?.code})</span>
                  <span className="font-mono-tabular">
                    -₹{discountInr.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="flex flex-row justify-between text-slate-600 dark:text-purple-200">
                <span>Delivery Charges</span>
                <span className="font-mono-tabular">
                  {deliveryFeeInr === 0 ? 'FREE' : `₹${deliveryFeeInr}`}
                </span>
              </div>
              <div className="flex flex-row justify-between font-extrabold text-purple-950 dark:text-amber-300 text-sm pt-1 border-t border-purple-200 dark:border-purple-800">
                <span>Total Payable</span>
                <span className="font-mono-tabular">
                  ₹{grandTotalInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {checkoutError && (
              <p className="text-xs font-semibold text-rose-600">
                {checkoutError}
              </p>
            )}

            <button
              type="submit"
              disabled={checkoutBusy}
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#4C1D95] to-[#6D28D9] text-amber-300 font-bold text-sm shadow-md active:scale-[0.98] transition-transform cursor-pointer"
            >
              {checkoutBusy
                ? 'Verifying Razorpay Signature...'
                : `Pay & Place Order · ₹${grandTotalInr.toLocaleString('en-IN')}`}
            </button>
          </form>
        )}
      </BottomSheetModal>
    </ScrollView>
  );
};
