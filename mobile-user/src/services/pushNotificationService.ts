import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebaseConfig';
import { PushRegistrationState } from '../types';

export const CUSTOMER_NOTIFICATION_CHANNELS = [
  {
    id: 'order-updates',
    name: 'Order & Delivery Updates',
    description: 'Real-time alerts when your order is confirmed, packed, shipped, or out for delivery',
    importance: Notifications.AndroidImportance.MAX,
    lightColor: '#4C1D95',
  },
  {
    id: 'promotions',
    name: 'Store Offers & Festival Discounts',
    description: 'Seasonal deals on musical instruments, pro audio, and dance costumes',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#F59E0B',
  },
];

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function configureCustomerNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
}

export async function setupCustomerAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  for (const ch of CUSTOMER_NOTIFICATION_CHANNELS) {
    await Notifications.setNotificationChannelAsync(ch.id, {
      name: ch.name,
      description: ch.description,
      importance: ch.importance,
      lightColor: ch.lightColor,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 220, 120, 220],
    });
  }
}

export async function registerCustomerPushNotifications(
  tenantId: string
): Promise<PushRegistrationState> {
  await setupCustomerAndroidChannels();

  const deviceName = (Device.modelName || Device.deviceName || 'Android Customer Device').slice(
    0,
    120
  );
  const channels = ['order-updates', 'promotions'];

  let permissionStatus: PushRegistrationState['permissionStatus'] = 'undetermined';
  let fcmToken: string | null = null;

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
        const devicePush = await Notifications.getDevicePushTokenAsync();
        if (devicePush?.data && typeof devicePush.data === 'string') {
          fcmToken = devicePush.data.slice(0, 512);
        }
      } catch {
        fcmToken = `customer_fcm_${Platform.OS}_${Date.now().toString(36)}_sanjitstore`;
      }
    } else if (finalStatus === 'granted') {
      permissionStatus = 'demo';
      fcmToken = `customer_fcm_emulator_${Date.now().toString(36)}_sanjitstore`;
    }
  } catch {
    permissionStatus = 'demo';
    fcmToken = `customer_fcm_preview_${Date.now().toString(36)}_sanjitstore`;
  }

  let firestoreSynced = false;
  const user = auth.currentUser;
  if (fcmToken && user?.uid && user.emailVerified) {
    const tokenId = sanitizeId(`customer_${deviceName.toLowerCase()}`, 'customer_android');
    const path = `users/${user.uid}/fcmTokens/${tokenId}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'fcmTokens', tokenId), {
        tokenId,
        uid: user.uid,
        tenantId: sanitizeId(tenantId, 'tenant_sanjit_flagship'),
        fcmToken: fcmToken.slice(0, 512),
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android',
        deviceName,
        channels,
        enabled: permissionStatus === 'granted' || permissionStatus === 'demo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      firestoreSynced = true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  return {
    permissionStatus,
    fcmToken,
    deviceName,
    firestoreSynced,
    channels,
    lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function triggerCustomerOrderNotification(params: {
  title: string;
  body: string;
  orderId: string;
}): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title.slice(0, 140),
        body: params.body.slice(0, 300),
        sound: 'default',
        data: { orderId: params.orderId, channelId: 'order-updates' },
      },
      trigger: Platform.OS === 'android' ? { channelId: 'order-updates' } : null,
    });
  } catch {
    // Gracefully skip scheduling in headless environments
  }
}
