import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from './firebaseConfig';
import {
  FcmChannelId,
  FcmPermissionStatus,
  FcmRegistrationState,
  PartnerNotificationItem,
  PartnerNotificationType,
} from '../types';

export const FCM_CHANNELS: Record<
  FcmChannelId,
  {
    id: FcmChannelId;
    name: string;
    description: string;
    importance: Notifications.AndroidImportance;
    vibrationPattern: number[];
    lightColor: string;
  }
> = {
  'order-alerts': {
    id: 'order-alerts',
    name: 'New Order Alerts',
    description: 'High-priority instant alerts when customers place a new musical or dance order',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 150, 300],
    lightColor: '#4C1D95',
  },
  'order-status': {
    id: 'order-status',
    name: 'Order Status & Delivery Updates',
    description: 'Real-time updates when orders are accepted, packed, shipped, or delivered',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#F59E0B',
  },
  'low-stock': {
    id: 'low-stock',
    name: 'Low Stock Warnings',
    description: 'Inventory threshold alerts when instruments or costumes run low',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D97706',
  },
};

export interface FcmDeepLinkPayload {
  type: PartnerNotificationType;
  referenceId: string;
  channelId: FcmChannelId;
}

/** Configure foreground presentation for incoming Android FCM notifications */
export function configureForegroundNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
}

/** Create dedicated Android FCM Notification Channels (Android 8.0+ / API 26+) */
export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channelList = Object.values(FCM_CHANNELS);
  for (const ch of channelList) {
    await Notifications.setNotificationChannelAsync(ch.id, {
      name: ch.name,
      description: ch.description,
      importance: ch.importance,
      vibrationPattern: ch.vibrationPattern,
      lightColor: ch.lightColor,
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Requests Android 13+ POST_NOTIFICATIONS permission, registers native FCM device token,
 * and persists the token to Firestore under /users/{uid}/fcmTokens/{tokenId} when signed in.
 */
export async function registerForFcmPushNotifications(
  tenantId: string,
  enabledChannels: FcmChannelId[]
): Promise<FcmRegistrationState> {
  await setupAndroidNotificationChannels();

  const deviceName = (Device.modelName || Device.deviceName || 'Android Device').slice(0, 120);
  const safeChannels: FcmChannelId[] =
    enabledChannels.length > 0 ? enabledChannels.slice(0, 5) : ['order-alerts'];

  let permissionStatus: FcmPermissionStatus = 'undetermined';
  let fcmToken: string | null = null;
  let isLiveFcm = false;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync({
        android: {},
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      finalStatus = requested.status;
    }

    permissionStatus =
      finalStatus === 'granted'
        ? 'granted'
        : finalStatus === 'denied'
        ? 'denied'
        : 'undetermined';

    if (finalStatus === 'granted' && Device.isDevice) {
      try {
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        if (deviceToken?.data && typeof deviceToken.data === 'string') {
          fcmToken = deviceToken.data.slice(0, 512);
          isLiveFcm = true;
        }
      } catch {
        // Fallback when running without google-services.json or in Expo Go
        fcmToken = `demo_fcm_${Platform.OS}_${Date.now().toString(36)}_sanjitpartner`;
        isLiveFcm = false;
      }
    } else if (finalStatus === 'granted') {
      fcmToken = `demo_fcm_emulator_${Date.now().toString(36)}_sanjitpartner`;
      permissionStatus = 'demo';
    }
  } catch {
    permissionStatus = 'demo';
    fcmToken = `demo_fcm_preview_${Date.now().toString(36)}_sanjitpartner`;
  }

  let firestoreSynced = false;
  if (fcmToken && auth.currentUser?.uid && auth.currentUser?.emailVerified) {
    firestoreSynced = await persistFcmTokenToFirestore({
      uid: auth.currentUser.uid,
      tenantId: sanitizeId(tenantId, 'sanjit_musical_guwahati'),
      fcmToken,
      deviceName,
      channels: safeChannels,
      enabled: permissionStatus === 'granted' || permissionStatus === 'demo',
    });
  }

  return {
    permissionStatus,
    fcmToken,
    deviceName,
    isLiveFcm,
    firestoreSynced,
    lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    channels: safeChannels,
  };
}

/** Persists seller's FCM registration token into owner-isolated Firestore subcollection */
export async function persistFcmTokenToFirestore(params: {
  uid: string;
  tenantId: string;
  fcmToken: string;
  deviceName: string;
  channels: FcmChannelId[];
  enabled: boolean;
}): Promise<boolean> {
  const tokenId = sanitizeId(`android_${params.deviceName.toLowerCase()}`, 'android_primary');
  const path = `users/${params.uid}/fcmTokens/${tokenId}`;

  try {
    const tokenRef = doc(db, 'users', params.uid, 'fcmTokens', tokenId);
    await setDoc(
      tokenRef,
      {
        tokenId,
        uid: sanitizeId(params.uid, 'seller_uid'),
        tenantId: sanitizeId(params.tenantId, 'sanjit_musical_guwahati'),
        fcmToken: params.fcmToken.slice(0, 512),
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android',
        deviceName: params.deviceName.slice(0, 120),
        channels: params.channels.slice(0, 5),
        enabled: Boolean(params.enabled),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: false }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/** Dispatches an immediate Android system notification on the requested FCM channel */
export async function dispatchLocalFcmNotification(payload: {
  type: PartnerNotificationType;
  channelId: FcmChannelId;
  title: string;
  body: string;
  referenceId: string;
}): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title.slice(0, 140),
        body: payload.body.slice(0, 400),
        sound: 'default',
        priority:
          payload.channelId === 'order-alerts'
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: payload.type,
          referenceId: payload.referenceId,
          channelId: payload.channelId,
        },
      },
      trigger:
        Platform.OS === 'android'
          ? { channelId: payload.channelId }
          : null,
    });
  } catch {
    // Gracefully skip OS scheduling when running in environments without native scheduler
  }
}

