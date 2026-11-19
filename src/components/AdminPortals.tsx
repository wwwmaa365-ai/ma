import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Truck,
  Package,
  Smartphone,
  Download,
  Send,
  Flag,
  Ban,
  Play,
  Terminal,
  RefreshCw,
  Bell,
  Users,
  Lock,
} from 'lucide-react';
import {
  CategoryNode,
  SubscriptionPlan,
  TenantStore,
  ProductItem,
  CouponCode,
  OrderRecord,
  DeliveryPartner,
  StaffMember,
  ChatMessage,
  SubscriptionPaymentRecord,
  AppBuildJob,
  NotificationItem,
  AuditLogEntry,
  WorkspacePortal,
} from '../types/platform.ts';
import {
  IMG_ACOUSTIC_GUITAR,
  IMG_TABLA_SET,
  IMG_DJ_MIXER,
  IMG_DANCE_DRESS,
} from '../data/seedData.ts';
import { dirtyDozenSecuritySuite } from '../../firestore.rules.test.ts';

interface AdminPortalsProps {
  activePortal: WorkspacePortal;
  tenant: TenantStore;
  allTenants: TenantStore[];
  categories: CategoryNode[];
  plans: SubscriptionPlan[];
  products: ProductItem[];
  coupons: CouponCode[];
  orders: OrderRecord[];
  deliveryPartners: DeliveryPartner[];
  staff: StaffMember[];
  messages: ChatMessage[];
  notifications: NotificationItem[];
  buildJobs: AppBuildJob[];
  financialSummary: {
    grossProductSalesInr: number;
    totalCommissionInr: number;
    netSellerRevenueInr: number;
    lowStockCount: number;
  };
  onSelectTenant: (tenantId: string) => void;
  onRefreshAll: () => Promise<void>;
  onSendWsChat: (payload: {
    tenantId: string;
    senderId: string;
    senderName: string;
    senderRole: 'CUSTOMER' | 'SELLER_ADMIN' | 'MASTER_ADMIN';
    recipientId: string;
    orderId?: string;
    body: string;
  }) => void;
}

