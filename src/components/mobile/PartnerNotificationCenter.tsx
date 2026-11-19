import React, { useState } from 'react';
import {
  Bell,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  CheckCheck,
  Radio,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  DemoNotificationItem,
  DemoNotificationType,
  DemoPartnerSettings,
} from '../../data/partnerDemoData.ts';
import { fcmSenderId } from '../../services/firebaseClient.ts';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from '../rn/ReactNativePrimitives.tsx';

export interface FcmHeadsUpBannerProps {
  notification: DemoNotificationItem | null;
  onDismiss: () => void;
  onOpen: (item: DemoNotificationItem) => void;
}

export const FcmHeadsUpBanner: React.FC<FcmHeadsUpBannerProps> = ({
  notification,
  onDismiss,
  onOpen,
}) => {
  if (!notification) return null;

  return (
    <div className="fixed top-12 left-3 right-3 z-50 max-w-[410px] mx-auto animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="w-full rounded-2xl bg-[#2E1065] text-white border border-amber-400/70 shadow-xl p-3 flex flex-row items-start gap-2.5">
        <button
          type="button"
          onClick={() => onOpen(notification)}
          className="flex-1 min-w-0 flex flex-row items-start gap-2.5 text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            {notification.type === 'LOW_STOCK' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : notification.type === 'NEW_ORDER' ? (
              <ShoppingBag className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            <div className="flex flex-row items-center gap-1.5">
              <span className="text-[9px] font-extrabold tracking-wider text-amber-300 font-mono-tabular">
                FCM · #{notification.channelId}
              </span>
              <span className="text-[9px] text-purple-200">{notification.timestamp}</span>
            </div>
            <span className="text-xs font-extrabold text-white truncate">
              {notification.title}
            </span>
            <span className="text-[11px] text-purple-100 line-clamp-2 leading-snug">
              {notification.body}
            </span>
          </div>
        </button>
        <button
          type="button"
          aria-label="Dismiss Notification"
          onClick={onDismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-200 hover:bg-white/10 shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export interface PartnerNotificationCenterProps {
  notifications: DemoNotificationItem[];
  settings: DemoPartnerSettings;
  fcmToken: string;
  fcmSyncedAt: string;
  onUpdateSettings: (updates: Partial<DemoPartnerSettings>) => void;
  onRefreshToken: () => void;
  onMarkAllRead: () => void;
  onOpenNotification: (item: DemoNotificationItem) => void;
  onSimulateNewOrder: () => void;
  onSimulateStatusUpdate: () => void;
  onSimulateLowStock: () => void;
}

export const PartnerNotificationCenter: React.FC<PartnerNotificationCenterProps> = ({
  notifications,
  settings,
  fcmToken,
  fcmSyncedAt,
  onUpdateSettings,
  onRefreshToken,
  onMarkAllRead,
  onOpenNotification,
  onSimulateNewOrder,
  onSimulateStatusUpdate,
  onSimulateLowStock,
}) => {
  const [filter, setFilter] = useState<'ALL' | DemoNotificationType>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    filter === 'ALL'
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const maskedToken = `${fcmToken.slice(0, 20)}...${fcmToken.slice(-8)}`;

  return (
    <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>Android FCM Ready:</strong> Dedicated channels (order-alerts, order-status, low-stock) + Firestore token registry &amp; interactive push simulator.
        </span>
      </div>

      {/* Royal Purple FCM Status Hero */}
      <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#5B21B6] p-4 text-white border border-amber-400/35 gap-3 shadow-md">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-1.5 text-amber-300 text-[10px] font-extrabold tracking-wider">
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>FIREBASE CLOUD MESSAGING</span>
          </div>
          <span className="text-[10px] font-bold font-mono-tabular px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
            Sender #{fcmSenderId}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <Text className="text-lg font-extrabold text-white">
            {unreadCount} Unread Seller Alert{unreadCount === 1 ? '' : 's'}
          </Text>
          <span className="text-[11px] text-purple-200">
            Last token sync: {fcmSyncedAt} · Package: in.sanjitmusical.shoppartner
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 flex flex-col gap-0.5">
          <span className="text-[10px] text-purple-200 font-semibold">
            Device Registration Token (FCM)
          </span>
          <span className="text-[11px] font-mono-tabular text-amber-300 truncate">
            {maskedToken}
          </span>
        </div>

        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            onRefreshToken();
            setTimeout(() => setRefreshing(false), 600);
          }}
          className="w-full bg-amber-500 text-slate-950 font-extrabold text-xs"
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing FCM Token...' : 'Refresh FCM Token & Channels'}</span>
        </TouchableOpacity>
      </View>

      {/* Android Notification Channels */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 divide-y divide-purple-100 dark:divide-purple-900/50">
        <div className="pb-2">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Android FCM Notification Channels
          </Text>
        </div>
        {(
          [
            {
              key: 'pushOrderAlerts',
              channel: 'order-alerts',
              title: 'New Order Alerts',
              desc: 'MAX importance · Instant heads-up banner & sound',
            },
            {
              key: 'orderStatusAlerts',
              channel: 'order-status',
              title: 'Order Status Updates',
              desc: 'HIGH importance · Packed, shipped & delivery milestones',
            },
            {
              key: 'lowStockAlerts',
              channel: 'low-stock',
              title: 'Low Stock Warnings',
              desc: 'HIGH importance · Fires when SKU stock drops to threshold',
            },
          ] as const
        ).map((ch) => {
          const on = settings[ch.key];
          return (
            <div
              key={ch.key}
              className="py-2.5 flex flex-row items-center justify-between gap-3"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex flex-row items-center gap-1.5">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">
                    {ch.title}
                  </Text>
                  <span className="text-[10px] font-mono-tabular text-purple-700 dark:text-amber-300">
                    #{ch.channel}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-purple-300">
                  {ch.desc}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => onUpdateSettings({ [ch.key]: !on })}
                className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center cursor-pointer ${
                  on
                    ? 'bg-[#4C1D95] justify-end'
                    : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full block shadow-xs ${
                    on ? 'bg-amber-400' : 'bg-white'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </View>

      {/* Interactive Real-Time Push Triggers */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
        <Text className="text-xs font-bold text-slate-900 dark:text-white">
          Test Live FCM Push Payloads
        </Text>
        <div className="grid grid-cols-1 gap-2">
          <TouchableOpacity
            onPress={onSimulateNewOrder}
            className="w-full bg-[#4C1D95] text-amber-300 font-bold text-xs"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Simulate New Order Alert (#order-alerts)</span>
          </TouchableOpacity>
          <div className="grid grid-cols-2 gap-2">
            <TouchableOpacity
              onPress={onSimulateStatusUpdate}
              className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 font-bold text-xs"
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span className="truncate">Status Update</span>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSimulateLowStock}
              className="bg-amber-500 text-slate-950 font-extrabold text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">Low Stock Alert</span>
            </TouchableOpacity>
          </div>
        </div>
      </View>

      {/* Notification Inbox */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
        <div className="flex flex-row items-center justify-between gap-2">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Seller Alert Inbox ({filtered.length})
          </Text>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex flex-row items-center gap-1 text-xs font-bold text-purple-800 dark:text-amber-300 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'NEW_ORDER', label: 'Orders' },
              { id: 'ORDER_STATUS', label: 'Status' },
              { id: 'LOW_STOCK', label: 'Stock' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[34px] rounded-xl text-[11px] font-bold cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#4C1D95] text-amber-300'
                  : 'bg-purple-50 dark:bg-purple-950/60 text-slate-700 dark:text-purple-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenNotification(item)}
              className={`w-full p-3 rounded-xl border text-left flex flex-row items-start gap-2.5 active:scale-[0.99] cursor-pointer ${
                item.read
                  ? 'bg-[#FAF8FE] dark:bg-[#160B2B] border-purple-100 dark:border-purple-900/60'
                  : 'bg-purple-50/90 dark:bg-purple-950/80 border-purple-300 dark:border-amber-400/50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'LOW_STOCK'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-amber-300'
                }`}
              >
                {item.type === 'LOW_STOCK' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : item.type === 'NEW_ORDER' ? (
                  <ShoppingBag className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                <div className="flex flex-row items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-purple-300 shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-purple-200 leading-relaxed">
                  {item.body}
                </p>
                <div className="flex flex-row items-center justify-between pt-0.5">
                  <span className="text-[10px] font-bold font-mono-tabular text-purple-800 dark:text-amber-300">
                    #{item.channelId} · Tap to open {item.type === 'LOW_STOCK' ? 'Inventory' : 'Order'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </View>
    </ScrollView>
  );
};
