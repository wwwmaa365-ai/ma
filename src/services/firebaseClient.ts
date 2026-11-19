import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const fcmSenderId = firebaseConfig.messagingSenderId;

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
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
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

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : fallback;
}

export async function syncDeviceFcmTokenIfAuthenticated(params: {
  tenantId: string;
  fcmToken: string;
  channels: string[];
  enabled: boolean;
}): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;

  const tokenId = sanitizeId('web_mobile_preview', 'web_mobile_preview');
  const path = `users/${user.uid}/fcmTokens/${tokenId}`;

  try {
    await setDoc(doc(db, 'users', user.uid, 'fcmTokens', tokenId), {
      tokenId,
      uid: sanitizeId(user.uid, 'seller_uid'),
      tenantId: sanitizeId(params.tenantId, 'sanjit_musical_guwahati'),
      fcmToken: params.fcmToken.slice(0, 512),
      platform: 'web',
      deviceName: 'Mobile Preview Client',
      channels: params.channels.slice(0, 5),
      enabled: Boolean(params.enabled),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function markSellerNotificationReadIfAuthenticated(
  tenantId: string,
  notificationId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeTenantId = sanitizeId(tenantId, 'sanjit_musical_guwahati');
  const safeNotifId = sanitizeId(notificationId, 'notif_id');
  const path = `tenants/${safeTenantId}/notifications/${safeNotifId}`;

  try {
    await updateDoc(doc(db, 'tenants', safeTenantId, 'notifications', safeNotifId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export const MAX_SELLER_REVIEW_REPLY_LEN = 1000;

export async function publishSellerReviewReplyIfAuthenticated(params: {
  tenantId: string;
  reviewId: string;
  sellerReply: string;
}): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;

  const cleanReply = params.sellerReply.trim().slice(0, MAX_SELLER_REVIEW_REPLY_LEN);
  if (cleanReply.length < 2) return false;

  const safeTenantId = sanitizeId(params.tenantId, 'sanjit_musical_guwahati');
  const safeReviewId = sanitizeId(params.reviewId, 'rev_001');
  const path = `tenants/${safeTenantId}/reviews/${safeReviewId}`;

  try {
    await updateDoc(doc(db, 'tenants', safeTenantId, 'reviews', safeReviewId), {
      sellerReply: cleanReply,
      status: 'REPLIED',
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
