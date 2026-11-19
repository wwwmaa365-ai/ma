import React, { useState } from 'react';
import {
  MessageSquare,
  Truck,
  Settings,
  Smartphone,
  ChevronRight,
  Send,
  LogOut,
  Save,
  Info,
  Terminal,
  UserCheck,
  Download,
  Bell,
  Star,
} from 'lucide-react';
import {
  DemoChatMessage,
  DemoOrder,
  DemoPartnerSettings,
  DemoShopProfile,
} from '../../data/partnerDemoData.ts';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from '../rn/ReactNativePrimitives.tsx';

export type ProfileSubScreen =
  | 'PROFILE'
  | 'NOTIFICATIONS'
  | 'FEEDBACK'
  | 'CHAT'
  | 'DELIVERY'
  | 'SETTINGS'
  | 'APK_BUILD_GUIDE';

export interface PartnerProfileScreensProps {
  subScreen: ProfileSubScreen;
  onSetSubScreen: (screen: ProfileSubScreen) => void;
  shopProfile: DemoShopProfile;
  settings: DemoPartnerSettings;
  orders: DemoOrder[];
  messages: DemoChatMessage[];
  pendingReviewCount: number;
  onUpdateProfile: (updates: Partial<DemoShopProfile>) => void;
  onUpdateSettings: (updates: Partial<DemoPartnerSettings>) => void;
  onSendChat: (text: string) => void;
  onAssignDelivery: (orderId: string, riderName: string, courierName: string) => void;
  onOpenOrderTracking: (orderId: string) => void;
  onLogout: () => void;
  viewportPreset: 'FLUID' | '320' | '360' | '375' | '390' | '412' | '430';
  onSetViewportPreset: (
    preset: 'FLUID' | '320' | '360' | '375' | '390' | '412' | '430'
  ) => void;
}

