import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePartnerStore } from '../context/PartnerStoreContext';
import { DemoModeBanner, PrimaryButton } from '../components/DemoBanner';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';
import { PartnerNotificationItem, PartnerNotificationType } from '../types';

type FilterTab = 'ALL' | PartnerNotificationType;

export const NotificationCenterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    notifications,
    unreadNotificationCount,
    fcmState,
    settings,
    updateSettings,
    refreshFcmRegistration,
    markNotificationRead,
    markAllNotificationsRead,
    simulateNewOrderFcmAlert,
    simulateOrderStatusFcmAlert,
    simulateLowStockFcmAlert,
  } = usePartnerStore();

  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [syncing, setSyncing] = useState(false);

  const filtered =
    filter === 'ALL'
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const handleOpenAlert = (item: PartnerNotificationItem) => {
    markNotificationRead(item.id);
    if (item.type === 'LOW_STOCK') {
      navigation.navigate('InventoryManagement');
    } else {
      navigation.navigate('OrderDetails', { orderId: item.referenceId });
    }
  };

  const handleSyncToken = async () => {
    setSyncing(true);
    try {
      await refreshFcmRegistration();
    } finally {
      setSyncing(false);
    }
  };

  const iconForType = (type: PartnerNotificationType): keyof typeof Ionicons.glyphMap => {
    if (type === 'NEW_ORDER') return 'bag-check-outline';
    if (type === 'LOW_STOCK') return 'alert-circle-outline';
    return 'sync-circle-outline';
  };

  const maskedToken = fcmState.fcmToken
    ? `${fcmState.fcmToken.slice(0, 18)}...${fcmState.fcmToken.slice(-8)}`
    : 'Not registered yet';

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner note="FCM Push Engine Active — Real Android channels (order-alerts, order-status, low-stock) + Demo trigger testing." />

        {/* FCM Status & Token Card */}
        <View style={styles.heroCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.heroOverline}>FIREBASE CLOUD MESSAGING (FCM)</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>
                {fcmState.isLiveFcm ? 'LIVE FCM' : 'ANDROID READY'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>
            {unreadNotificationCount} Unread Seller Alert{unreadNotificationCount === 1 ? '' : 's'}
          </Text>
          <Text style={styles.heroSub}>
            Device: {fcmState.deviceName} · Permission: {fcmState.permissionStatus.toUpperCase()}
          </Text>
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>FCM Device Token</Text>
            <Text numberOfLines={1} style={styles.tokenValue}>
              {maskedToken}
            </Text>
          </View>
          <PrimaryButton
            title={syncing ? 'Registering FCM Token...' : 'Refresh FCM Token & Channels'}
            variant="gold"
            icon="notifications-outline"
            onPress={handleSyncToken}
          />
        </View>

        {/* Android FCM Channel Toggles */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Android Notification Channels</Text>
          {[
            {
              key: 'pushOrderAlerts' as const,
              channelId: 'order-alerts',
              title: 'New Order Alerts',
              desc: 'MAX priority · Sound + vibration for incoming orders',
            },
            {
              key: 'orderStatusAlerts' as const,
              channelId: 'order-status',
              title: 'Order Status Updates',
              desc: 'HIGH priority · Packed, shipped & delivery milestones',
            },
            {
              key: 'lowStockAlerts' as const,
              channelId: 'low-stock',
              title: 'Low Stock Warnings',
              desc: 'HIGH priority · Triggers when stock drops to threshold',
            },
          ].map((ch) => (
            <View key={ch.key} style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.rowTitle}>{ch.title}</Text>
                <Text style={styles.meta}>
                  Channel: {ch.channelId} · {ch.desc}
                </Text>
              </View>
              <Switch
                value={settings[ch.key]}
                onValueChange={(v) => updateSettings({ [ch.key]: v })}
                trackColor={{ false: '#CBD5E1', true: COLORS.purplePrimary }}
                thumbColor={settings[ch.key] ? COLORS.goldPrimary : '#F8FAFC'}
              />
            </View>
          ))}
        </View>

        {/* Live Push Test Triggers */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Test Real-Time FCM Alerts</Text>
          <Text style={styles.meta}>
            Fire an instant Android notification on each FCM channel and test deep-link routing:
          </Text>
          <View style={styles.testBtnStack}>
            <PrimaryButton
              title="Trigger New Order Alert"
              icon="bag-add-outline"
              onPress={simulateNewOrderFcmAlert}
            />
            <PrimaryButton
              title="Trigger Order Status Update"
              variant="outline"
              icon="bicycle-outline"
              onPress={() => simulateOrderStatusFcmAlert()}
            />
            <PrimaryButton
              title="Trigger Low Stock Warning"
              variant="gold"
              icon="warning-outline"
              onPress={simulateLowStockFcmAlert}
            />
          </View>
        </View>

        {/* Filter Bar + Mark All Read */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Alert Inbox ({filtered.length})</Text>
            {unreadNotificationCount > 0 ? (
              <TouchableOpacity onPress={markAllNotificationsRead}>
                <Text style={styles.linkText}>Mark all read</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterRow}>
            {(
              [
                { id: 'ALL', label: 'All' },
                { id: 'NEW_ORDER', label: 'Orders' },
                { id: 'ORDER_STATUS', label: 'Status' },
                { id: 'LOW_STOCK', label: 'Stock' },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setFilter(tab.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleOpenAlert(item)}
              style={[styles.alertCard, !item.read && styles.alertCardUnread]}
            >
              <View
                style={[
                  styles.alertIconWrap,
                  item.type === 'LOW_STOCK' && { backgroundColor: '#FEF3C7' },
                ]}
              >
                <Ionicons
                  name={iconForType(item.type)}
                  size={18}
                  color={item.type === 'LOW_STOCK' ? COLORS.warning : COLORS.purplePrimary}
                />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.rowBetween}>
                  <Text numberOfLines={1} style={styles.alertTitle}>
                    {item.title}
                  </Text>
                  <Text style={styles.alertTime}>{item.timestamp}</Text>
                </View>
                <Text style={styles.alertBody}>{item.body}</Text>
                <Text style={styles.alertMeta}>
                  #{item.channelId} · Tap to open {item.type === 'LOW_STOCK' ? 'Inventory' : 'Order'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.canvas },
  scrollBody: { padding: SPACING.md, paddingBottom: 32 },
  heroCard: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    marginBottom: SPACING.md,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroOverline: { color: COLORS.goldPrimary, fontSize: rs(10), fontWeight: '800' },
  badgePill: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { color: COLORS.goldPrimary, fontSize: rs(9), fontWeight: '800' },
  heroTitle: { color: COLORS.white, fontSize: rs(18), fontWeight: '800' },
  heroSub: { color: '#E9D5FF', fontSize: rs(11) },
  tokenBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 2,
  },
  tokenLabel: { color: '#DDD6FE', fontSize: rs(10), fontWeight: '700' },
  tokenValue: { color: COLORS.goldPrimary, fontSize: rs(11), fontWeight: '700' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    marginBottom: SPACING.md,
    gap: 10,
  },
  sectionTitle: { fontSize: rs(15), fontWeight: '800', color: COLORS.ink },
  rowTitle: { fontSize: rs(13), fontWeight: '700', color: COLORS.ink },
  meta: { fontSize: rs(11), color: COLORS.inkSecondary, lineHeight: rs(16) },
  linkText: { fontSize: rs(12), fontWeight: '700', color: COLORS.purplePrimary },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.purpleSoft,
  },
  testBtnStack: { gap: 8 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterChipActive: { backgroundColor: COLORS.purplePrimary },
  filterChipText: { fontSize: rs(11), fontWeight: '700', color: COLORS.purplePrimary },
  filterChipTextActive: { color: COLORS.goldPrimary },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
  },
  alertCardUnread: {
    backgroundColor: '#FAF5FF',
    borderColor: COLORS.purplePrimary,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { flex: 1, fontSize: rs(12), fontWeight: '800', color: COLORS.ink },
  alertTime: { fontSize: rs(10), color: COLORS.inkMuted },
  alertBody: { fontSize: rs(12), color: COLORS.inkSecondary, lineHeight: rs(17) },
  alertMeta: { fontSize: rs(10), fontWeight: '700', color: COLORS.purplePrimary },
});