export const AdminPortals: React.FC<AdminPortalsProps> = ({
  activePortal,
  tenant,
  allTenants,
  categories,
  plans,
  products,
  coupons,
  orders,
  deliveryPartners,
  staff,
  messages,
  notifications,
  buildJobs,
  financialSummary,
  onSelectTenant,
  onRefreshAll,
  onSendWsChat,
}) => {
  const [statusToast, setStatusToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Master Admin Overview State
  const [masterData, setMasterData] = useState<{
    metrics: {
      totalRegisteredSellers: number;
      activeStores: number;
      inactiveStores: number;
      totalOrders: number;
      grossMerchandiseVolumeInr: number;
      saasSubscriptionRevenueInr: number;
      totalPlatformCommissionInr: number;
      netSellerSettlementsInr: number;
      pendingSubscriptions: number;
      expiredSubscriptions: number;
    };
    subscriptionPayments: SubscriptionPaymentRecord[];
    auditLogs: AuditLogEntry[];
  } | null>(null);

  // New Tenant Onboarding Form
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [newCity, setNewCity] = useState('Guwahati');
  const [newPlanId, setNewPlanId] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [newPrimaryColor, setNewPrimaryColor] = useState('#4C1D95');
  const [newAccentColor, setNewAccentColor] = useState('#D97706');

  // Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatSubs, setNewCatSubs] = useState('');

  // Seller Product Form
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCat, setProdCat] = useState(categories[0]?.name || 'MUSICAL INSTRUMENTS');
  const [prodSubcat, setProdSubcat] = useState(
    categories[0]?.subcategories[0] || 'Acoustic Guitar'
  );
  const [prodPrice, setProdPrice] = useState('16500');
  const [prodStock, setProdStock] = useState('12');
  const [prodImage, setProdImage] = useState(IMG_ACOUSTIC_GUITAR);
  const [prodVariantColor, setProdVariantColor] = useState('Natural Concert Gloss');
  const [prodVariantSize, setProdVariantSize] = useState('Standard');

  // Seller Coupon Form
  const [cpnCode, setCpnCode] = useState('');
  const [cpnPct, setCpnPct] = useState('15');
  const [cpnMin, setCpnMin] = useState('2500');

  // Seller Branding Form
  const [brandStoreName, setBrandStoreName] = useState(tenant.storeName);
  const [brandDomain, setBrandDomain] = useState(tenant.customDomain);
  const [brandPrimary, setBrandPrimary] = useState(tenant.primaryColor);
  const [brandAccent, setBrandAccent] = useState(tenant.accentColor);
  const [brandUpi, setBrandUpi] = useState(tenant.paymentConfig.upiVpa);

  // Cross-Tenant Isolation Test Result
  const [isolationProbeResult, setIsolationProbeResult] = useState<string>('');

  // Delivery & Courier Calculator State
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [calcWeight, setCalcWeight] = useState('4.5');
  const [calcOriginPin, setCalcOriginPin] = useState('781005');
  const [calcDestPin, setCalcDestPin] = useState('786001');
  const [courierQuotes, setCourierQuotes] = useState<
    {
      provider: string;
      serviceName: string;
      estimatedDays: string;
      totalChargeInr: number;
    }[]
  >([]);

  // Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<
    'Catalog Manager' | 'Order Fulfillment Lead' | 'Inventory Auditor' | 'Support Specialist'
  >('Catalog Manager');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatSenderRole, setChatSenderRole] = useState<'CUSTOMER' | 'SELLER_ADMIN'>('SELLER_ADMIN');
  const [chatOrderId, setChatOrderId] = useState(orders[0]?.orderId || '');

  // Automated Test Suite & OpenAPI State
  const [testSuiteReport, setTestSuiteReport] = useState<{
    allPassed: boolean;
    executedAt: string;
    results: {
      id: string;
      module: string;
      assertion: string;
      passed: boolean;
      details: string;
    }[];
  } | null>(null);
  const [openApiSpec, setOpenApiSpec] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setBrandStoreName(tenant.storeName);
    setBrandDomain(tenant.customDomain);
    setBrandPrimary(tenant.primaryColor);
    setBrandAccent(tenant.accentColor);
    setBrandUpi(tenant.paymentConfig.upiVpa);
  }, [tenant]);

  const loadMasterOverview = async () => {
    const res = await fetch('/api/v1/master/overview');
    if (res.ok) {
      const data = await res.json();
      setMasterData(data);
    }
  };

  useEffect(() => {
    if (activePortal === 'MASTER_ADMIN') {
      loadMasterOverview();
    }
    if (activePortal === 'WHITELABEL_APP_BUILDER' || activePortal === 'API_DOCS_TESTS') {
      runAutomatedTests();
      fetch('/api/docs/openapi.json')
        .then((r) => r.json())
        .then(setOpenApiSpec);
    }
  }, [activePortal, tenant.tenantId]);

  const handleOnboardTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/v1/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: newStoreName,
        ownerName: newOwnerName,
        ownerEmail: newOwnerEmail,
        customDomain: newCustomDomain,
        city: newCity,
        planId: newPlanId,
        primaryColor: newPrimaryColor,
        accentColor: newAccentColor,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusToast({ type: 'error', text: data.error || 'Failed to onboard tenant' });
      return;
    }
    setNewStoreName('');
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewCustomDomain('');
    setStatusToast({
      type: 'success',
      text: `Onboarded white-label tenant "${data.tenant.storeName}" (${data.tenant.tenantId}) and recorded SaaS subscription payment ${data.subscriptionPayment.paymentId}!`,
    });
    await onRefreshAll();
    await loadMasterOverview();
  };

  const handleToggleTenantStatus = async (target: TenantStore) => {
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    await fetch(`/api/v1/tenants/${target.tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    await onRefreshAll();
    await loadMasterOverview();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await fetch('/api/v1/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCatName,
        subcategories: newCatSubs,
      }),
    });
    setNewCatName('');
    setNewCatSubs('');
    await onRefreshAll();
  };

  const handleMoveCategory = async (categoryId: string, direction: 'UP' | 'DOWN') => {
    await fetch(`/api/v1/categories/${categoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    await onRefreshAll();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await fetch(`/api/v1/categories/${categoryId}`, { method: 'DELETE' });
    await onRefreshAll();
  };

  // Live Cross-Tenant Penetration Probe (Proves Seller A cannot read Seller B data)
  const triggerCrossTenantViolationTest = async () => {
    const otherTenant =
      allTenants.find((t) => t.tenantId !== tenant.tenantId) || allTenants[1];
    const res = await fetch(`/api/v1/tenant/${otherTenant.tenantId}/data`, {
      headers: {
        'x-actor-role': 'SELLER_ADMIN',
        'x-actor-tenant-id': tenant.tenantId,
        'x-actor-id': tenant.ownerId,
      },
    });
    const data = await res.json();
    setIsolationProbeResult(
      `[HTTP ${res.status} ${data.error}] ${data.message} (Logged in Security Audit Log)`
    );
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/v1/tenant/${tenant.tenantId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenant.tenantId,
        'x-actor-role': 'SELLER_ADMIN',
        'x-actor-tenant-id': tenant.tenantId,
      },
      body: JSON.stringify({
        name: prodName,
        sku: prodSku,
        category: prodCat,
        subcategory: prodSubcat,
        priceInr: Number(prodPrice),
        stock: Number(prodStock),
        imageUrl: prodImage,
        variantColor: prodVariantColor,
        variantSize: prodVariantSize,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusToast({ type: 'error', text: data.message || data.error });
      return;
    }
    setProdName('');
    setProdSku('');
    setStatusToast({
      type: 'success',
      text: `Added product "${data.name}" exclusively to ${tenant.storeName} catalog.`,
    });
    await onRefreshAll();
  };

  const handleAdjustStock = async (product: ProductItem, delta: number) => {
    const nextStock = Math.max(0, product.stock + delta);
    await fetch(`/api/v1/tenant/${tenant.tenantId}/products/${product.productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenant.tenantId,
      },
      body: JSON.stringify({ stock: nextStock }),
    });
    await onRefreshAll();
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpnCode.trim()) return;
    await fetch(`/api/v1/tenant/${tenant.tenantId}/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cpnCode,
        discountPercent: Number(cpnPct),
        minOrderInr: Number(cpnMin),
        maxDiscountInr: 3000,
      }),
    });
    setCpnCode('');
    setStatusToast({ type: 'success', text: `Coupon created for ${tenant.storeName}` });
    await onRefreshAll();
  };

  const handleSaveStoreBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/v1/tenants/${tenant.tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: brandStoreName,
        customDomain: brandDomain,
        primaryColor: brandPrimary,
        accentColor: brandAccent,
        paymentConfig: {
          ...tenant.paymentConfig,
          upiVpa: brandUpi,
        },
      }),
    });
    setStatusToast({
      type: 'success',
      text: `Updated white-label branding & custom domain (${brandDomain}) for ${brandStoreName}!`,
    });
    await onRefreshAll();
  };

  const handleOrderFulfillmentUpdate = async (
    order: OrderRecord,
    payload: Record<string, unknown>
  ) => {
    const res = await fetch(
      `/api/v1/tenant/${tenant.tenantId}/orders/${order.orderId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setStatusToast({ type: 'error', text: data.message || data.error });
      return;
    }
    setStatusToast({
      type: 'success',
      text: `Order ${order.orderId} updated to ${data.status}${
        data.awbNumber ? ` (AWB: ${data.awbNumber})` : ''
      }.`,
    });
    await onRefreshAll();
  };

  const handleCalculateCourierRates = async () => {
    const res = await fetch('/api/v1/courier/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg: Number(calcWeight),
        originPincode: calcOriginPin,
        destinationPincode: calcDestPin,
        declaredValueInr: 18500,
      }),
    });
    const data = await res.json();
    setCourierQuotes(data.quotes || []);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/v1/tenant/${tenant.tenantId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: staffName,
        email: staffEmail,
        roleTitle: staffRole,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusToast({ type: 'error', text: data.message || data.error });
      return;
    }
    setStaffName('');
    setStaffEmail('');
    setStatusToast({ type: 'success', text: `Added staff account ${data.name}` });
    await onRefreshAll();
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendWsChat({
      tenantId: tenant.tenantId,
      senderId:
        chatSenderRole === 'SELLER_ADMIN' ? tenant.ownerId : 'cust_pranjal_01',
      senderName:
        chatSenderRole === 'SELLER_ADMIN'
          ? `${tenant.storeName} (Seller Desk)`
          : 'Pranjal Kalita (Customer)',
      senderRole: chatSenderRole,
      recipientId:
        chatSenderRole === 'SELLER_ADMIN' ? 'cust_pranjal_01' : tenant.ownerId,
      orderId: chatOrderId || undefined,
      body: chatInput,
    });
    setChatInput('');
  };

  const handleModerateMessage = async (
    messageId: string,
    flagged: boolean,
    blockSender = false
  ) => {
    await fetch(`/api/v1/chat/${messageId}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged, blockSender }),
    });
    setStatusToast({
      type: 'success',
      text: blockSender
        ? 'Message flagged and abusive sender blocked from chat.'
        : 'Message moderation flag updated.',
    });
    await onRefreshAll();
  };

  const handleTriggerEasBuild = async (platform: 'ANDROID_APK_AAB' | 'IOS_IPA') => {
    const res = await fetch('/api/v1/whitelabel/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: tenant.tenantId,
        platform,
        initiatedBy: tenant.ownerEmail,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusToast({ type: 'error', text: data.message || data.error });
      return;
    }
    setStatusToast({
      type: 'success',
      text: `Expo EAS ${platform} build job ${data.job.jobId} completed! Artifact ready for download.`,
    });
    await onRefreshAll();
  };

  const runAutomatedTests = async () => {
    const res = await fetch('/api/v1/tests/run-suite');
    if (res.ok) {
      setTestSuiteReport(await res.json());
    }
  };

  return (
    <div className="space-y-8">
      {statusToast && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            statusToast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {statusToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <span>{statusToast.text}</span>
          </div>
          <button
            onClick={() => setStatusToast(null)}
            className="text-xs underline ml-4 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          PORTAL 1: MASTER ADMIN PANEL (Platform Owner Control Center)
         ===================================================================== */}
      {activePortal === 'MASTER_ADMIN' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-2">
            <div className="text-xs text-amber-500 font-semibold">
              SANJIT MUSICAL STORE · Master Platform Owner Console
            </div>
            <h1 className="text-2xl font-serif-display font-bold text-slate-900 dark:text-white">
              Multi-Tenant SaaS Governance, Dual Accounting Ledgers & Global Taxonomy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage all registered musical instrument shops, pro audio dealers, and classical dance costume stores with strict financial separation between SaaS Subscription Revenue and Seller Product-Sale GMV.
            </p>
          </div>

          {/* 10 Master Executive KPI Metrics */}
          {masterData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  label: 'Registered Sellers',
                  value: masterData.metrics.totalRegisteredSellers,
                  sub: `${masterData.metrics.activeStores} Active · ${masterData.metrics.inactiveStores} Suspended`,
                },
                {
                  label: 'SaaS Subscription Revenue',
                  value: `₹${masterData.metrics.saasSubscriptionRevenueInr.toLocaleString('en-IN')}`,
                  sub: 'Dedicated SaaS Billing Ledger',
                },
                {
                  label: 'Platform Order Commission',
                  value: `₹${masterData.metrics.totalPlatformCommissionInr.toLocaleString('en-IN')}`,
                  sub: '2.0% – 5.0% Plan Tier Split',
                },
                {
                  label: 'Gross Product Sales (GMV)',
                  value: `₹${masterData.metrics.grossMerchandiseVolumeInr.toLocaleString('en-IN')}`,
                  sub: `${masterData.metrics.totalOrders} Confirmed Orders`,
                },
                {
                  label: 'Net Seller Payouts',
                  value: `₹${masterData.metrics.netSellerSettlementsInr.toLocaleString('en-IN')}`,
                  sub: `${masterData.metrics.pendingSubscriptions} Pending · ${masterData.metrics.expiredSubscriptions} Expired`,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                  <div className="text-xl font-bold font-mono-tabular text-slate-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-slate-400">{stat.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Registered White-Label Sellers Management Table + New Seller Onboarding */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Registered White-Label Tenant Stores ({allTenants.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2.5">Store & Custom Domain</th>
                      <th className="py-2.5">Owner & City</th>
                      <th className="py-2.5">SaaS Plan</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {allTenants.map((t) => (
                      <tr key={t.tenantId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ backgroundColor: t.primaryColor }}
                            />
                            <span>{t.storeName}</span>
                          </div>
                          <div className="font-mono-tabular text-[11px] text-slate-500">
                            {t.customDomain} · ID: {t.tenantId}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-800 dark:text-slate-200">{t.ownerName}</div>
                          <div className="text-slate-500">
                            {t.city}, {t.state}
                          </div>
                        </td>
                        <td className="py-3 uppercase font-mono-tabular font-semibold text-amber-600 dark:text-amber-400">
                          {t.planId} (Exp: {t.subscriptionExpiry})
                        </td>
                        <td className="py-3">
                          <span
                            className={
                              t.status === 'active'
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-rose-500 font-semibold'
                            }
                          >
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => onSelectTenant(t.tenantId)}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                          >
                            Inspect Store
                          </button>
                          <button
                            onClick={() => handleToggleTenantStatus(t)}
                            className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium"
                          >
                            {t.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* New Seller White-Label Onboarding Form */}
            <form
              onSubmit={handleOnboardTenant}
              className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Onboard New White-Label Seller Store
              </h3>
              <p className="text-xs text-slate-500">
                Creates an isolated tenant ID, custom domain mapping, brand theme palette, and SaaS subscription record.
              </p>
              <div className="space-y-2.5 text-xs">
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Store Name (e.g. Brahmaputra Rhythm House)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Owner Full Name"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="email"
                    required
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="Owner Email"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCustomDomain}
                    onChange={(e) => setNewCustomDomain(e.target.value)}
                    placeholder="Custom Domain (shop.brand.in)"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="City"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={newPlanId}
                  onChange={(e) =>
                    setNewPlanId(e.target.value as 'starter' | 'growth' | 'enterprise')
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.yearlyPriceInr.toLocaleString('en-IN')}/yr ({p.productLimit} SKUs)
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span>Primary Hex</span>
                    <input
                      type="color"
                      value={newPrimaryColor}
                      onChange={(e) => setNewPrimaryColor(e.target.value)}
                      className="w-6 h-6 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <span>Accent Hex</span>
                    <input
                      type="color"
                      value={newAccentColor}
                      onChange={(e) => setNewAccentColor(e.target.value)}
                      className="w-6 h-6 cursor-pointer"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  Provision Branded Tenant Store
                </button>
              </div>
            </form>
          </div>

          {/* SaaS Subscription Tier Plans & Separate SaaS Subscription Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                SaaS Subscription Plans & Entitlement Matrix
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.audienceLabel}</div>
                    <div className="text-base font-bold font-mono-tabular text-amber-500">
                      ₹{p.monthlyPriceInr.toLocaleString('en-IN')}/mo
                    </div>
                    <div className="text-[11px] font-mono-tabular text-slate-400">
                      Yearly: ₹{p.yearlyPriceInr.toLocaleString('en-IN')}/yr · Commission: {p.commissionRatePercent}%
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <div>Max Products: {p.productLimit} SKUs</div>
                      <div>Max Staff Seats: {p.staffLimit} Accounts</div>
                      <div>Android App: {p.androidAppEnabled ? 'Enabled' : 'Disabled'}</div>
                      <div>iPhone iOS App: {p.iosAppEnabled ? 'Enabled' : 'Upgrade Required'}</div>
                      <div>Custom Domain: {p.customDomainEnabled ? 'Enabled' : 'Subdomain Only'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Separate Accounting Record: SaaS Subscription Revenue Ledger */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                SaaS Subscription Revenue Ledger (Separated from Product GMV)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                {masterData?.subscriptionPayments.map((sub) => (
                  <div
                    key={sub.paymentId}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {sub.storeName} ({sub.planId.toUpperCase()})
                      </div>
                      <div className="font-mono-tabular text-[11px] text-slate-500">
                        {sub.paymentId} · Ref: {sub.transactionRef}
                      </div>
                    </div>
                    <div className="text-right font-mono-tabular">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        +₹{sub.amountInr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400">{sub.billingCycle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Global Category & Subcategory Taxonomy Management */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Master Product Categories & Subcategories ({categories.length} Categories)
                </h3>
                <p className="text-xs text-slate-500">
                  Add, reorder, or delete categories across Musical Instruments, Electronic Equipment, Dance Dresses, and Dance Accessories.
                </p>
              </div>
              <form onSubmit={handleAddCategory} className="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New Category Name"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={newCatSubs}
                  onChange={(e) => setNewCatSubs(e.target.value)}
                  placeholder="Subcategories (comma separated)"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white w-64"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg font-semibold bg-amber-500 text-slate-950"
                >
                  + Add Category
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      0{idx + 1}. {cat.name} ({cat.subcategories.length} Subcategories)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveCategory(cat.id, 'UP')}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveCategory(cat.id, 'DOWN')}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {cat.subcategories.join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PORTAL 2: SELLER ADMIN PANEL (Tenant-Isolated Store Dashboard)
         ===================================================================== */}
      {activePortal === 'SELLER_ADMIN' && (
        <div className="space-y-8">
          {/* Tenant Isolation Verification Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  Strict Tenant Isolation Active · Scope: {tenant.tenantId} ({tenant.customDomain})
                </span>
              </div>
              <h1 className="text-2xl font-serif-display font-bold text-slate-900 dark:text-white">
                {tenant.storeName} — Seller Admin Workspace
              </h1>
              <p className="text-xs text-slate-500">
                Owner: {tenant.ownerName} ({tenant.ownerEmail}) · Plan: {tenant.planId.toUpperCase()} · GSTIN: {tenant.gstNumber}
              </p>
            </div>

            <div className="space-y-2 text-right">
              <button
                onClick={triggerCrossTenantViolationTest}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600/15 text-rose-500 border border-rose-500/30 hover:bg-rose-600/25"
              >
                Test Cross-Tenant Access Guard (Attempt Reading Another Seller)
              </button>
              {isolationProbeResult && (
                <div className="text-[11px] font-mono-tabular text-amber-500 max-w-md">
                  {isolationProbeResult}
                </div>
              )}
            </div>
          </div>

          {/* Seller Financial & Inventory KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Gross Store Sales</div>
              <div className="text-xl font-bold font-mono-tabular text-slate-900 dark:text-white mt-1">
                ₹{financialSummary.grossProductSalesInr.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400">Verified paid orders only</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Net Seller Settlement</div>
              <div className="text-xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{financialSummary.netSellerRevenueInr.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400">
                After ₹{financialSummary.totalCommissionInr.toLocaleString('en-IN')} platform commission
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Catalog SKUs vs Plan Limit</div>
              <div className="text-xl font-bold font-mono-tabular text-slate-900 dark:text-white mt-1">
                {products.length} /{' '}
                {plans.find((p) => p.id === tenant.planId)?.productLimit || 250}
              </div>
              <div className="text-[11px] text-slate-400">{tenant.planId.toUpperCase()} tier quota</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Low-Stock Alerts</div>
              <div className="text-xl font-bold font-mono-tabular text-amber-500 mt-1">
                {financialSummary.lowStockCount} SKUs
              </div>
              <div className="text-[11px] text-slate-400">Below threshold alert level</div>
            </div>
          </div>

          {/* Add Product Form & Tenant Inventory Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateProduct}
              className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Add Product SKU to {tenant.storeName}
              </h3>
              <div className="space-y-2.5 text-xs">
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Product Title (e.g. Concert Sitar / Kathak Dress)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="SKU Code"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="Price (INR)"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={prodCat}
                  onChange={(e) => {
                    setProdCat(e.target.value);
                    const found = categories.find((c) => c.name === e.target.value);
                    if (found && found.subcategories[0]) {
                      setProdSubcat(found.subcategories[0]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={prodSubcat}
                  onChange={(e) => setProdSubcat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {(
                    categories.find((c) => c.name === prodCat)?.subcategories || ['Acoustic Guitar']
                  ).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={prodVariantColor}
                    onChange={(e) => setProdVariantColor(e.target.value)}
                    placeholder="Variant Color/Pitch"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="Opening Stock"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={IMG_ACOUSTIC_GUITAR}>Studio Preset: Solid Spruce Acoustic Guitar</option>
                  <option value={IMG_TABLA_SET}>Studio Preset: Hand-Hammered Copper Tabla Pair</option>
                  <option value={IMG_DJ_MIXER}>Studio Preset: 4-Channel Club DJ Mixer</option>
                  <option value={IMG_DANCE_DRESS}>Studio Preset: Silk Classical Dance Costume & Ghungroo</option>
                </select>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  + Publish Product to Store
                </button>
              </div>
            </form>

            {/* Seller Inventory & Stock Control Table */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Store Product Catalogue & Stock Management ({products.length} Items)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2">SKU & Title</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Stock (Reserved)</th>
                      <th className="py-2 text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {products.map((p) => (
                      <tr key={p.productId}>
                        <td className="py-2.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {p.name}
                          </div>
                          <div className="font-mono-tabular text-[11px] text-slate-500">
                            {p.sku} · {p.variants.length} Variants
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {p.category} · {p.subcategory}
                        </td>
                        <td className="py-2.5 text-right font-mono-tabular font-semibold">
                          ₹{p.priceInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 text-right font-mono-tabular">
                          <span
                            className={
                              p.stock <= p.lowStockThreshold
                                ? 'text-amber-500 font-bold'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {p.stock} units
                          </span>
                          <span className="text-slate-400"> ({p.reservedStock} rsv)</span>
                        </td>
                        <td className="py-2.5 text-right space-x-1">
                          <button
                            onClick={() => handleAdjustStock(p, -1)}
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono-tabular"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleAdjustStock(p, 5)}
                            className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-500 font-mono-tabular font-semibold"
                          >
                            +5
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Store Branding, Custom Domain & Coupon Management */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveStoreBranding}
              className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                White-Label Store Branding, Custom Domain & UPI Settlement Account
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Branded Store Name</label>
                  <input
                    type="text"
                    value={brandStoreName}
                    onChange={(e) => setBrandStoreName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Custom Domain (CNAME Target)</label>
                  <input
                    type="text"
                    value={brandDomain}
                    onChange={(e) => setBrandDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Authorized Seller UPI VPA</label>
                  <input
                    type="text"
                    value={brandUpi}
                    onChange={(e) => setBrandUpi(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Primary Theme</label>
                    <input
                      type="color"
                      value={brandPrimary}
                      onChange={(e) => setBrandPrimary(e.target.value)}
                      className="w-full h-9 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Accent Gold/Highlight</label>
                    <input
                      type="color"
                      value={brandAccent}
                      onChange={(e) => setBrandAccent(e.target.value)}
                      className="w-full h-9 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950"
              >
                Save White-Label Store Configuration
              </button>
            </form>

            {/* Seller Coupon Creator */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Store Promotional Coupons ({coupons.length})
              </h3>
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  value={cpnCode}
                  onChange={(e) => setCpnCode(e.target.value)}
                  placeholder="Code (BIHU20)"
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                />
                <input
                  type="number"
                  value={cpnPct}
                  onChange={(e) => setCpnPct(e.target.value)}
                  placeholder="Discount %"
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg font-semibold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950"
                >
                  + Create
                </button>
              </form>
              <div className="space-y-2 text-xs">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between"
                  >
                    <span className="font-mono-tabular font-bold text-amber-500">{c.code}</span>
                    <span>
                      {c.discountPercent}% OFF (Min ₹{c.minOrderInr}) · Exp {c.expiryDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PORTAL 3: DELIVERY PARTNER APP & COURIER LOGISTICS
         ===================================================================== */}
      {activePortal === 'DELIVERY_PARTNER' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-1">
            <div className="text-xs text-amber-500 font-semibold">
              Dual Logistics Engine · {tenant.storeName}
            </div>
            <h1 className="text-2xl font-serif-display font-bold text-slate-900 dark:text-white">
              Own Delivery Fleet (OTP Handover) & Courier Aggregator (Shiprocket / Delhivery)
            </h1>
            <p className="text-xs text-slate-500">
              Assign nearest delivery partner, broadcast live GPS coordinates, verify 4-digit customer Delivery OTP, or generate courier AWB labels.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Orders Dispatch Queue */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Active Shipments & OTP Delivery Verification ({orders.length})
              </h3>
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                          {ord.orderId}
                        </span>
                        <span> · Customer: {ord.customerName} ({ord.shippingCity})</span>
                      </div>
                      <div className="font-mono-tabular">
                        <span>Status: </span>
                        <strong className="text-amber-500">{ord.status}</strong>
                        <span> · Customer OTP: </span>
                        <strong className="text-emerald-500">{ord.deliveryOtp}</strong>
                      </div>
                    </div>

                    <div className="text-slate-500">
                      Current GPS Checkpoint: {ord.trackingLocation.currentHub} (
                      {ord.trackingLocation.lat.toFixed(4)}, {ord.trackingLocation.lng.toFixed(4)})
                    </div>

                    {/* Fulfillment & OTP Verification Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() =>
                          handleOrderFulfillmentUpdate(ord, {
                            status: 'PACKED',
                            currentHub: `${tenant.storeName} Acoustic Packing Bay`,
                          })
                        }
                        className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 font-medium"
                      >
                        1. Mark Packed
                      </button>
                      <button
                        onClick={() =>
                          handleOrderFulfillmentUpdate(ord, {
                            status: 'SHIPPED',
                            courierProvider: 'Shiprocket',
                            currentHub: 'Shiprocket Surface Hub',
                          })
                        }
                        className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 font-medium"
                      >
                        2. Generate Shiprocket AWB
                      </button>
                      <button
                        onClick={() =>
                          handleOrderFulfillmentUpdate(ord, {
                            status: 'OUT_FOR_DELIVERY',
                            deliveryMode: 'OWN_DELIVERY',
                            lat: 26.1512,
                            lng: 91.7754,
                            currentHub: '1.1 km from Customer Dropoff (Live Fleet GPS)',
                          })
                        }
                        className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 font-medium"
                      >
                        3. Out for Delivery (Ping GPS)
                      </button>

                      {/* 4-Digit OTP Handover Input */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="text"
                          maxLength={4}
                          value={otpInputs[ord.orderId] || ''}
                          onChange={(e) =>
                            setOtpInputs((prev) => ({
                              ...prev,
                              [ord.orderId]: e.target.value,
                            }))
                          }
                          placeholder={`OTP (${ord.deliveryOtp})`}
                          className="w-24 px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 font-mono-tabular text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={() =>
                            handleOrderFulfillmentUpdate(ord, {
                              status: 'DELIVERED',
                              deliveryMode: 'OWN_DELIVERY',
                              otpSubmitted: otpInputs[ord.orderId] || '',
                              currentHub: `Delivered to ${ord.customerName} (OTP Verified)`,
                            })
                          }
                          className="px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold"
                        >
                          Verify OTP & Deliver
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Own Fleet Partners & Courier Freight Calculator */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Registered Own Delivery Partners
                </h3>
                <div className="space-y-2.5 text-xs">
                  {deliveryPartners.map((dp) => (
                    <div
                      key={dp.partnerId}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1"
                    >
                      <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                        <span>{dp.name}</span>
                        <span className="text-emerald-500">{dp.status}</span>
                      </div>
                      <div className="text-slate-500">{dp.vehicleType}</div>
                      <div className="font-mono-tabular text-[11px] text-slate-400">
                        {dp.vehicleNumber} · ★ {dp.rating} ({dp.completedDeliveries} trips)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Courier Shipping Rate Calculator
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(e.target.value)}
                    placeholder="Weight kg"
                    className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={calcOriginPin}
                    onChange={(e) => setCalcOriginPin(e.target.value)}
                    placeholder="Origin PIN"
                    className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={calcDestPin}
                    onChange={(e) => setCalcDestPin(e.target.value)}
                    placeholder="Dest PIN"
                    className="px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800"
                  />
                </div>
                <button
                  onClick={handleCalculateCourierRates}
                  className="w-full py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950"
                >
                  Calculate Shiprocket & Delhivery Rates
                </button>
                {courierQuotes.length > 0 && (
                  <div className="space-y-2 pt-2 text-xs">
                    {courierQuotes.map((q) => (
                      <div
                        key={q.provider}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {q.provider}
                          </div>
                          <div className="text-[11px] text-slate-500">{q.estimatedDays}</div>
                        </div>
                        <div className="font-mono-tabular font-bold text-amber-500">
                          ₹{q.totalChargeInr}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PORTAL 4: STAFF MANAGEMENT, REAL-TIME WEBSOCKET CHAT & NOTIFICATIONS
         ===================================================================== */}
      {activePortal === 'STAFF_PANEL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Real-Time WebSocket Customer-Seller Chat & Moderation */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Real-Time Customer & Seller WebSocket Chat ({tenant.storeName})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live bidirectional messaging with order tagging and admin moderation controls
                  </p>
                </div>
                <select
                  value={chatSenderRole}
                  onChange={(e) =>
                    setChatSenderRole(e.target.value as 'CUSTOMER' | 'SELLER_ADMIN')
                  }
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <option value="SELLER_ADMIN">Send as: Seller Luthier Desk</option>
                  <option value="CUSTOMER">Send as: Customer (Pranjal Kalita)</option>
                </select>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div
                    key={m.messageId}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      m.flagged
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : m.senderRole === 'SELLER_ADMIN'
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {m.senderName} ({m.senderRole})
                        {m.orderId && (
                          <span className="ml-2 font-mono-tabular text-amber-500">
                            · Order #{m.orderId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleModerateMessage(m.messageId, !m.flagged, false)}
                          title="Report / Flag Message"
                          className="text-slate-400 hover:text-amber-500"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleModerateMessage(m.messageId, true, true)}
                          title="Block Abusive Account"
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{m.body}</p>
                    {m.flagged && (
                      <div className="text-[11px] text-rose-500 font-semibold">
                        Flagged by Moderation · Under Admin Review
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-3">
              <input
                type="text"
                value={chatOrderId}
                onChange={(e) => setChatOrderId(e.target.value)}
                placeholder="Order ID (optional)"
                className="w-36 px-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 font-mono-tabular"
              />
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type real-time message over WebSocket..."
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* Right: Seller Staff RBAC & Notification Center */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Store Staff Accounts ({staff.length})</span>
                </h3>
                <span className="text-xs font-mono-tabular text-slate-500">
                  Plan Limit: {plans.find((p) => p.id === tenant.planId)?.staffLimit || 10}
                </span>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Staff Name"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="Staff Email"
                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={staffRole}
                    onChange={(e) =>
                      setStaffRole(
                        e.target.value as
                          | 'Catalog Manager'
                          | 'Order Fulfillment Lead'
                          | 'Inventory Auditor'
                          | 'Support Specialist'
                      )
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                  >
                    <option value="Catalog Manager">Catalog Manager</option>
                    <option value="Order Fulfillment Lead">Order Fulfillment Lead</option>
                    <option value="Inventory Auditor">Inventory Auditor</option>
                    <option value="Support Specialist">Support Specialist</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-semibold bg-amber-500 text-slate-950"
                  >
                    + Add Staff
                  </button>
                </div>
              </form>

              <div className="space-y-2 text-xs">
                {staff.map((s) => (
                  <div
                    key={s.staffId}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.roleTitle} · {s.email}
                      </div>
                    </div>
                    <div className="text-[11px] font-mono-tabular text-amber-500">
                      {s.permissions.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Channel FCM / Email / SMS Notification Log */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Push, Email & SMS Notification Feed</span>
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1"
                  >
                    <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                      <span>{n.title}</span>
                      <span className="font-mono-tabular text-[10px] text-amber-500">
                        {n.channel}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{n.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PORTAL 5: WHITE-LABEL APP BUILDER, AUTOMATED TESTS & OPENAPI DOCS
         ===================================================================== */}
      {(activePortal === 'WHITELABEL_APP_BUILDER' || activePortal === 'API_DOCS_TESTS') && (
        <div className="space-y-8">
          {/* Expo EAS White-Label Android & iOS Build System */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-500 font-semibold">
                  Section 14 · Configurable White-Label App Generation (Expo EAS Build)
                </div>
                <h2 className="text-2xl font-serif-display font-bold text-slate-900 dark:text-white">
                  {tenant.whiteLabelAppConfig.appDisplayName} — Android & iOS Build Pipeline
                </h2>
                <p className="text-xs text-slate-500">
                  Generates store-specific Android (.aab/.apk) and iOS (.ipa) build artifacts bound to {tenant.customDomain}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleTriggerEasBuild('ANDROID_APK_AAB')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Trigger Android EAS Build (.aab)</span>
                </button>
                <button
                  onClick={() => handleTriggerEasBuild('IOS_IPA')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Trigger iOS EAS Build (.ipa)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <div className="text-slate-400">Android Package Identifier</div>
                <div className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                  {tenant.whiteLabelAppConfig.packageIdentifier}
                </div>
                <div className="text-emerald-500 font-medium">
                  Status: {tenant.whiteLabelAppConfig.androidBuildStatus}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <div className="text-slate-400">Apple iOS Bundle Identifier</div>
                <div className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                  {tenant.whiteLabelAppConfig.bundleIdentifier}
                </div>
                <div className="text-amber-500 font-medium">
                  Status: {tenant.whiteLabelAppConfig.iosBuildStatus}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                <div className="text-slate-400">Store Publishing Compliance Policy</div>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  Apps are never falsely marked as published. Download the signed artifact below and upload via your Google Play Console / Apple Developer account.
                </div>
              </div>
            </div>

            {/* Build Job Logs & Artifact Download Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Expo EAS Build Jobs & Downloadable Artifacts ({buildJobs.length})
              </h3>
              {buildJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                      {job.jobId} · {job.platform} · {job.packageId} (v{job.version})
                    </div>
                    {job.artifactDownloadUrl && (
                      <a
                        href={job.artifactDownloadUrl}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Signed Build Manifest Bundle</span>
                      </a>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 text-slate-300 font-mono-tabular text-[11px] space-y-1">
                    {job.logs.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Integration Test Suite Runner & Dirty Dozen Security TDD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Automated Backend Verification Suite (Auth, Tenant Isolation, Webhooks, Plans)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Executes live assertions against server-side state, HMAC-SHA256 webhooks, and tenant isolation guards
                  </p>
                </div>
                <button
                  onClick={runAutomatedTests}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Run Test Suite</span>
                </button>
              </div>

              {testSuiteReport && (
                <div className="space-y-2.5 text-xs">
                  {testSuiteReport.results.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-900 dark:text-white">
                          {r.id}: {r.module}
                        </span>
                        <span className="text-emerald-500 font-mono-tabular">
                          {r.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className="text-slate-500">{r.assertion}</div>
                      <div className="font-mono-tabular text-[11px] text-amber-600 dark:text-amber-400">
                        {r.details}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phase 0 Dirty Dozen Firestore Security Rules TDD Suite */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>Dirty Dozen Firestore Security TDD ({dirtyDozenSecuritySuite.length} Vectors)</span>
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
                {dirtyDozenSecuritySuite.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        #{tc.id} {tc.name}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-slate-500">
                        {tc.operation.toUpperCase()} {tc.path}
                      </div>
                    </div>
                    <span className="font-mono-tabular text-[11px] text-emerald-500 font-semibold shrink-0">
                      {tc.expectedOutcome}
                    </span>
                  </div>
                ))}
              </div>

              {openApiSpec && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Swagger / OpenAPI 3.0.3 Endpoints (/api/docs/openapi.json)
                  </div>
                  <div className="font-mono-tabular text-[11px] text-slate-500 space-y-1">
                    {Object.keys((openApiSpec.paths as Record<string, unknown>) || {}).map(
                      (p) => (
                        <div key={p}>• {p}</div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
