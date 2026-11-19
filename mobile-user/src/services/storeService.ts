import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebaseConfig';
import { OrderStatus, PaymentMethod } from '../types';

export const DEFAULT_TENANT_ID = 'tenant_sanjit_flagship';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

export function buildCustomerUpiUri(params: {
  orderId: string;
  amountInr: number;
  upiVpa: string;
  shopName: string;
}): string {
  const amount = Math.max(1, Math.round(params.amountInr)).toFixed(2);
  const note = encodeURIComponent(`${params.shopName} Order ${params.orderId}`);
  const pn = encodeURIComponent(params.shopName);
  return `upi://pay?pa=${encodeURIComponent(params.upiVpa)}&pn=${pn}&am=${amount}&cu=INR&tn=${note}&tr=${encodeURIComponent(params.orderId)}`;
}

async function resolveSellerOwnerId(tenantId: string): Promise<string | null> {
  const safeTenantId = sanitizeId(tenantId);
  const tenantPath = `tenants/${safeTenantId}`;
  try {
    const snap = await getDoc(doc(db, 'tenants', safeTenantId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return typeof data.ownerId === 'string' ? data.ownerId : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, tenantPath);
  }
}

export async function syncCustomerProfileToFirestore(input: {
  tenantId: string;
  displayName: string;
  email: string;
  phone: string;
  address: string;
}): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;

  const safeTenantId = sanitizeId(input.tenantId);
  const publicPath = `users/${user.uid}`;
  const privatePath = `users/${user.uid}/private/profile`;

  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: input.displayName.trim().slice(0, 80) || 'Customer',
      tenantId: safeTenantId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  try {
    await setDoc(doc(db, 'users', user.uid, 'private', 'profile'), {
      uid: user.uid,
      email: input.email.trim().slice(0, 120) || 'customer@sanjitmusical.in',
      phone: input.phone.trim().slice(0, 24) || '+91 98640 00000',
      address: input.address.trim().slice(0, 300) || 'Guwahati, Assam',
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

export async function syncOrderToFirestore(input: {
  tenantId: string;
  orderId: string;
  totalInr: number;
  paymentMethod: PaymentMethod;
}): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return false;
  }

  const safeTenantId = sanitizeId(input.tenantId);
  const sellerOwnerId = await resolveSellerOwnerId(safeTenantId);
  if (!sellerOwnerId) return false;

  const safeOrderId = sanitizeId(input.orderId);
  const path = `tenants/${safeTenantId}/orders/${safeOrderId}`;
  try {
    await setDoc(doc(db, 'tenants', safeTenantId, 'orders', safeOrderId), {
      orderId: safeOrderId,
      tenantId: safeTenantId,
      customerId: user.uid,
      sellerOwnerId,
      totalInr: Math.min(10000000, Math.max(0, Math.round(input.totalInr))),
      paymentMethod: input.paymentMethod,
      paymentStatus: 'PENDING',
      status: 'CONFIRMED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncOrderCancelToFirestore(
  tenantId: string,
  orderId: string
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return false;
  }
  const safeTenantId = sanitizeId(tenantId);
  const safeOrderId = sanitizeId(orderId);
  const path = `tenants/${safeTenantId}/orders/${safeOrderId}`;
  try {
    await updateDoc(doc(db, 'tenants', safeTenantId, 'orders', safeOrderId), {
      status: 'CANCELLED',
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToCustomerOrdersInFirestore(
  tenantId: string,
  onOrderStatusChange: (updates: Record<string, OrderStatus>) => void
): () => void {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return () => {};
  }

  const safeTenantId = sanitizeId(tenantId);
  const path = `tenants/${safeTenantId}/orders`;
  const q = query(
    collection(db, 'tenants', safeTenantId, 'orders'),
    where('tenantId', '==', safeTenantId),
    where('customerId', '==', user.uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const updates: Record<string, OrderStatus> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (typeof data.status === 'string') {
          updates[d.id] = data.status as OrderStatus;
        }
      });
      onOrderStatusChange(updates);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function syncReviewToFirestore(input: {
  tenantId: string;
  reviewId: string;
  scope: 'STORE' | 'PRODUCT';
  productId: string;
  productName: string;
  orderRef: string;
  customerName: string;
  rating: number;
  comment: string;
}): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return false;
  }

  const safeTenantId = sanitizeId(input.tenantId);
  const sellerOwnerId = await resolveSellerOwnerId(safeTenantId);
  if (!sellerOwnerId) return false;

  const safeReviewId = sanitizeId(input.reviewId);
  const safeProductId = sanitizeId(input.productId);
  const safeOrderRef = sanitizeId(input.orderRef);
  const path = `tenants/${safeTenantId}/reviews/${safeReviewId}`;

  try {
    await setDoc(doc(db, 'tenants', safeTenantId, 'reviews', safeReviewId), {
      reviewId: safeReviewId,
      tenantId: safeTenantId,
      sellerOwnerId,
      customerId: user.uid,
      customerName: input.customerName.trim().slice(0, 80) || 'Customer',
      scope: input.scope,
      productId: safeProductId,
      productName: input.productName.trim().slice(0, 140) || 'Sanjit Musical Store',
      orderRef: safeOrderRef,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      comment: input.comment.trim().slice(0, 1000),
      sellerReply: '',
      status: 'PENDING_REPLY',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
