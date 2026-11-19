import React, { useState } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  FileText,
  MapPin,
  KeyRound,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { DeliveryPartner, OrderRecord } from '../../types/platform.ts';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  BottomSheetModal,
} from '../rn/ReactNativePrimitives.tsx';

export interface PartnerOrdersScreenProps {
  orders: OrderRecord[];
  deliveryPartners: DeliveryPartner[];
  selectedOrder: OrderRecord | null;
  onSelectOrder: (order: OrderRecord | null) => void;
  onUpdateOrderStatus: (
    orderId: string,
    payload: {
      status?: OrderRecord['status'];
      courierProvider?: 'Shiprocket' | 'Delhivery' | 'BlueDart';
      assignedPartnerId?: string;
      verifyDeliveryOtp?: string;
      currentHub?: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  onRefresh: () => Promise<void> | void;
}

const ORDER_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'PACKED', label: 'Packed' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { id: 'DELIVERED', label: 'Delivered' },
];

export const PartnerOrdersScreen: React.FC<PartnerOrdersScreenProps> = ({
  orders,
  deliveryPartners,
  selectedOrder,
  onSelectOrder,
  onUpdateOrderStatus,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [otpOrder, setOtpOrder] = useState<OrderRecord | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      order.orderId.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.shippingCity.toLowerCase().includes(q) ||
      order.items.some((i) => i.name.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const handleQuickStatusAdvance = async (
    order: OrderRecord,
    nextStatus: OrderRecord['status'],
    extra?: {
      courierProvider?: 'Shiprocket' | 'Delhivery' | 'BlueDart';
      assignedPartnerId?: string;
    }
  ) => {
    setBusyOrderId(order.orderId);
    try {
      await onUpdateOrderStatus(order.orderId, {
        status: nextStatus,
        ...extra,
      });
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpOrder) return;
    setOtpError('');
    setBusyOrderId(otpOrder.orderId);
    try {
      const res = await onUpdateOrderStatus(otpOrder.orderId, {
        verifyDeliveryOtp: otpInput.trim(),
      });
      if (!res.ok) {
        setOtpError(res.error || 'Invalid 4-digit customer Delivery OTP');
      } else {
        setOtpOrder(null);
        setOtpInput('');
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  // Native Stack Detail View when an Order is tapped
  if (selectedOrder) {
    const liveOrder =
      orders.find((o) => o.orderId === selectedOrder.orderId) || selectedOrder;

    return (
      <ScrollView
        onRefresh={onRefresh}
        contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5"
      >
        {/* Order Summary Banner */}
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-2">
          <div className="flex flex-row items-center justify-between gap-2">
            <span className="text-xs font-mono-tabular text-amber-300 font-bold">
              {liveOrder.orderId} · {liveOrder.invoiceNumber}
            </span>
            <span className="text-xs font-bold text-white">
              {liveOrder.status.replace(/_/g, ' ')}
            </span>
          </div>
          <Text className="text-base font-bold text-white">
            {liveOrder.customerName}
          </Text>
          <span className="text-xs text-purple-200">
            {liveOrder.shippingAddress}, {liveOrder.shippingCity} -{' '}
            {liveOrder.shippingPincode}
          </span>
          <div className="h-px bg-white/15 my-1" />
          <div className="flex flex-row items-center justify-between text-xs">
            <span className="text-purple-200">
              Customer OTP:{' '}
              <strong className="text-amber-300 font-mono-tabular">
                {liveOrder.deliveryOtp}
              </strong>
            </span>
            <span className="font-mono-tabular font-bold text-amber-300 text-sm">
              ₹{liveOrder.totalInr.toLocaleString('en-IN')}
            </span>
          </div>
        </View>

        {/* Action Buttons for Order Progression */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Fulfillment & Delivery Actions
          </Text>
          <div className="flex flex-col gap-2">
            {liveOrder.status === 'CONFIRMED' && (
              <TouchableOpacity
                onPress={() => handleQuickStatusAdvance(liveOrder, 'PACKED')}
                className="bg-[#4C1D95] text-white text-xs font-bold"
              >
                <Package className="w-4 h-4 text-amber-300" />
                <span>Mark Order Packed & Generate GST Label</span>
              </TouchableOpacity>
            )}

            {(liveOrder.status === 'CONFIRMED' ||
              liveOrder.status === 'PACKED') && (
              <TouchableOpacity
                onPress={() =>
                  handleQuickStatusAdvance(liveOrder, 'SHIPPED', {
                    courierProvider: 'Shiprocket',
                  })
                }
                className="bg-purple-800 text-white text-xs font-bold"
              >
                <Truck className="w-4 h-4 text-amber-300" />
                <span>Dispatch via Shiprocket AWB</span>
              </TouchableOpacity>
            )}

            {liveOrder.status !== 'DELIVERED' &&
              liveOrder.status !== 'CANCELLED' && (
                <div className="grid grid-cols-1 gap-2">
                  {liveOrder.status !== 'OUT_FOR_DELIVERY' && (
                    <TouchableOpacity
                      onPress={() =>
                        handleQuickStatusAdvance(
                          liveOrder,
                          'OUT_FOR_DELIVERY',
                          {
                            assignedPartnerId:
                              deliveryPartners[0]?.partnerId ||
                              'partner_rider_1',
                          }
                        )
                      }
                      className="bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100 border border-purple-300 dark:border-purple-800 text-xs font-bold"
                    >
                      <MapPin className="w-4 h-4 text-purple-700 dark:text-amber-400" />
                      <span>Mark Out for Delivery (Assign Rider)</span>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setOtpOrder(liveOrder);
                      setOtpInput(liveOrder.deliveryOtp);
                      setOtpError('');
                    }}
                    className="bg-amber-500 text-slate-950 text-xs font-bold"
                  >
                    <KeyRound className="w-4 h-4 text-slate-950" />
                    <span>Verify 4-Digit Delivery OTP ({liveOrder.deliveryOtp})</span>
                  </TouchableOpacity>
                </div>
              )}
          </div>
        </View>

        {/* Line Items & GST Tax Invoice Breakdown */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <div className="flex flex-row items-center justify-between">
            <Text className="text-xs font-bold text-slate-900 dark:text-white">
              GST Tax Invoice Breakdown
            </Text>
            <span className="text-[11px] text-purple-700 dark:text-amber-300 font-mono-tabular">
              {liveOrder.invoiceNumber}
            </span>
          </div>

          <div className="flex flex-col divide-y divide-purple-100 dark:divide-purple-900/50">
            {liveOrder.items.map((item, idx) => (
              <div
                key={`${item.productId}_${idx}`}
                className="py-2 flex flex-row items-center justify-between gap-2"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {item.name}
                  </Text>
                  <span className="text-[11px] text-slate-500 dark:text-purple-300">
                    Variant: {item.variantLabel} · Qty {item.quantity} × ₹
                    {item.unitPriceInr.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-tabular shrink-0">
                  ₹{item.totalPriceInr.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-purple-100 dark:border-purple-900/60 flex flex-col gap-1 text-xs">
            <div className="flex flex-row justify-between text-slate-600 dark:text-purple-200">
              <span>Subtotal</span>
              <span className="font-mono-tabular">
                ₹{liveOrder.subtotalInr.toLocaleString('en-IN')}
              </span>
            </div>
            {liveOrder.discountInr > 0 && (
              <div className="flex flex-row justify-between text-emerald-700 dark:text-emerald-400">
                <span>Coupon Discount ({liveOrder.couponCode})</span>
                <span className="font-mono-tabular">
                  -₹{liveOrder.discountInr.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className="flex flex-row justify-between text-slate-600 dark:text-purple-200">
              <span>GST (18% Included)</span>
              <span className="font-mono-tabular">
                ₹{liveOrder.gstAmountInr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex flex-row justify-between text-slate-600 dark:text-purple-200">
              <span>Platform Commission</span>
              <span className="font-mono-tabular">
                -₹{liveOrder.platformCommissionInr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex flex-row justify-between font-bold text-purple-900 dark:text-amber-300 pt-1 border-t border-purple-100 dark:border-purple-900/50">
              <span>Net Partner Settlement</span>
              <span className="font-mono-tabular">
                ₹{liveOrder.netSellerPayoutInr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </View>

        {/* Live Delivery Tracking History */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Live GPS Hub & Milestone History
          </Text>
          <span className="text-xs text-purple-700 dark:text-amber-300">
            Current Hub: {liveOrder.trackingLocation.currentHub}
          </span>
          <div className="flex flex-col gap-2.5 mt-1">
            {liveOrder.trackingHistory.map((step, index) => (
              <div
                key={`${step.status}_${index}`}
                className="flex flex-row items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {step.status.replace(/_/g, ' ')} · {step.location}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-purple-300">
                    {step.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      onRefresh={onRefresh}
      contentContainerClassName="px-3.5 pt-3 pb-24 gap-3"
    >
      {/* Mobile Search Input */}
      <div className="w-full relative">
        <Search className="w-4 h-4 text-purple-600 dark:text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search order ID, customer, city..."
          className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1E1136] border border-purple-200 dark:border-purple-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-purple-700"
        />
      </div>

      {/* Horizontal Filter Bar */}
      <ScrollView horizontal className="pb-1">
        {ORDER_FILTERS.map((filter) => {
          const active = statusFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#4C1D95] text-amber-300 shadow-xs'
                  : 'bg-white dark:bg-[#1E1136] text-slate-700 dark:text-purple-200 border border-purple-100 dark:border-purple-900/60'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </ScrollView>

      {/* Mobile FlatList of Orders */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderId}
        renderItem={({ item: order }) => {
          const isBusy = busyOrderId === order.orderId;
          return (
            <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 shadow-2xs gap-2.5">
              {/* Top Row: ID, Customer & Amount */}
              <div className="flex flex-row items-start justify-between gap-2 min-w-0">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex flex-row items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="text-xs font-extrabold text-purple-900 dark:text-amber-300 font-mono-tabular">
                      {order.orderId}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-purple-200">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <Text
                    numberOfLines={1}
                    className="text-sm font-bold text-slate-900 dark:text-white mt-0.5"
                  >
                    {order.customerName}
                  </Text>
                  <span className="text-[11px] text-slate-500 dark:text-purple-300 truncate">
                    {order.shippingCity}, {order.shippingPincode} ·{' '}
                    {order.paymentMethod.replace('RAZORPAY_', '')}
                  </span>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono-tabular">
                    ₹{order.totalInr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-purple-700 dark:text-amber-300 font-mono-tabular">
                    Net ₹{order.netSellerPayoutInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="px-2.5 py-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/50 flex flex-col gap-1">
                {order.items.map((line, idx) => (
                  <div
                    key={`${line.productId}_${idx}`}
                    className="flex flex-row items-center justify-between gap-2 text-xs"
                  >
                    <Text
                      numberOfLines={1}
                      className="text-slate-800 dark:text-purple-100 font-medium flex-1"
                    >
                      {line.quantity}× {line.name}
                    </Text>
                    <span className="font-mono-tabular text-slate-700 dark:text-purple-200 shrink-0">
                      ₹{line.totalPriceInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Courier / OTP Info */}
              <div className="flex flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-purple-300 flex-wrap">
                <span>
                  {order.awbNumber
                    ? `${order.courierProvider || 'Shiprocket'} AWB: ${order.awbNumber}`
                    : 'Awaiting Courier Dispatch'}
                </span>
                <span className="font-mono-tabular font-semibold text-purple-800 dark:text-amber-300">
                  Delivery OTP: {order.deliveryOtp}
                </span>
              </div>

              {/* Touch-Friendly Action Row */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <TouchableOpacity
                  onPress={() => onSelectOrder(order)}
                  className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-semibold"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-700 dark:text-amber-400 shrink-0" />
                  <span className="truncate">Invoice & Track</span>
                </TouchableOpacity>

                {order.status === 'CONFIRMED' && (
                  <TouchableOpacity
                    disabled={isBusy}
                    onPress={() => handleQuickStatusAdvance(order, 'PACKED')}
                    className="bg-[#4C1D95] text-amber-300 text-xs font-bold"
                  >
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Pack Order</span>
                  </TouchableOpacity>
                )}

                {order.status === 'PACKED' && (
                  <TouchableOpacity
                    disabled={isBusy}
                    onPress={() =>
                      handleQuickStatusAdvance(order, 'SHIPPED', {
                        courierProvider: 'Shiprocket',
                      })
                    }
                    className="bg-[#4C1D95] text-amber-300 text-xs font-bold"
                  >
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Ship AWB</span>
                  </TouchableOpacity>
                )}

                {order.status === 'SHIPPED' && (
                  <TouchableOpacity
                    disabled={isBusy}
                    onPress={() =>
                      handleQuickStatusAdvance(order, 'OUT_FOR_DELIVERY')
                    }
                    className="bg-[#4C1D95] text-amber-300 text-xs font-bold"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Out for Delivery</span>
                  </TouchableOpacity>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <TouchableOpacity
                    disabled={isBusy}
                    onPress={() => {
                      setOtpOrder(order);
                      setOtpInput(order.deliveryOtp);
                      setOtpError('');
                    }}
                    className="bg-amber-500 text-slate-950 text-xs font-bold"
                  >
                    <KeyRound className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Verify OTP</span>
                  </TouchableOpacity>
                )}

                {order.status === 'DELIVERED' && (
                  <div className="min-h-[46px] px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="truncate">Delivered</span>
                  </div>
                )}
              </div>
            </View>
          );
        }}
      />

      {/* 4-Digit Customer Delivery OTP Verification Bottom Sheet */}
      <BottomSheetModal
        visible={Boolean(otpOrder)}
        title="Verify Customer Delivery OTP"
        subtitle={
          otpOrder
            ? `${otpOrder.orderId} · ${otpOrder.customerName}`
            : undefined
        }
        onClose={() => setOtpOrder(null)}
      >
        {otpOrder && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex flex-col gap-1">
              <span className="text-xs text-slate-600 dark:text-purple-200">
                Ask customer <strong>{otpOrder.customerName}</strong> for their
                4-digit Delivery PIN.
              </span>
              <div className="flex flex-row items-center justify-between mt-1">
                <span className="text-xs font-mono-tabular text-purple-900 dark:text-amber-300 font-bold">
                  Customer Demo OTP: {otpOrder.deliveryOtp}
                </span>
                <button
                  type="button"
                  onClick={() => setOtpInput(otpOrder.deliveryOtp)}
                  className="text-xs font-bold text-purple-800 dark:text-amber-300 underline cursor-pointer"
                >
                  Auto-fill OTP
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-purple-100">
                Enter 4-Digit Delivery OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                required
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="e.g. 4829"
                className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-white dark:bg-[#120924] border border-purple-300 dark:border-purple-700 text-center text-lg font-extrabold tracking-widest font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>

            {otpError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {otpError}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#4C1D95] to-[#6D28D9] text-amber-300 font-bold text-sm shadow-md active:scale-[0.98] transition-transform cursor-pointer"
            >
              Confirm Delivery & Release Payout
            </button>
          </form>
        )}
      </BottomSheetModal>
    </ScrollView>
  );
};
