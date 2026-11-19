import React from 'react';
import {
  Store,
  PlusCircle,
  PackageCheck,
  Tag,
  ShoppingBag,
  AlertTriangle,
  ChevronRight,
  IndianRupee,
  Truck,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  CategoryNode,
  OrderRecord,
  ProductItem,
  SubscriptionPlan,
  TenantStore,
} from '../../types/platform.ts';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RNImage,
} from '../rn/ReactNativePrimitives.tsx';

export interface PartnerHomeScreenProps {
  activeTenant: TenantStore;
  allTenants: TenantStore[];
  plans: SubscriptionPlan[];
  categories: CategoryNode[];
  products: ProductItem[];
  orders: OrderRecord[];
  financialSummary: {
    grossProductSalesInr: number;
    totalCommissionInr: number;
    netSellerRevenueInr: number;
    lowStockCount: number;
  };
  onOpenStoreSwitcher: () => void;
  onOpenAddProduct: () => void;
  onNavigateTab: (tab: 'HOME' | 'ORDERS' | 'PRODUCTS' | 'SHOP' | 'HUB') => void;
  onSelectOrder: (order: OrderRecord) => void;
  onQuickRestock: (productId: string, newStock: number) => void;
  onOpenCouponSheet: () => void;
  onRefresh: () => Promise<void> | void;
}