/** Subscribes to live Firestore seller notifications at /tenants/{tenantId}/notifications */
export function subscribeToSellerNotifications(
  tenantId: string,
  onNotifications: (items: PartnerNotificationItem[]) => void
): () => void {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return () => {};
  }

  const safeTenantId = sanitizeId(tenantId, 'sanjit_musical_guwahati');
  const path = `tenants/${safeTenantId}/notifications`;
  const q = query(
    collection(db, 'tenants', safeTenantId, 'notifications'),
    where('tenantId', '==', safeTenantId),
    where('recipientUid', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: PartnerNotificationItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          type: (d.type as PartnerNotificationType) || 'NEW_ORDER',
          channelId: (d.channelId as FcmChannelId) || 'order-alerts',
          title: String(d.title || 'Seller Alert'),
          body: String(d.body || ''),
          referenceId: String(d.referenceId || ''),
          priority: d.priority === 'HIGH' ? 'HIGH' : 'DEFAULT',
          read: Boolean(d.read),
          timestamp: d.createdAt?.toDate
            ? d.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
          source: 'FCM_LIVE',
        };
      });
      onNotifications(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/** Marks a Firestore seller notification as read (enforcing terminal read lock in rules) */
export async function markFirestoreNotificationRead(
  tenantId: string,
  notificationId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeTenantId = sanitizeId(tenantId, 'sanjit_musical_guwahati');
  const safeNotificationId = sanitizeId(notificationId, 'notif_id');
  const path = `tenants/${safeTenantId}/notifications/${safeNotificationId}`;

  try {
    await updateDoc(doc(db, 'tenants', safeTenantId, 'notifications', safeNotificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/** Parses notification tap data payload to route seller directly into Order Details or Inventory */
export function parseFcmTapPayload(
  response: Notifications.NotificationResponse | null
): FcmDeepLinkPayload | null {
  const raw = response?.notification?.request?.content?.data as
    | Record<string, unknown>
    | undefined;
  if (!raw || typeof raw.type !== 'string' || typeof raw.referenceId !== 'string') {
    return null;
  }

  const type = raw.type as PartnerNotificationType;
  const channelId = (raw.channelId as FcmChannelId) || 'order-alerts';
  return {
    type,
    referenceId: raw.referenceId,
    channelId,
  };
}
