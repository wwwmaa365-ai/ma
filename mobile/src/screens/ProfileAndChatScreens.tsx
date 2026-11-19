import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePartnerStore } from '../context/PartnerStoreContext';
import { DemoModeBanner, PrimaryButton } from '../components/DemoBanner';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';

/** Screen 19: Customer Chat Screen */
export const CustomerChatScreen: React.FC = () => {
  const { messages, sendChatMessage } = usePartnerStore();
  const [reply, setReply] = useState('');

  const handleSend = () => {
    if (!reply.trim()) return;
    sendChatMessage('cust_01', 'Ananya Borgohain', reply);
    setReply('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <DemoModeBanner note="Demo Customer Chat — Messages are saved locally during your preview session." />
          {messages.map((m) => {
            const isSeller = m.sender === 'SELLER';
            return (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  isSeller ? styles.sellerBubble : styles.customerBubble,
                ]}
              >
                <Text style={[styles.bubbleSender, isSeller && { color: COLORS.goldPrimary }]}>
                  {isSeller ? 'You (Shop Partner)' : m.customerName}
                  {m.orderRef ? ` · ${m.orderRef}` : ''}
                </Text>
                <Text style={[styles.bubbleText, isSeller && { color: COLORS.white }]}>
                  {m.text}
                </Text>
                <Text style={[styles.bubbleTime, isSeller && { color: '#DDD6FE' }]}>
                  {m.timestamp}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.chatComposer}>
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder="Type reply to customer..."
            placeholderTextColor={COLORS.inkMuted}
            style={[styles.input, { flex: 1 }]}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Ionicons name="send" size={18} color={COLORS.goldPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/** Screen 21: Shop Profile Screen (Profile Tab) */
export const ShopProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { shopProfile, updateShopProfile, logoutDemo } = usePartnerStore();
  const [shopName, setShopName] = useState(shopProfile.shopName);
  const [city, setCity] = useState(shopProfile.city);
  const [upiId, setUpiId] = useState(shopProfile.upiId);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    updateShopProfile({
      shopName: shopName.trim() || shopProfile.shopName,
      city: city.trim() || shopProfile.city,
      upiId: upiId.trim() || shopProfile.upiId,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <DemoModeBanner />

          <View style={styles.heroCard}>
            <Text style={styles.heroOverline}>SANJIT SHOP PARTNER PROFILE</Text>
            <Text style={styles.heroTitle}>{shopProfile.shopName}</Text>
            <Text style={styles.heroSub}>
              {shopProfile.ownerName} · GSTIN: {shopProfile.gstNumber}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Partner Shortcuts</Text>
            <PrimaryButton
              title="Customer Chat"
              variant="outline"
              icon="chatbubbles-outline"
              onPress={() => navigation.navigate('CustomerChat')}
            />
            <PrimaryButton
              title="Delivery Management"
              variant="outline"
              icon="bicycle-outline"
              onPress={() => navigation.navigate('DeliveryManagement')}
            />
            <PrimaryButton
              title="App Settings"
              variant="outline"
              icon="settings-outline"
              onPress={() => navigation.navigate('Settings')}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Edit Shop Details</Text>
            <Text style={styles.label}>Store Name</Text>
            <TextInput value={shopName} onChangeText={setShopName} style={styles.input} />

            <Text style={styles.label}>City</Text>
            <TextInput value={city} onChangeText={setCity} style={styles.input} />

            <Text style={styles.label}>Payout UPI ID (Demo)</Text>
            <TextInput value={upiId} onChangeText={setUpiId} style={styles.input} />

            {savedNotice ? (
              <Text style={{ color: COLORS.success, fontSize: rs(12), fontWeight: '700' }}>
                Shop profile updated in Demo Mode.
              </Text>
            ) : null}

            <PrimaryButton title="Save Shop Profile" icon="save-outline" onPress={handleSave} />
            <PrimaryButton
              title="Sign Out (Back to Login)"
              variant="danger"
              icon="log-out-outline"
              onPress={logoutDemo}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/** Screen 22: Settings Screen */
export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = usePartnerStore();

  const toggleItems: {
    key: keyof typeof settings;
    label: string;
    desc: string;
  }[] = [
    {
      key: 'pushOrderAlerts',
      label: 'Push Order Alerts',
      desc: 'Instant sound & vibration for new customer orders',
    },
    {
      key: 'lowStockAlerts',
      label: 'Low Stock Warnings',
      desc: 'Notify when instruments or dance dresses drop below threshold',
    },
    {
      key: 'codEnabled',
      label: 'Cash on Delivery (COD)',
      desc: 'Allow customers to place COD orders with 4-digit OTP delivery',
    },
    {
      key: 'autoAcceptOrders',
      label: 'Auto-Accept Orders',
      desc: 'Automatically move incoming paid orders to Accepted status',
    },
    {
      key: 'vacationMode',
      label: 'Temporary Store Pause',
      desc: 'Pause incoming orders during holidays or inventory audit',
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner />
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Android Partner App Settings</Text>
          {toggleItems.map((row) => (
            <View key={row.key} style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.rowTitle}>{row.label}</Text>
                <Text style={styles.meta}>{row.desc}</Text>
              </View>
              <Switch
                value={settings[row.key]}
                onValueChange={(v) => updateSettings({ [row.key]: v })}
                trackColor={{ false: '#CBD5E1', true: COLORS.purplePrimary }}
                thumbColor={settings[row.key] ? COLORS.goldPrimary : '#F8FAFC'}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.canvas },
  scrollBody: { padding: SPACING.md, paddingBottom: 28 },
  heroCard: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    marginBottom: SPACING.md,
    gap: 4,
  },
  heroOverline: { color: COLORS.goldPrimary, fontSize: rs(10), fontWeight: '700' },
  heroTitle: { color: COLORS.white, fontSize: rs(18), fontWeight: '800' },
  heroSub: { color: '#E9D5FF', fontSize: rs(12) },
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
  label: { fontSize: rs(12), fontWeight: '700', color: COLORS.ink },
  meta: { fontSize: rs(12), color: COLORS.inkSecondary },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: rs(13),
    color: COLORS.ink,
    backgroundColor: COLORS.canvas,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  sellerBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.purplePrimary },
  customerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
  },
  bubbleSender: { fontSize: rs(11), fontWeight: '700', color: COLORS.purplePrimary },
  bubbleText: { fontSize: rs(13), color: COLORS.ink, lineHeight: rs(18) },
  bubbleTime: { fontSize: rs(10), color: COLORS.inkMuted, alignSelf: 'flex-end' },
  chatComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.purpleBorder,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.purpleSoft,
  },
});
