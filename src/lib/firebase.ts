import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mandatory startup connectivity check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Sanitize strings to match firebase-blueprint.json maxLength and pattern constraints
export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : 'default_id';
}

export function clampStr(raw: string, minLen: number, maxLen: number, fallback = 'N/A'): string {
  const trimmed = (raw || '').trim();
  if (trimmed.length < minLen) return fallback.slice(0, maxLen);
  return trimmed.slice(0, maxLen);
}

export async function signInWithGooglePopup(activeTenantId: string) {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;
  if (user && user.emailVerified) {
    const uid = sanitizeId(user.uid);
    const userPath = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: clampStr(user.displayName || user.email || 'Sanjit Member', 1, 80),
        tenantId: sanitizeId(activeTenantId),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // If profile already exists or rule rejects overwrite of immutable createdAt, ignore safely
      console.warn('Public profile sync notice:', err);
    }
  }
  return user;
}

export async function signOutFirebase() {
  await fbSignOut(auth);
}

export async function syncOrderToFirestore(orderPayload: {
  orderId: string;
  tenantId: string;
  sellerOwnerId: string;
  totalInr: number;
  paymentMethod: 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'NETBANKING' | 'COD';
}) {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const tId = sanitizeId(orderPayload.tenantId);
  const oId = sanitizeId(orderPayload.orderId);
  const path = `tenants/${tId}/orders/${oId}`;
  try {
    await setDoc(doc(db, 'tenants', tId, 'orders', oId), {
      orderId: oId,
      tenantId: tId,
      customerId: sanitizeId(auth.currentUser.uid),
      sellerOwnerId: sanitizeId(orderPayload.sellerOwnerId),
      totalInr: Math.max(0, Math.min(10000000, Number(orderPayload.totalInr) || 0)),
      paymentMethod: orderPayload.paymentMethod,
      paymentStatus: 'PENDING',
      status: 'CONFIRMED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchUserFirestoreOrders(tenantId: string) {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return [];
  const tId = sanitizeId(tenantId);
  const path = `tenants/${tId}/orders`;
  try {
    const q = query(
      collection(db, 'tenants', tId, 'orders'),
      where('tenantId', '==', tId),
      where('customerId', '==', auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
