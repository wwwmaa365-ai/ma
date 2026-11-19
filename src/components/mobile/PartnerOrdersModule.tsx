import React, { useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  User,
  Info,
  Package,
  Truck,
  ArrowRight,
} from 'lucide-react';
import {
  DemoCustomer,
  DemoOrder,
  DemoOrderStatus,
} from '../../data/partnerDemoData.ts';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from '../rn/ReactNativePrimitives.tsx';

export type OrderSubView =
  | { type: 'LIST' }
  | { type: 'DETAILS'; orderId: string }
  | { type: 'TRACKING'; orderId: string }
  | { type: 'CUSTOMER'; customerId: string };

export interface PartnerOrdersModuleProps {
  orders: DemoOrder[];
  customers: DemoCustomer[];
  subView: OrderSubView;
  onSetSubView: (view: OrderSubView) => void;
  onUpdateOrderStatus: (orderId: string, status: DemoOrderStatus, note?: string) => void;
  onOpenChat: () => void;
}

const FILTERS: ('ALL' | DemoOrderStatus)[] = [
  'ALL',
  'NEW',
  'ACCEPTED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export const PartnerOrdersModule: React.FC<PartnerOrdersModuleProps> = ({
  orders,
  customers,
  subView,
  onSetSubView,
  onUpdateOrderStatus,
  onOpenChat,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | DemoOrderStatus>('ALL');

  // Screen 12: Customer Details
  if (subView.type === 'CUSTOMER') {
    const customer =
      customers.find((c) => c.id === subView.customerId) || customers[0];
    const custOrders = orders.filter((o) => o.customerId === customer.id);

    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-amber-300">
            VERIFIED CUSTOMER PROFILE (DEMO)
          </span>
          <Text className="text-base font-extrabold text-white">
            {customer.name}
          </Text>
          <span className="text-xs text-purple-200">
            {customer.phone} · {customer.city} · Joined {customer.joinedDate}
          </span>
        </View>

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Shipping & Contact Information
          </Text>
          <span className="text-xs text-slate-600 dark:text-purple-200">
            Email: {customer.email}
          </span>
          <span className="text-xs text-slate-600 dark:text-purple-200">
            Address: {customer.address}
          </span>
          <span className="text-xs text-purple-700 dark:text-amber-300">
            Seller Note: {customer.notes}
          </span>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex flex-col">
              <span className="text-[10px] text-slate-500 dark:text-purple-300">
                Total Orders
              </span>
              <span className="text-sm font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                {customer.totalOrders}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex flex-col">
              <span className="text-[10px] text-slate-500 dark:text-purple-300">
                Demo Lifetime Spend
              </span>
              <span className="text-sm font-extrabold font-mono-tabular text-purple-900 dark:text-amber-300">
                ₹{customer.totalSpentInr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <TouchableOpacity
            onPress={onOpenChat}
            className="w-full bg-[#4C1D95] text-amber-300 font-bold text-xs mt-1"
          >
            <span>Message {customer.name} in Customer Chat</span>
          </TouchableOpacity>
        </View>

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Customer Orders ({custOrders.length})
          </Text>
          {custOrders.map((ord) => (
            <button
              key={ord.id}
              type="button"
              onClick={() => onSetSubView({ type: 'DETAILS', orderId: ord.id })}
              className="w-full py-2.5 border-t border-purple-100 dark:border-purple-900/50 flex flex-row items-center justify-between text-left cursor-pointer"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-purple-900 dark:text-amber-300 font-mono-tabular">
                  {ord.id} · {ord.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-purple-300">
                  {ord.createdAt}
                </span>
              </div>
              <span className="text-xs font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                ₹{ord.subtotalInr.toLocaleString('en-IN')}
              </span>
            </button>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Screen 11: Order Tracking
  if (subView.type === 'TRACKING') {
    const order = orders.find((o) => o.id === subView.orderId) || orders[0];

    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-1.5">
          <span className="text-[10px] font-bold text-amber-300 font-mono-tabular">
            AWB: {order.awbCode} · {order.courierName}
          </span>
          <Text className="text-base font-extrabold text-white">
            Tracking {order.id} · {order.status.replace(/_/g, ' ')}
          </Text>
          <span className="text-xs text-purple-200">
            Rider: {order.riderName} ({order.riderPhone}) · Delivery OTP:{' '}
            <strong className="text-amber-300 font-mono-tabular">
              {order.deliveryOtp}
            </strong>
          </span>
        </View>

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-3">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Tracking Milestones ({order.trackingHistory.length})
          </Text>
          <div className="flex flex-col gap-3">
            {order.trackingHistory.map((step, idx) => (
              <div key={`${step.status}_${idx}`} className="flex flex-row items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {step.status.replace(/_/g, ' ')} · {step.location}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-purple-200">
                    {step.note}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-tabular">
                    {step.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </View>

        {order.status !== 'DELIVERED' && order.status !== 'REJECTED' && (
          <TouchableOpacity
            onPress={() =>
              onUpdateOrderStatus(
                order.id,
                order.status === 'OUT_FOR_DELIVERY'
                  ? 'DELIVERED'
                  : 'OUT_FOR_DELIVERY',
                'Milestone updated from Order Tracking screen (Demo)'
              )
            }
            className="w-full bg-amber-500 text-slate-950 font-extrabold text-xs"
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>
              {order.status === 'OUT_FOR_DELIVERY'
                ? `Mark Delivered (OTP ${order.deliveryOtp})`
                : 'Advance to Out for Delivery'}
            </span>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // Screen 10: Order Details
  if (subView.type === 'DETAILS') {
    const order = orders.find((o) => o.id === subView.orderId) || orders[0];
    const nextActionMap: Record<
      DemoOrderStatus,
      { label: string; next: DemoOrderStatus } | null
    > = {
      NEW: { label: 'Accept Order', next: 'ACCEPTED' },
      ACCEPTED: { label: 'Mark as Packed', next: 'PACKED' },
      PACKED: { label: 'Dispatch & Mark Shipped', next: 'SHIPPED' },
      SHIPPED: { label: 'Mark Out for Delivery', next: 'OUT_FOR_DELIVERY' },
      OUT_FOR_DELIVERY: {
        label: `Confirm Delivered (OTP ${order.deliveryOtp})`,
        next: 'DELIVERED',
      },
      DELIVERED: null,
      REJECTED: null,
    };
    const nextStep = nextActionMap[order.status];

    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-1.5">
          <div className="flex flex-row items-center justify-between text-xs">
            <span className="font-mono-tabular text-amber-300 font-bold">
              {order.invoiceNo}
            </span>
            <span className="font-bold text-white">
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <Text className="text-base font-extrabold text-white">
            {order.id} · {order.customerName}
          </Text>
          <span className="text-xs text-purple-200">
            {order.paymentMethod} · Delivery OTP:{' '}
            <strong className="text-amber-300 font-mono-tabular">
              {order.deliveryOtp}
            </strong>
          </span>
        </View>

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Customer & Delivery Address
          </Text>
          <span className="text-xs font-semibold text-slate-800 dark:text-purple-100">
            {order.customerName} ({order.customerPhone})
          </span>
          <span className="text-xs text-slate-500 dark:text-purple-300">
            {order.address}, {order.city} - {order.pincode}
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <TouchableOpacity
              onPress={() =>
                onSetSubView({ type: 'CUSTOMER', customerId: order.customerId })
              }
              className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Customer</span>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                onSetSubView({ type: 'TRACKING', orderId: order.id })
              }
              className="bg-amber-500 text-slate-950 text-xs font-extrabold"
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Track Order</span>
            </TouchableOpacity>
          </div>
        </View>

        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Items & Demo Commission Split
          </Text>
          {order.items.map((item, i) => (
            <div
              key={`${item.productId}_${i}`}
              className="flex flex-row items-center justify-between gap-2 text-xs py-1"
            >
              <span className="text-slate-800 dark:text-purple-100 truncate flex-1">
                {item.qty}× {item.name}
              </span>
              <span className="font-mono-tabular font-bold shrink-0">
                ₹{(item.qty * item.unitPriceInr).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-purple-100 dark:border-purple-900/50 flex flex-col gap-1 text-xs">
            <div className="flex flex-row justify-between text-slate-600 dark:text-purple-300">
              <span>Order Subtotal</span>
              <span className="font-mono-tabular">
                ₹{order.subtotalInr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex flex-row justify-between text-rose-600 dark:text-rose-400">
              <span>Platform Commission</span>
              <span className="font-mono-tabular">
                -₹{order.commissionInr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex flex-row justify-between font-extrabold text-purple-950 dark:text-amber-300 pt-1">
              <span>Net Seller Earning (Demo)</span>
              <span className="font-mono-tabular">
                ₹{order.netEarningInr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </View>

        {nextStep && (
          <TouchableOpacity
            onPress={() => onUpdateOrderStatus(order.id, nextStep.next)}
            className="w-full bg-[#4C1D95] text-amber-300 font-bold text-xs shadow-sm"
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>{nextStep.label}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // Screen 9: New Orders & All Orders List
  const filtered = orders.filter(
    (o) => statusFilter === 'ALL' || o.status === statusFilter
  );

  return (
    <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>Demo Orders — Test accepting new orders, status changes, and tracking milestones.</span>
      </div>

      <ScrollView horizontal className="pb-1">
        {FILTERS.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === st
                ? 'bg-[#4C1D95] text-amber-300 shadow-xs'
                : 'bg-white dark:bg-[#1E1136] text-slate-700 dark:text-purple-200 border border-purple-100 dark:border-purple-900/60'
            }`}
          >
            {st === 'ALL' ? `All (${orders.length})` : st.replace(/_/g, ' ')}
          </button>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        renderItem={({ item: order }) => (
          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 shadow-2xs gap-2">
            <div className="flex flex-row items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-purple-900 dark:text-amber-300 font-mono-tabular">
                {order.id} · {order.status.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-extrabold font-mono-tabular text-slate-900 dark:text-white">
                ₹{order.subtotalInr.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                onSetSubView({ type: 'CUSTOMER', customerId: order.customerId })
              }
              className="text-left text-xs font-bold text-purple-700 dark:text-amber-200 underline cursor-pointer"
            >
              {order.customerName} · {order.city} (Customer Details)
            </button>

            <span className="text-[11px] text-slate-500 dark:text-purple-300">
              {order.paymentMethod} · {order.createdAt} · OTP: {order.deliveryOtp}
            </span>

            <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/50 flex flex-col gap-1">
              {order.items.map((line, i) => (
                <div
                  key={`${line.productId}_${i}`}
                  className="flex flex-row justify-between gap-2 text-xs"
                >
                  <span className="truncate flex-1 text-slate-800 dark:text-purple-100">
                    {line.qty}× {line.name}
                  </span>
                  <span className="font-mono-tabular shrink-0 font-semibold">
                    ₹{(line.qty * line.unitPriceInr).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {order.status === 'NEW' ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <TouchableOpacity
                  onPress={() => onUpdateOrderStatus(order.id, 'ACCEPTED')}
                  className="bg-[#4C1D95] text-amber-300 font-bold text-xs"
                >
                  <span>Accept Order</span>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onUpdateOrderStatus(order.id, 'REJECTED')}
                  className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs"
                >
                  <span>Reject</span>
                </TouchableOpacity>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <TouchableOpacity
                  onPress={() =>
                    onSetSubView({ type: 'DETAILS', orderId: order.id })
                  }
                  className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 font-bold text-xs"
                >
                  <span>Order Details</span>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    onSetSubView({ type: 'TRACKING', orderId: order.id })
                  }
                  className="bg-amber-500 text-slate-950 font-extrabold text-xs"
                >
                  <span>Track Order</span>
                </TouchableOpacity>
              </div>
            )}
          </View>
        )}
      />
    </ScrollView>
  );
};