export const PartnerHomeScreen: React.FC<PartnerHomeScreenProps> = ({
  activeTenant,
  plans,
  products,
  orders,
  financialSummary,
  onOpenStoreSwitcher,
  onOpenAddProduct,
  onNavigateTab,
  onSelectOrder,
  onQuickRestock,
  onOpenCouponSheet,
  onRefresh,
}) => {
  const activePlan =
    plans.find((p) => p.id === activeTenant.planId) || plans[1];
  const lowStockProducts = products.filter(
    (p) => p.stock - p.reservedStock <= p.lowStockThreshold
  );
  const pendingOrdersCount = orders.filter(
    (o) =>
      o.status === 'CONFIRMED' ||
      o.status === 'PACKED' ||
      o.status === 'OUT_FOR_DELIVERY'
  ).length;

  return (
    <ScrollView
      onRefresh={onRefresh}
      contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5"
    >
      {/* Royal Purple & Gold Partner Store Banner Card */}
      <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#5B21B6] p-4 text-white shadow-md border border-amber-400/30 gap-3">
        <div className="flex flex-row items-start justify-between gap-2 min-w-0">
          <div className="flex flex-row items-center gap-2.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0">
              {activeTenant.logoText}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex flex-row items-center gap-1.5 min-w-0">
                <Text
                  numberOfLines={1}
                  className="text-base font-bold text-white"
                >
                  {activeTenant.storeName}
                </Text>
              </div>
              <Text
                numberOfLines={1}
                className="text-xs text-amber-200/95 font-medium"
              >
                {activeTenant.city}, {activeTenant.state} · {activePlan.name}
              </Text>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenStoreSwitcher}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/20 border border-amber-300/30 text-amber-200 text-xs font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition-transform cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-amber-300" />
            <span>Switch</span>
          </button>
        </div>

        {/* Gold Divider & Net Payout Metric */}
        <div className="h-px w-full bg-gradient-to-r from-amber-400/40 via-purple-300/20 to-transparent" />

        <div className="flex flex-row items-end justify-between gap-2 flex-wrap">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-purple-200">
              Net Partner Payout (After {activePlan.commissionRatePercent}% Fee)
            </span>
            <div className="flex flex-row items-baseline gap-1 mt-0.5">
              <span className="text-amber-300 text-lg font-bold">₹</span>
              <span className="text-2xl font-extrabold tracking-tight text-white font-mono-tabular">
                {financialSummary.netSellerRevenueInr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end min-w-0">
            <span className="text-[11px] text-purple-200">Gross Store Sales</span>
            <span className="text-sm font-bold text-amber-300 font-mono-tabular">
              ₹{financialSummary.grossProductSalesInr.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </View>

      {/* 2x2 Responsive Mobile Flexbox KPI Grid (Fits 320px to 430px+) */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        <button
          type="button"
          onClick={() => onNavigateTab('ORDERS')}
          className="min-h-[82px] p-3 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs flex flex-col justify-between text-left active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex flex-row items-center justify-between w-full gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-purple-200 truncate">
              Active Orders
            </span>
            <PackageCheck className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0" />
          </div>
          <div className="flex flex-row items-baseline justify-between w-full gap-1 mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
              {pendingOrdersCount}
            </span>
            <span className="text-[11px] text-purple-700 dark:text-amber-300 font-medium truncate">
              {orders.length} total
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('PRODUCTS')}
          className="min-h-[82px] p-3 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs flex flex-col justify-between text-left active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex flex-row items-center justify-between w-full gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-purple-200 truncate">
              Catalogue SKUs
            </span>
            <ShoppingBag className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0" />
          </div>
          <div className="flex flex-row items-baseline justify-between w-full gap-1 mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
              {products.length}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-purple-300 font-mono-tabular truncate">
              /{activePlan.productLimit} limit
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('PRODUCTS')}
          className="min-h-[82px] p-3 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs flex flex-col justify-between text-left active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex flex-row items-center justify-between w-full gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-purple-200 truncate">
              Low Stock Alerts
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          </div>
          <div className="flex flex-row items-baseline justify-between w-full gap-1 mt-1">
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono-tabular">
              {lowStockProducts.length}
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium truncate">
              Restock now
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('HUB')}
          className="min-h-[82px] p-3 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-100 dark:border-purple-900/60 shadow-2xs flex flex-col justify-between text-left active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex flex-row items-center justify-between w-full gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-purple-200 truncate">
              Platform Fee
            </span>
            <IndianRupee className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0" />
          </div>
          <div className="flex flex-row items-baseline justify-between w-full gap-1 mt-1">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono-tabular">
              ₹{financialSummary.totalCommissionInr.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-purple-300 truncate">
              {activePlan.commissionRatePercent}% rate
            </span>
          </div>
        </button>
      </div>

      {/* Touch-Friendly Seller Quick Actions */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
        <div className="flex flex-row items-center justify-between">
          <Text className="text-xs font-bold text-slate-800 dark:text-purple-100">
            Quick Seller Actions
          </Text>
          <span className="text-[11px] text-purple-700 dark:text-amber-300 font-medium">
            One-hand touch controls
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <TouchableOpacity
            onPress={onOpenAddProduct}
            className="bg-[#4C1D95] text-white font-semibold text-xs shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">Add New Product</span>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigateTab('ORDERS')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
          >
            <Truck className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="truncate">Dispatch & OTP</span>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenCouponSheet}
            className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 font-semibold text-xs"
          >
            <Tag className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0" />
            <span className="truncate">Create Coupon</span>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNavigateTab('SHOP')}
            className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 font-semibold text-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Customer View</span>
          </TouchableOpacity>
        </div>
      </View>

      {/* Low Stock Inventory Alert Section */}
      {lowStockProducts.length > 0 && (
        <View className="w-full bg-amber-50/90 dark:bg-amber-950/30 rounded-2xl p-3.5 border border-amber-300/70 dark:border-amber-700/50 gap-2.5">
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-row items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <Text
                numberOfLines={1}
                className="text-xs font-bold text-amber-950 dark:text-amber-200"
              >
                Low Stock Alert ({lowStockProducts.length} items)
              </Text>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('PRODUCTS')}
              className="text-xs font-semibold text-purple-800 dark:text-amber-300 underline shrink-0 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {lowStockProducts.slice(0, 2).map((item) => {
              const available = item.stock - item.reservedStock;
              return (
                <div
                  key={item.productId}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1E1136] border border-amber-200/80 dark:border-amber-800/50 flex flex-row items-center justify-between gap-2.5"
                >
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
                    <RNImage
                      source={item.images[0]}
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
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 font-mono-tabular">
                      Only {available} left · Threshold {item.lowStockThreshold}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuickRestock(item.productId, item.stock + 10)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#4C1D95] text-amber-300 text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer"
                  >
                    +10 Stock
                  </button>
                </div>
              );
            })}
          </div>
        </View>
      )}

      {/* Recent Mobile Orders Tap List */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
        <div className="flex flex-row items-center justify-between gap-2">
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Store Orders
          </Text>
          <button
            type="button"
            onClick={() => onNavigateTab('ORDERS')}
            className="min-h-[36px] px-2 text-xs font-semibold text-purple-700 dark:text-amber-300 flex items-center gap-0.5 cursor-pointer"
          >
            <span>See All ({orders.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col divide-y divide-purple-100 dark:divide-purple-900/50">
          {orders.slice(0, 4).map((order) => (
            <button
              key={order.orderId}
              type="button"
              onClick={() => onSelectOrder(order)}
              className="w-full min-h-[68px] py-2.5 flex flex-row items-center justify-between gap-2.5 text-left active:bg-purple-50/60 dark:active:bg-purple-950/40 transition-colors cursor-pointer"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex flex-row items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-purple-800 dark:text-amber-300 font-mono-tabular truncate">
                    {order.orderId}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {order.customerName}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-purple-300 truncate mt-0.5">
                  {order.items[0]?.name || 'Musical Item'}{' '}
                  {order.items.length > 1 ? `+${order.items.length - 1} more` : ''} ·{' '}
                  {order.shippingCity}
                </span>
                <span className="text-[11px] font-medium text-purple-700 dark:text-amber-200 mt-0.5">
                  Status: {order.status.replace(/_/g, ' ')} · OTP: {order.deliveryOtp}
                </span>
              </div>

              <div className="flex flex-row items-center gap-1.5 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono-tabular">
                    ₹{order.totalInr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    {order.paymentMethod.replace('RAZORPAY_', '')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </View>
    </ScrollView>
  );
};
