import Constants from 'expo-constants';
import { PaymentMethod, ShopInfo } from '../types';

const DEFAULT_API_BASE_URL =
  'https://ais-pre-up52nlkfgu63njc24owmoj-662502369012.asia-east1.run.app';

export function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const configured = typeof extra?.apiBaseUrl === 'string' ? extra.apiBaseUrl.trim() : '';
  return (configured || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

async function fetchJsonWithTimeout<T>(
  url: string,
  options?: RequestInit,
  timeoutMs = 7000
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface BackendBootstrapResponse {
  tenants?: {
    tenantId: string;
    ownerId: string;
    storeName: string;
    tagline?: string;
    city?: string;
    state?: string;
    address?: string;
    primaryColor?: string;
    accentColor?: string;
    status?: string;
    paymentConfig?: {
      upiVpa?: string;
      codEnabled?: boolean;
      cardsEnabled?: boolean;
    };
    deliveryConfig?: {
      baseDeliveryFeeInr?: number;
      freeDeliveryThresholdInr?: number;
    };
  }[];
}

export async function fetchBackendShops(): Promise<ShopInfo[] | null> {
  const data = await fetchJsonWithTimeout<BackendBootstrapResponse>(
    `${getApiBaseUrl()}/api/v1/bootstrap`
  );
  if (!data?.tenants || data.tenants.length === 0) return null;

  return data.tenants
    .filter((t) => !t.status || t.status === 'active')
    .map((t) => ({
      tenantId: t.tenantId,
      ownerId: t.ownerId,
      storeName: t.storeName,
      tagline: t.tagline || 'Official Musical & Dance Store Partner',
      city: t.city || 'Guwahati',
      state: t.state || 'Assam',
      address: t.address || 'Main Commercial Avenue',
      primaryColor: t.primaryColor || '#4C1D95',
      accentColor: t.accentColor || '#F59E0B',
      upiVpa: t.paymentConfig?.upiVpa || 'sanjitmusical@icici',
      codEnabled: t.paymentConfig?.codEnabled ?? true,
      cardsEnabled: t.paymentConfig?.cardsEnabled ?? true,
      baseDeliveryFeeInr: t.deliveryConfig?.baseDeliveryFeeInr ?? 120,
      freeDeliveryThresholdInr: t.deliveryConfig?.freeDeliveryThresholdInr ?? 2500,
      rating: 4.9,
      verified: true,
    }));
}

export interface BackendCheckoutResult {
  orderId: string;
  invoiceNumber: string;
  deliveryOtp: string;
  paymentStatus: 'PENDING' | 'VERIFIED_PAID';
}

interface RawCheckoutResponse {
  order?: {
    orderId: string;
    invoiceNumber: string;
    deliveryOtp: string;
    paymentStatus: 'PENDING' | 'VERIFIED_PAID';
  };
  paymentGatewayHandshake?: {
    webhookTestPayload: Record<string, unknown>;
    webhookHmacSignature: string;
  } | null;
}

/**
 * Submits a customer order to the exact Shop Partner tenant endpoint on the shared backend.
 * If online payment (UPI/Card) is selected, also completes the signed Razorpay webhook handshake
 * so stock is committed and the Shop Partner App receives the live order immediately.
 */
export async function submitOrderToBackend(params: {
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPincode: string;
  items: { productId: string; variantLabel: string; quantity: number }[];
  couponCode?: string;
  paymentMethod: PaymentMethod;
}): Promise<BackendCheckoutResult | null> {
  const base = getApiBaseUrl();
  const res = await fetchJsonWithTimeout<RawCheckoutResponse>(
    `${base}/api/v1/tenant/${encodeURIComponent(params.tenantId)}/checkout`,
    {
      method: 'POST',
      headers: {
        'x-actor-role': 'CUSTOMER',
        'x-actor-id': params.customerId,
        'x-tenant-id': params.tenantId,
      },
      body: JSON.stringify({
        customerId: params.customerId,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail,
        shippingAddress: params.shippingAddress,
        shippingCity: params.shippingCity,
        shippingPincode: params.shippingPincode,
        items: params.items,
        couponCode: params.couponCode,
        paymentMethod: params.paymentMethod,
        deliveryMode: 'OWN_DELIVERY',
      }),
    }
  );

  if (!res?.order) return null;

  let paymentStatus: 'PENDING' | 'VERIFIED_PAID' = res.order.paymentStatus;

  if (
    params.paymentMethod !== 'COD' &&
    res.paymentGatewayHandshake?.webhookTestPayload &&
    res.paymentGatewayHandshake?.webhookHmacSignature
  ) {
    const webhookRes = await fetchJsonWithTimeout<{ verified?: boolean }>(
      `${base}/api/v1/payments/razorpay/webhook`,
      {
        method: 'POST',
        headers: {
          'x-razorpay-signature': res.paymentGatewayHandshake.webhookHmacSignature,
        },
        body: JSON.stringify(res.paymentGatewayHandshake.webhookTestPayload),
      }
    );
    if (webhookRes?.verified) {
      paymentStatus = 'VERIFIED_PAID';
    }
  }

  return {
    orderId: res.order.orderId,
    invoiceNumber: res.order.invoiceNumber,
    deliveryOtp: res.order.deliveryOtp,
    paymentStatus,
  };
}

export async function cancelOrderOnBackend(params: {
  tenantId: string;
  orderId: string;
  customerId: string;
}): Promise<boolean> {
  const res = await fetchJsonWithTimeout<Record<string, unknown>>(
    `${getApiBaseUrl()}/api/v1/tenant/${encodeURIComponent(params.tenantId)}/orders/${encodeURIComponent(params.orderId)}/status`,
    {
      method: 'PATCH',
      headers: {
        'x-actor-role': 'CUSTOMER',
        'x-actor-id': params.customerId,
        'x-tenant-id': params.tenantId,
      },
      body: JSON.stringify({
        status: 'CANCELLED',
        note: 'Cancelled by customer from User App before dispatch.',
      }),
    }
  );
  return Boolean(res);
}

export async function sendChatMessageToBackend(params: {
  tenantId: string;
  senderId: string;
  senderName: string;
  body: string;
}): Promise<boolean> {
  const res = await fetchJsonWithTimeout<Record<string, unknown>>(
    `${getApiBaseUrl()}/api/v1/tenant/${encodeURIComponent(params.tenantId)}/chat`,
    {
      method: 'POST',
      headers: {
        'x-actor-role': 'CUSTOMER',
        'x-actor-id': params.senderId,
        'x-tenant-id': params.tenantId,
      },
      body: JSON.stringify({
        senderId: params.senderId,
        senderName: params.senderName,
        senderRole: 'CUSTOMER',
        recipientId: 'seller',
        body: params.body.slice(0, 1000),
      }),
    }
  );
  return Boolean(res);
}
