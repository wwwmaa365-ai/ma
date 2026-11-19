import React, { useState } from 'react';
import {
  Store,
  Users,
  Tag,
  Truck,
  MessageSquare,
  Smartphone,
  ChevronRight,
  PlusCircle,
  CheckCircle2,
  Send,
  Shield,
  LogIn,
  LogOut,
  Code2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  AppBuildJob,
  ChatMessage,
  CouponCode,
  DeliveryPartner,
  StaffMember,
  SubscriptionPlan,
  TenantStore,
} from '../../types/platform.ts';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  BottomSheetModal,
} from '../rn/ReactNativePrimitives.tsx';

export type HubSubScreen =
  | 'MAIN'
  | 'STORES'
  | 'STAFF_COUPONS'
  | 'DELIVERY_FLEET'
  | 'CHAT'
  | 'EXPO_ANDROID_BUILD';

export interface PartnerHubScreenProps {
  activeTenant: TenantStore;
  allTenants: TenantStore[];
  plans: SubscriptionPlan[];
  staff: StaffMember[];
  coupons: CouponCode[];
  deliveryPartners: DeliveryPartner[];
  messages: ChatMessage[];
  buildJobs: AppBuildJob[];
  firebaseUser: User | null;
  subScreen: HubSubScreen;
  onSetSubScreen: (screen: HubSubScreen) => void;
  onSelectTenant: (tenantId: string) => void;
  onCreateTenant: (payload: {
    storeName: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    city: string;
    state: string;
    customDomain: string;
    planId: 'starter' | 'growth' | 'enterprise';
    primaryColor: string;
    accentColor: string;
  }) => Promise<void>;
  onCreateStaff: (payload: {
    name: string;
    email: string;
    phone: string;
    roleTitle: StaffMember['roleTitle'];
  }) => Promise<{ ok: boolean; error?: string }>;
  onCreateCoupon: (payload: {
    code: string;
    discountPercent: number;
    maxDiscountInr: number;
    minOrderInr: number;
  }) => Promise<void>;
  onSendChat: (body: string) => Promise<void>;
  onTriggerAndroidBuild: () => Promise<void>;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  viewportPreset: 'FLUID' | '320' | '360' | '375' | '390' | '430';
  onSetViewportPreset: (
    preset: 'FLUID' | '320' | '360' | '375' | '390' | '430'
  ) => void;
}