export const PartnerProfileScreens: React.FC<PartnerProfileScreensProps> = ({
  subScreen,
  onSetSubScreen,
  shopProfile,
  settings,
  orders,
  messages,
  pendingReviewCount,
  onUpdateProfile,
  onUpdateSettings,
  onSendChat,
  onAssignDelivery,
  onOpenOrderTracking,
  onLogout,
  viewportPreset,
  onSetViewportPreset,
}) => {
  const [replyText, setReplyText] = useState('');
  const [shopName, setShopName] = useState(shopProfile.shopName);
  const [city, setCity] = useState(shopProfile.city);
  const [upiId, setUpiId] = useState(shopProfile.upiId);
  const [savedBanner, setSavedBanner] = useState(false);

  // Screen 19: Customer Chat
  if (subScreen === 'CHAT') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
        <KeyboardAvoidingView>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Demo Customer Chat — Messages persist in your active demo session.</span>
          </div>

          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
            <div className="flex flex-col gap-2.5 max-h-[52dvh] overflow-y-auto pr-1">
              {messages.map((m) => {
                const isSeller = m.sender === 'SELLER';
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl max-w-[88%] flex flex-col gap-1 ${
                      isSeller
                        ? 'self-end bg-[#4C1D95] text-white'
                        : 'self-start bg-purple-50 dark:bg-purple-950/80 text-slate-900 dark:text-white border border-purple-200 dark:border-purple-800'
                    }`}
                  >
                    <div className="flex flex-row items-center justify-between gap-2 text-[10px]">
                      <span
                        className={
                          isSeller
                            ? 'text-amber-300 font-bold'
                            : 'text-purple-700 dark:text-amber-300 font-bold'
                        }
                      >
                        {isSeller ? 'You (Shop Partner)' : m.customerName}
                      </span>
                      {m.orderRef && (
                        <span className="font-mono-tabular opacity-80">{m.orderRef}</span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed break-words">{m.text}</p>
                    <span className="text-[10px] opacity-70 self-end">{m.timestamp}</span>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!replyText.trim()) return;
                onSendChat(replyText.trim());
                setReplyText('');
              }}
              className="pt-2 border-t border-purple-100 dark:border-purple-900/60 flex flex-row items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to customer message..."
                className="flex-1 min-h-[46px] px-3.5 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                aria-label="Send Message"
                className="min-w-[46px] min-h-[46px] rounded-xl bg-[#4C1D95] text-amber-300 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    );
  }

  // Screen 20: Delivery Management
  if (subScreen === 'DELIVERY') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Demo Delivery Dispatch — Assign store riders or courier AWB labels.</span>
        </div>

        {orders.map((order) => (
          <View
            key={order.id}
            className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2"
          >
            <div className="flex flex-row items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-purple-900 dark:text-amber-300 font-mono-tabular">
                {order.id} · {order.city}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-purple-200">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="text-xs text-slate-600 dark:text-purple-200">
              Courier: <strong>{order.courierName}</strong> · AWB: {order.awbCode}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-purple-300">
              Rider: {order.riderName} ({order.riderPhone}) · OTP: {order.deliveryOtp}
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <TouchableOpacity
                onPress={() =>
                  onAssignDelivery(order.id, 'Bikram Das', 'Sanjit Own Rider')
                }
                className="bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-bold"
              >
                <span className="truncate">Own Rider</span>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  onAssignDelivery(order.id, 'Raju Kalita', 'Shiprocket Express')
                }
                className="bg-amber-500 text-slate-950 text-xs font-extrabold"
              >
                <span className="truncate">Shiprocket AWB</span>
              </TouchableOpacity>
            </div>
            <button
              type="button"
              onClick={() => onOpenOrderTracking(order.id)}
              className="text-left text-xs font-bold text-purple-800 dark:text-amber-300 underline pt-1 cursor-pointer"
            >
              Open Live Tracking Timeline →
            </button>
          </View>
        ))}
      </ScrollView>
    );
  }

  // Screen 22: Settings
  if (subScreen === 'SETTINGS') {
    const rows: {
      key: keyof DemoPartnerSettings;
      label: string;
      desc: string;
    }[] = [
      {
        key: 'pushOrderAlerts',
        label: 'FCM New Order Alerts',
        desc: 'Instant sound & vibration on Android channel #order-alerts',
      },
      {
        key: 'orderStatusAlerts',
        label: 'FCM Order Status Updates',
        desc: 'Real-time alerts on #order-status when orders advance',
      },
      {
        key: 'lowStockAlerts',
        label: 'FCM Low Stock Warnings',
        desc: 'Alert on #low-stock when instruments or costumes drop below threshold',
      },
      {
        key: 'codEnabled',
        label: 'Cash on Delivery (COD)',
        desc: 'Allow customers to place COD orders with 4-digit OTP verification',
      },
      {
        key: 'autoAcceptOrders',
        label: 'Auto-Accept Orders',
        desc: 'Automatically accept incoming paid orders',
      },
      {
        key: 'vacationMode',
        label: 'Temporary Store Pause',
        desc: 'Pause incoming orders during holidays or stock audits',
      },
    ];

    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 divide-y divide-purple-100 dark:divide-purple-900/50">
          {rows.map((r) => {
            const on = settings[r.key];
            return (
              <div
                key={r.key}
                className="py-3 flex flex-row items-center justify-between gap-3"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">
                    {r.label}
                  </Text>
                  <span className="text-[11px] text-slate-500 dark:text-purple-300">
                    {r.desc}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => onUpdateSettings({ [r.key]: !on })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 flex items-center cursor-pointer ${
                    on ? 'bg-[#4C1D95] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
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
      </ScrollView>
    );
  }

  // Screen: Expo EAS Android APK Build Guide & 320px-430px Screen Width Tester
  if (subScreen === 'APK_BUILD_GUIDE') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Test Mobile Widths (320px – 430px)
          </Text>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'FLUID', label: '100% Full' },
                { id: '320', label: '320px' },
                { id: '360', label: '360px' },
                { id: '375', label: '375px' },
                { id: '390', label: '390px' },
                { id: '412', label: '412px' },
                { id: '430', label: '430px' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSetViewportPreset(preset.id)}
                className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold font-mono-tabular cursor-pointer ${
                  viewportPreset === preset.id
                    ? 'bg-[#4C1D95] text-amber-300 border border-amber-400/60'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-slate-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </View>

        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-4 text-white border border-amber-400/40 gap-3 shadow-md">
          <div className="flex flex-row items-center gap-2 text-amber-300">
            <Download className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold">
              Complete React Native + Expo Android Source Code (.ZIP)
            </span>
          </div>
          <span className="text-xs text-purple-100 leading-relaxed">
            Includes <strong className="text-amber-300">Expo SDK 52 + FCM Push Notifications</strong>: package.json, App.tsx, app.json, eas.json, tsconfig.json, Android FCM service &amp; channels, google-services.json.example, all 23 screens in src/, and automated GitHub Actions APK workflows.
          </span>

          <a
            href="/api/v1/download/expo-android-zip"
            download="sanjit-shop-partner-expo-android.zip"
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex flex-row items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download sanjit-shop-partner-expo-android.zip</span>
          </a>

          <div className="h-px bg-white/15" />

          <div className="flex flex-row items-center gap-2 text-amber-300">
            <Terminal className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold">
              GitHub Actions Automated Android APK Build
            </span>
          </div>
          <span className="text-xs text-purple-100 leading-relaxed">
            Push to GitHub → open <strong>Actions</strong> → run <strong>Build SANJIT SHOP PARTNER Android APK</strong> (zero secrets needed) or <strong>EAS Build Android APK</strong> (using <code>EXPO_TOKEN</code>).
          </span>
          <div className="p-3 rounded-xl bg-slate-950/90 text-amber-200 font-mono-tabular text-[11px] leading-relaxed flex flex-col gap-1 overflow-x-auto">
            <span>.github/workflows/build-android-apk.yml  (Zero-secret Gradle APK)</span>
            <span>.github/workflows/eas-build.yml          (Auto Expo EAS on push)</span>
            <span>FCM Channels: order-alerts · order-status · low-stock</span>
            <span>Package: in.sanjitmusical.shoppartner · v1.0.0</span>
          </div>
        </View>
      </ScrollView>
    );
  }

  // Screen 21: Shop Profile Tab Home
  return (
    <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
      <KeyboardAvoidingView>
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-2">
          <div className="flex flex-row items-center gap-2 text-amber-300 text-[10px] font-bold tracking-wider">
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>SANJIT SHOP PARTNER · DEMO PROFILE</span>
          </div>
          <Text className="text-base font-extrabold text-white">
            {shopProfile.shopName}
          </Text>
          <span className="text-xs text-purple-200">
            {shopProfile.ownerName} · {shopProfile.phone} · GST: {shopProfile.gstNumber}
          </span>
        </View>

        {/* Native Navigation Tap List */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl border border-purple-100 dark:border-purple-900/60 divide-y divide-purple-100 dark:divide-purple-900/50 overflow-hidden">
          {[
            {
              id: 'NOTIFICATIONS' as const,
              title: 'FCM Push Alerts & Channels',
              sub: 'Order alerts, status updates & low-stock notifications',
              icon: <Bell className="w-5 h-5" />,
            },
            {
              id: 'FEEDBACK' as const,
              title: 'Customer Feedback & Reviews',
              sub:
                pendingReviewCount > 0
                  ? `${pendingReviewCount} store & product reviews awaiting reply`
                  : 'All store & product reviews replied',
              icon: <Star className="w-5 h-5" />,
            },
            {
              id: 'CHAT' as const,
              title: 'Customer Chat',
              sub: `${messages.length} messages in support thread`,
              icon: <MessageSquare className="w-5 h-5" />,
            },
            {
              id: 'DELIVERY' as const,
              title: 'Delivery Management',
              sub: 'Assign own riders or Shiprocket / Delhivery AWB',
              icon: <Truck className="w-5 h-5" />,
            },
            {
              id: 'SETTINGS' as const,
              title: 'App Settings',
              sub: 'Push alerts, COD toggle, store pause',
              icon: <Settings className="w-5 h-5" />,
            },
            {
              id: 'APK_BUILD_GUIDE' as const,
              title: 'Android APK Build & Width Tester',
              sub: 'Test 320px–430px widths & Expo EAS APK commands',
              icon: <Smartphone className="w-5 h-5" />,
            },
          ].map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onSetSubScreen(row.id)}
              className="w-full min-h-[62px] px-3.5 py-3 flex flex-row items-center justify-between gap-3 text-left active:bg-purple-50 dark:active:bg-purple-950/50 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                {row.icon}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  {row.title}
                </Text>
                <span className="text-xs text-slate-500 dark:text-purple-300 truncate">
                  {row.sub}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ))}
        </View>

        {/* Edit Shop Profile Form */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/60 gap-3">
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            Edit Shop Profile
          </Text>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
              Shop Name
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
                Payout UPI (Demo)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {savedBanner && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Shop profile updated in Demo Mode.
            </span>
          )}

          <TouchableOpacity
            onPress={() => {
              onUpdateProfile({
                shopName: shopName.trim() || shopProfile.shopName,
                city: city.trim() || shopProfile.city,
                upiId: upiId.trim() || shopProfile.upiId,
              });
              setSavedBanner(true);
              setTimeout(() => setSavedBanner(false), 2000);
            }}
            className="w-full bg-[#4C1D95] text-amber-300 font-bold text-xs"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>Save Shop Profile</span>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLogout}
            className="w-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out (Test Splash / Login / OTP)</span>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};
