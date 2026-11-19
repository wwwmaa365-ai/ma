import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCustomer } from '../context/CustomerContext';
import { COLORS, RADIUS, formatInr, rs } from '../theme/theme';
import { RootStackParamList } from '../types';

export const AccountScreen: React.FC = () => {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    profile,
    selectedShop,
    pushState,
    products,
    wishlistIds,
    chatMessages,
    enablePushNotifications,
    updateProfileInfo,
    sendChatMessage,
    logout,
  } = useCustomer();

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [phoneInput, setPhoneInput] = useState(profile.phone);
  const [addressInput, setAddressInput] = useState(profile.address);
  const [cityInput, setCityInput] = useState(profile.city);
  const [pincodeInput, setPincodeInput] = useState(profile.pincode);
  const [chatInput, setChatInput] = useState('');
  const [pushBusy, setPushBusy] = useState(false);

  const savedProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const handleSaveProfile = () => {
    updateProfileInfo({
      name: nameInput.trim() || profile.name,
      phone: phoneInput.trim() || profile.phone,
      address: addressInput.trim() || profile.address,
      city: cityInput.trim() || profile.city,
      pincode: pincodeInput.trim() || profile.pincode,
    });
    setEditing(false);
    Alert.alert('Profile Saved', 'Your delivery details have been updated.');
  };

  const handleEnablePush = async () => {
    setPushBusy(true);
    try {
      const state = await enablePushNotifications();
      Alert.alert(
        'Push Notifications Updated',
        state.permissionStatus === 'granted' || state.permissionStatus === 'demo'
          ? `Order & delivery alerts are enabled on ${state.deviceName}.`
          : 'Permission was denied. Enable notifications in Android Settings to receive order updates.'
      );
    } finally {
      setPushBusy(false);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out?', 'You can sign back in with your customer account anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout().catch(() => {});
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Account & Support</Text>
          <Text style={styles.headerSub}>
            {profile.authMode === 'FIREBASE'
              ? profile.emailVerified
                ? 'Firebase Account • Cloud Sync Active'
                : 'Firebase Account • Verify Email for Cloud Sync'
              : 'Quick Demo Shopper Session'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.goldPrimary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name
                  .split(' ')
                  .map((s) => s[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileMeta}>{profile.email}</Text>
              <Text style={styles.profileMeta}>{profile.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditing((v) => !v)}>
              <Text style={styles.editLink}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Full Name"
              />
              <TextInput
                style={styles.input}
                value={phoneInput}
                onChangeText={setPhoneInput}
                placeholder="Phone Number"
              />
              <TextInput
                style={styles.input}
                value={addressInput}
                onChangeText={setAddressInput}
                placeholder="Street Address"
              />
              <View style={styles.twoCol}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={cityInput}
                  onChangeText={setCityInput}
                  placeholder="City"
                />
                <TextInput
                  style={[styles.input, { width: 110 }]}
                  value={pincodeInput}
                  onChangeText={setPincodeInput}
                  placeholder="PIN"
                  keyboardType="number-pad"
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save Profile & Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressPill}>
              <Ionicons name="location-outline" size={16} color={COLORS.purplePrimary} />
              <Text style={styles.addressText}>
                {profile.address}, {profile.city}, {profile.state} - {profile.pincode}
              </Text>
            </View>
          )}
        </View>

        {/* Push Notifications Card */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="notifications" size={18} color={COLORS.purplePrimary} />
            <Text style={styles.cardTitle}>Order Push Notifications (FCM)</Text>
          </View>
          <Text style={styles.pushDesc}>
            Receive instant alerts when {selectedShop.storeName} confirms, packs, or dispatches
            your order.
          </Text>
          <View style={styles.pushMetaRow}>
            <Text style={styles.pushStatusLabel}>
              Status:{' '}
              <Text style={{ color: COLORS.purplePrimary, fontWeight: '800' }}>
                {pushState.permissionStatus.toUpperCase()}
              </Text>
            </Text>
            <Text style={styles.pushStatusLabel}>Last sync: {pushState.lastSyncedAt}</Text>
          </View>
          <TouchableOpacity
            style={styles.pushBtn}
            onPress={handleEnablePush}
            disabled={pushBusy}
          >
            <Ionicons name="notifications-outline" size={16} color={COLORS.white} />
            <Text style={styles.pushBtnText}>
              {pushBusy ? 'Registering Device...' : 'Enable / Sync Push Alerts'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wishlist */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saved Wishlist ({savedProducts.length})</Text>
          {savedProducts.length === 0 ? (
            <Text style={styles.emptySub}>Tap the heart icon on any product to save it here.</Text>
          ) : (
            savedProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.wishRow}
                onPress={() => rootNav.navigate('ProductDetail', { productId: item.id })}
              >
                <Image source={item.image} style={styles.wishThumb} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wishName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.wishShop}>{item.shopName}</Text>
                  <Text style={styles.wishPrice}>{formatInr(item.priceInr)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.inkMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Store Support Chat */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chat with {selectedShop.storeName}</Text>
          <View style={styles.chatBox}>
            {chatMessages.slice(-6).map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.chatBubble,
                  msg.sender === 'CUSTOMER' ? styles.chatUser : styles.chatStore,
                ]}
              >
                <Text
                  style={[
                    styles.chatText,
                    msg.sender === 'CUSTOMER' && { color: COLORS.white },
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.chatTime,
                    msg.sender === 'CUSTOMER' && { color: '#DDD6FE' },
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask about tuning, delivery, or sizing..."
              placeholderTextColor={COLORS.inkMuted}
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendChat}>
              <Ionicons name="send" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purpleDeep,
  },
  header: {
    backgroundColor: COLORS.purpleDeep,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: rs(16.5),
    fontWeight: '800',
  },
  headerSub: {
    color: '#DDD6FE',
    fontSize: rs(11),
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutText: {
    color: COLORS.goldPrimary,
    fontSize: rs(11.5),
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    padding: 14,
    gap: 12,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.goldPrimary,
    fontSize: rs(16),
    fontWeight: '900',
  },
  profileName: {
    color: COLORS.ink,
    fontSize: rs(15),
    fontWeight: '900',
  },
  profileMeta: {
    color: COLORS.inkSecondary,
    fontSize: rs(11.5),
  },
  editLink: {
    color: COLORS.purplePrimary,
    fontSize: rs(12.5),
    fontWeight: '800',
  },
  addressPill: {
    marginTop: 12,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.sm,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  addressText: {
    color: COLORS.ink,
    fontSize: rs(12),
    flex: 1,
    lineHeight: 17,
  },
  editForm: {
    marginTop: 12,
    gap: 8,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    height: 40,
    color: COLORS.ink,
    fontSize: rs(12.5),
  },
  saveBtn: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.sm,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: rs(13),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: rs(14),
    fontWeight: '800',
    marginBottom: 8,
  },
  pushDesc: {
    color: COLORS.inkSecondary,
    fontSize: rs(12),
    lineHeight: 17,
  },
  pushMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  pushStatusLabel: {
    color: COLORS.inkMuted,
    fontSize: rs(11),
  },
  pushBtn: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pushBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: rs(12.5),
  },
  emptySub: {
    color: COLORS.inkMuted,
    fontSize: rs(12),
  },
  wishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  wishThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  wishName: {
    color: COLORS.ink,
    fontSize: rs(12.5),
    fontWeight: '800',
  },
  wishShop: {
    color: COLORS.inkMuted,
    fontSize: rs(10.5),
  },
  wishPrice: {
    color: COLORS.purplePrimary,
    fontSize: rs(12.5),
    fontWeight: '900',
  },
  chatBox: {
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  chatBubble: {
    maxWidth: '86%',
    borderRadius: RADIUS.md,
    padding: 9,
  },
  chatStore: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatUser: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.purplePrimary,
  },
  chatText: {
    color: COLORS.ink,
    fontSize: rs(12),
    lineHeight: 17,
  },
  chatTime: {
    color: COLORS.inkMuted,
    fontSize: 9.5,
    marginTop: 3,
    textAlign: 'right',
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    height: 40,
    color: COLORS.ink,
    fontSize: rs(12.5),
  },
  sendBtn: {
    width: 42,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