export const PartnerHubScreen: React.FC<PartnerHubScreenProps> = ({
  activeTenant,
  allTenants,
  plans,
  staff,
  coupons,
  deliveryPartners,
  messages,
  buildJobs,
  firebaseUser,
  subScreen,
  onSetSubScreen,
  onSelectTenant,
  onCreateTenant,
  onCreateStaff,
  onCreateCoupon,
  onSendChat,
  onTriggerAndroidBuild,
  onSignInGoogle,
  onSignOutGoogle,
  viewportPreset,
  onSetViewportPreset,
}) => {
  const [newStoreSheet, setNewStoreSheet] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('+91 98640 12345');
  const [city, setCity] = useState('Guwahati');
  const [planId, setPlanId] = useState<'starter' | 'growth' | 'enterprise'>(
    'growth'
  );

  // Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] =
    useState<StaffMember['roleTitle']>('Catalog Manager');
  const [staffError, setStaffError] = useState('');

  // Coupon Form
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState('15');
  const [couponMax, setCouponMax] = useState('1500');
  const [couponMin, setCouponMin] = useState('2500');

  // Chat Form
  const [chatText, setChatText] = useState('');
  const [buildingApk, setBuildingApk] = useState(false);

  const handleCreateStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;
    await onCreateTenant({
      storeName: storeName.trim(),
      ownerName: ownerName.trim() || 'Partner Owner',
      ownerEmail: firebaseUser?.email || 'partner@sanjitmusical.in',
      ownerPhone: ownerPhone.trim(),
      city: city.trim() || 'Guwahati',
      state: 'Assam',
      customDomain: `${storeName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')}.sanjitmusical.in`,
      planId,
      primaryColor: '#4C1D95',
      accentColor: '#D97706',
    });
    setStoreName('');
    setNewStoreSheet(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    if (!staffName.trim()) return;
    const res = await onCreateStaff({
      name: staffName.trim(),
      email: `${staffName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '.')}@sanjitmusical.in`,
      phone: staffPhone.trim() || '+91 98640 55110',
      roleTitle: staffRole,
    });
    if (!res.ok) {
      setStaffError(res.error || 'Could not add staff member');
    } else {
      setStaffName('');
      setStaffPhone('');
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await onCreateCoupon({
      code: couponCode.trim().toUpperCase(),
      discountPercent: Number(couponPercent) || 10,
      maxDiscountInr: Number(couponMax) || 1000,
      minOrderInr: Number(couponMin) || 2000,
    });
    setCouponCode('');
  };

  const handleSendChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    const msg = chatText.trim();
    setChatText('');
    await onSendChat(msg);
  };

  // SUB-SCREEN 1: MULTI-TENANT STORES
  if (subScreen === 'STORES') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-2">
          <Text className="text-sm font-bold text-amber-300">
            Multi-Tenant White-Label Stores
          </Text>
          <p className="text-xs text-purple-100 leading-relaxed">
            Each tenant store has strict database & API header isolation (
            <code className="text-amber-300">x-tenant-id</code>). Switch active
            partner store or register a new branded musical/dance shop.
          </p>
          <TouchableOpacity
            onPress={() => setNewStoreSheet(true)}
            className="bg-amber-500 text-slate-950 font-bold text-xs mt-1"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Register New Branded Seller Store</span>
          </TouchableOpacity>
        </View>

        <div className="flex flex-col gap-2.5">
          {allTenants.map((tenant) => {
            const isCurrent = tenant.tenantId === activeTenant.tenantId;
            return (
              <button
                key={tenant.tenantId}
                type="button"
                onClick={() => onSelectTenant(tenant.tenantId)}
                className={`w-full p-3.5 rounded-2xl border text-left flex flex-row items-center justify-between gap-2.5 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-950 text-white border-amber-400 shadow-md'
                    : 'bg-white dark:bg-[#1E1136] text-slate-900 dark:text-white border-purple-100 dark:border-purple-900/60'
                }`}
              >
                <div className="flex flex-row items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-amber-300'
                    }`}
                  >
                    {tenant.logoText}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-sm font-bold">
                      {tenant.storeName}
                    </Text>
                    <span
                      className={`text-[11px] truncate ${
                        isCurrent
                          ? 'text-amber-200'
                          : 'text-slate-500 dark:text-purple-300'
                      }`}
                    >
                      {tenant.customDomain} · {tenant.city}
                    </span>
                    <span
                      className={`text-[10px] font-mono-tabular mt-0.5 ${
                        isCurrent
                          ? 'text-purple-200'
                          : 'text-purple-700 dark:text-amber-300'
                      }`}
                    >
                      Tenant ID: {tenant.tenantId} · Plan:{' '}
                      {tenant.planId.toUpperCase()}
                    </span>
                  </div>
                </div>
                {isCurrent ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <BottomSheetModal
          visible={newStoreSheet}
          title="Register New Partner Store"
          subtitle="Instant isolated white-label tenant onboarding"
          onClose={() => setNewStoreSheet(false)}
        >
          <form onSubmit={handleCreateStoreSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Store Name (e.g. Brahmaputra Violins & Dance)"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Owner Full Name"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                required
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="Phone"
                className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full min-h-[46px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <select
              value={planId}
              onChange={(e) =>
                setPlanId(
                  e.target.value as 'starter' | 'growth' | 'enterprise'
                )
              }
              className="w-full min-h-[46px] px-3 py-2.5 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.monthlyPriceInr}/mo ({p.productLimit} SKUs)
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#4C1D95] text-amber-300 font-bold text-sm cursor-pointer"
            >
              Launch Isolated Partner Store
            </button>
          </form>
        </BottomSheetModal>
      </ScrollView>
    );
  }

  // SUB-SCREEN 2: STAFF & PROMO COUPONS
  if (subScreen === 'STAFF_COUPONS') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        {/* Promo Coupons Card */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            Store Discount Coupons ({coupons.length})
          </Text>
          <div className="flex flex-col gap-2">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/60 border border-purple-200/70 dark:border-purple-800 flex flex-row items-center justify-between gap-2"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-extrabold text-purple-900 dark:text-amber-300 font-mono-tabular">
                    {c.code} · {c.discountPercent}% OFF
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-purple-300">
                    Min ₹{c.minOrderInr} · Max Discount ₹{c.maxDiscountInr}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                  Active
                </span>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddCoupon}
            className="pt-2 border-t border-purple-100 dark:border-purple-900/50 flex flex-col gap-2"
          >
            <span className="text-xs font-bold text-slate-800 dark:text-purple-100">
              Create New Festival Coupon
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Code (e.g. DURGA20)"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
              <input
                type="number"
                inputMode="numeric"
                required
                value={couponPercent}
                onChange={(e) => setCouponPercent(e.target.value)}
                placeholder="Discount %"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs font-mono-tabular text-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[46px] rounded-xl bg-[#4C1D95] text-amber-300 font-bold text-xs cursor-pointer"
            >
              + Activate Store Coupon
            </button>
          </form>
        </View>

        {/* Staff Accounts Card */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            Store Staff & Role Permissions ({staff.length})
          </Text>
          <div className="flex flex-col gap-2">
            {staff.map((member) => (
              <div
                key={member.staffId}
                className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/50 flex flex-row items-center justify-between gap-2"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {member.name}
                  </Text>
                  <span className="text-[11px] text-purple-700 dark:text-amber-300">
                    {member.roleTitle} · {member.phone}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                  Active
                </span>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddStaff}
            className="pt-2 border-t border-purple-100 dark:border-purple-900/50 flex flex-col gap-2"
          >
            <span className="text-xs font-bold text-slate-800 dark:text-purple-100">
              Add Store Staff Member
            </span>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Staff Full Name"
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                placeholder="Mobile Number"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              />
              <select
                value={staffRole}
                onChange={(e) =>
                  setStaffRole(e.target.value as StaffMember['roleTitle'])
                }
                className="w-full min-h-[44px] px-2.5 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="Catalog Manager">Catalog Manager</option>
                <option value="Order Fulfillment Lead">
                  Order Fulfillment Lead
                </option>
                <option value="Inventory Auditor">Inventory Auditor</option>
                <option value="Support Specialist">Support Specialist</option>
              </select>
            </div>
            {staffError && (
              <p className="text-xs text-rose-600 font-semibold">{staffError}</p>
            )}
            <button
              type="submit"
              className="w-full min-h-[46px] rounded-xl bg-[#4C1D95] text-amber-300 font-bold text-xs cursor-pointer"
            >
              + Assign Staff Account
            </button>
          </form>
        </View>
      </ScrollView>
    );
  }

  // SUB-SCREEN 3: DELIVERY FLEET
  if (subScreen === 'DELIVERY_FLEET') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-1.5">
          <Text className="text-sm font-bold text-amber-300">
            Own Delivery Fleet & Courier Settings
          </Text>
          <span className="text-xs text-purple-200">
            Default Courier: {activeTenant.deliveryConfig.defaultCourierProvider}{' '}
            · Free delivery above ₹
            {activeTenant.deliveryConfig.freeDeliveryThresholdInr}
          </span>
        </View>

        <div className="flex flex-col gap-2.5">
          {deliveryPartners.map((rider) => (
            <View
              key={rider.partnerId}
              className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-1.5"
            >
              <div className="flex flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  {rider.name}
                </Text>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  ★ {rider.rating} · {rider.status.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs text-slate-600 dark:text-purple-200">
                {rider.vehicleType} ({rider.vehicleNumber}) · Zone:{' '}
                {rider.currentZone}
              </span>
              <span className="text-[11px] font-mono-tabular text-purple-700 dark:text-amber-300">
                {rider.phone} · {rider.completedDeliveries} deliveries completed
              </span>
            </View>
          ))}
        </div>
      </ScrollView>
    );
  }

  // SUB-SCREEN 4: CUSTOMER SUPPORT CHAT
  if (subScreen === 'CHAT') {
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3">
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <Text className="text-xs font-bold text-purple-800 dark:text-amber-300">
            Direct Customer & Platform Support Thread
          </Text>

          <div className="flex flex-col gap-2.5 max-h-[52dvh] overflow-y-auto pr-1">
            {messages.map((m) => {
              const isSeller = m.senderRole === 'SELLER_ADMIN';
              return (
                <div
                  key={m.messageId}
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
                      {m.senderName}
                    </span>
                    {m.orderId && (
                      <span className="font-mono-tabular opacity-80">
                        {m.orderId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed break-words">{m.body}</p>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleSendChatSubmit}
            className="pt-2 border-t border-purple-100 dark:border-purple-900/60 flex flex-row items-center gap-2"
          >
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Reply to customer inquiry..."
              className="flex-1 min-h-[46px] px-3.5 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="min-w-[46px] min-h-[46px] rounded-xl bg-[#4C1D95] text-amber-300 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </View>
      </ScrollView>
    );
  }

  // SUB-SCREEN 5: EXPO REACT NATIVE ANDROID BUILDER & SCREEN SIZE TESTER
  if (subScreen === 'EXPO_ANDROID_BUILD') {
    const wl = activeTenant.whiteLabelAppConfig;
    return (
      <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
        {/* Android Screen Size Viewport Tester (320px, 360px, 375px, 390px, 430px, 100% Fluid) */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <Text className="text-xs font-bold text-slate-900 dark:text-white">
            Android Display Size Calibration (320px – 430px+)
          </Text>
          <p className="text-[11px] text-slate-500 dark:text-purple-300">
            Test every screen across small, medium, and large Android device
            widths or keep 100% Fluid Full-Screen mode.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'FLUID', label: '100% Native' },
                { id: '320', label: '320px Small' },
                { id: '360', label: '360px Android' },
                { id: '375', label: '375px Medium' },
                { id: '390', label: '390px Pixel' },
                { id: '430', label: '430px Large' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSetViewportPreset(preset.id)}
                className={`min-h-[42px] px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono-tabular transition-colors cursor-pointer ${
                  viewportPreset === preset.id
                    ? 'bg-[#4C1D95] text-amber-300 border border-amber-400/50'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-slate-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </View>

        {/* White-Label Expo EAS Android Build Card */}
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-2.5">
          <div className="flex flex-row items-center justify-between">
            <span className="text-xs font-bold text-amber-300">
              Expo EAS Android White-Label Config
            </span>
            <span className="text-[11px] font-mono-tabular text-purple-200">
              v{wl.lastBuildVersion}
            </span>
          </div>
          <Text className="text-base font-extrabold text-white">
            {wl.appDisplayName}
          </Text>
          <span className="text-xs font-mono-tabular text-purple-200 break-all">
            Package: {wl.packageIdentifier}
          </span>
          <span className="text-xs text-amber-200">
            Android Status: <strong>{wl.androidBuildStatus}</strong>
          </span>

          <TouchableOpacity
            disabled={buildingApk}
            onPress={async () => {
              setBuildingApk(true);
              try {
                await onTriggerAndroidBuild();
              } finally {
                setBuildingApk(false);
              }
            }}
            className="bg-amber-500 text-slate-950 font-bold text-xs mt-1"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>
              {buildingApk
                ? 'Building Android APK/AAB...'
                : 'Build Signed Android .APK / .AAB'}
            </span>
          </TouchableOpacity>
        </View>

        {/* Recent EAS Build Jobs & Logs */}
        {buildJobs.map((job) => (
          <View
            key={job.jobId}
            className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2"
          >
            <div className="flex flex-row items-center justify-between text-xs">
              <span className="font-bold text-purple-900 dark:text-amber-300 font-mono-tabular">
                {job.jobId} · {job.platform}
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {job.status}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 text-purple-200 font-mono-tabular text-[10px] flex flex-col gap-1">
              {job.logs.map((line, i) => (
                <div key={i} className="break-words">
                  {line}
                </div>
              ))}
            </div>
          </View>
        ))}
      </ScrollView>
    );
  }

  // DEFAULT PARTNER HUB MENU (Native Mobile Tap List Rows)
  return (
    <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
      {/* Partner Profile & Google Auth Card */}
      <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#5B21B6] p-4 text-white border border-amber-400/30 gap-3">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-bold text-amber-300">
              VERIFIED SANJIT SHOP PARTNER
            </span>
            <Text
              numberOfLines={1}
              className="text-base font-extrabold text-white"
            >
              {activeTenant.ownerName}
            </Text>
            <span className="text-xs text-purple-200 truncate">
              {firebaseUser?.email || activeTenant.ownerEmail} ·{' '}
              {activeTenant.ownerPhone}
            </span>
          </div>

          {firebaseUser ? (
            <button
              type="button"
              onClick={onSignOutGoogle}
              className="min-h-[42px] px-3 rounded-xl bg-white/15 text-amber-200 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="min-h-[42px] px-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Sync</span>
            </button>
          )}
        </div>

        <div className="pt-2 border-t border-white/15 flex flex-row items-center justify-between text-xs text-purple-200">
          <span>GSTIN: {activeTenant.gstNumber}</span>
          <span className="text-amber-300 font-bold">
            UPI: {activeTenant.paymentConfig.upiVpa}
          </span>
        </div>
      </View>

      {/* Native Android Tap List Menu Rows */}
      <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl border border-purple-100 dark:border-purple-900/60 divide-y divide-purple-100 dark:divide-purple-900/50 overflow-hidden">
        <button
          type="button"
          onClick={() => onSetSubScreen('STORES')}
          className="w-full min-h-[64px] px-3.5 py-3 flex flex-row items-center justify-between gap-3 text-left active:bg-purple-50 dark:active:bg-purple-950/50 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-800 dark:text-amber-300 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              Branded Stores & Multi-Tenant SaaS
            </Text>
            <span className="text-xs text-slate-500 dark:text-purple-300 truncate">
              Switch store ({allTenants.length} tenants) or onboard new shop
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onSetSubScreen('STAFF_COUPONS')}
          className="w-full min-h-[64px] px-3.5 py-3 flex flex-row items-center justify-between gap-3 text-left active:bg-purple-50 dark:active:bg-purple-950/50 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-800 dark:text-amber-300 shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              Promo Coupons & Staff Accounts
            </Text>
            <span className="text-xs text-slate-500 dark:text-purple-300 truncate">
              {coupons.length} active coupons · {staff.length} staff members
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onSetSubScreen('DELIVERY_FLEET')}
          className="w-full min-h-[64px] px-3.5 py-3 flex flex-row items-center justify-between gap-3 text-left active:bg-purple-50 dark:active:bg-purple-950/50 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-800 dark:text-amber-300 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              Delivery Riders & Courier Config
            </Text>
            <span className="text-xs text-slate-500 dark:text-purple-300 truncate">
              {deliveryPartners.length} own delivery riders ·{' '}
              {activeTenant.deliveryConfig.defaultCourierProvider}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onSetSubScreen('CHAT')}
          className="w-full min-h-[64px] px-3.5 py-3 flex flex-row items-center justify-between gap-3 text-left active:bg-purple-50 dark:active:bg-purple-950/50 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-800 dark:text-amber-300 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              Customer Support Chat
            </Text>
            <span className="text-xs text-slate-500 dark:text-purple-300 truncate">
              {messages.length} messages · Real-time order inquiries
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onSetSubScreen('EXPO_ANDROID_BUILD')}
          className="w-full min-h-[64px] px-3.5 py-3 flex flex-row items-center justify-between gap-3 text-left active:bg-purple-50 dark:active:bg-purple-950/50 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              Expo Android APK Builder & Screen Sizes
            </Text>
            <span className="text-xs text-slate-500 dark:text-purple-300 truncate">
              Build Android APK/AAB & test 320px–430px widths
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </View>

      {/* Tenant Isolation Security Badge Card */}
      <View className="w-full bg-purple-50/80 dark:bg-purple-950/40 rounded-2xl p-3.5 border border-purple-200/80 dark:border-purple-800/60 flex flex-row items-center gap-3">
        <Shield className="w-5 h-5 text-purple-800 dark:text-amber-300 shrink-0" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-bold text-purple-950 dark:text-amber-200">
            Strict Tenant Data Isolation Active
          </span>
          <span className="text-[11px] text-slate-600 dark:text-purple-300">
            Scoped to {activeTenant.tenantId} · Custom Domain:{' '}
            {activeTenant.customDomain}
          </span>
        </div>
      </View>
    </ScrollView>
  );
};
