import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import QRCode from 'react-native-qrcode-svg';
import { useCustomer } from '../context/CustomerContext';
import { buildCustomerUpiUri } from '../services/storeService';
import { COLORS, RADIUS, formatInr, rs } from '../theme/theme';
import { MainTabParamList, PaymentMethod } from '../types';

export const CartCheckoutScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {
    cart,
    cartShop,
    selectedShop,
    cartSubtotal,
    discountInr,
    deliveryFeeInr,
    cartTotal,
    appliedCoupon,
    profile,
    updateCartQty,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    placeOrder,
  } = useCustomer();

  const activeShop = cartShop || selectedShop;
  const [couponInput, setCouponInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY_UPI');
  const [upiRefInput, setUpiRefInput] = useState('');
  const [addressInput, setAddressInput] = useState(
    `${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`
  );
  const [submitting, setSubmitting] = useState(false);

  // If the shop does not allow COD (e.g. Music World), auto-switch to UPI
  useEffect(() => {
    if (!activeShop.codEnabled && paymentMethod === 'COD') {
      setPaymentMethod('RAZORPAY_UPI');
    }
  }, [activeShop.codEnabled, paymentMethod]);

  const draftOrderRef = useMemo(
    () => `PAY-${activeShop.tenantId.slice(-4).toUpperCase()}-${Math.max(1000, cartTotal)}`,
    [activeShop.tenantId, cartTotal]
  );

  const upiUri = useMemo(
    () =>
      buildCustomerUpiUri({
        orderId: draftOrderRef,
        amountInr: cartTotal || 1,
        upiVpa: activeShop.upiVpa,
        shopName: activeShop.storeName,
      }),
    [draftOrderRef, cartTotal, activeShop.upiVpa, activeShop.storeName]
  );

  const handleApplyCoupon = () => {
    const res = applyCoupon(couponInput);
    Alert.alert(res.ok ? 'Coupon Applied' : 'Coupon Notice', res.message);
    if (res.ok) setCouponInput('');
  };

  const handleOpenUpiApp = async () => {
    try {
      const supported = await Linking.canOpenURL(upiUri);
      if (supported) {
        await Linking.openURL(upiUri);
      } else {
        Alert.alert(
          'Scan UPI QR',
          `Pay ${formatInr(cartTotal)} directly to ${activeShop.upiVpa} via GPay, PhonePe, or Paytm and tap Place Order.`
        );
      }
    } catch {
      Alert.alert('UPI Pay', `Use UPI ID ${activeShop.upiVpa} to pay ${formatInr(cartTotal)}.`);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (addressInput.trim().length < 10) {
      Alert.alert('Address Required', 'Please enter your complete delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await placeOrder({
        paymentMethod,
        upiRefId:
          paymentMethod === 'RAZORPAY_UPI'
            ? upiRefInput.trim() || `UPI${Date.now().toString().slice(-8)}`
            : undefined,
        shippingAddress: addressInput.trim(),
      });

      const syncNote = result.syncedToBackend
        ? `Routed live to ${activeShop.storeName} Partner App.`
        : `Order saved locally & queued for ${activeShop.storeName}.`;

      Alert.alert(
        'Order Confirmed!',
        `Order ${result.order.id} placed for ${formatInr(result.order.totalInr)}.\n\n${syncNote}\nDelivery OTP: ${result.order.deliveryOtp}`,
        [
          {
            text: 'Track Order',
            onPress: () => tabNav.navigate('Orders'),
          },
        ]
      );
      setUpiRefInput('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart & Checkout</Text>
        <Text style={styles.headerSub}>
          {cart.length > 0
            ? `Fulfilled by ${activeShop.storeName} (${activeShop.city})`
            : 'Add items to start checkout'}
        </Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={38} color={COLORS.purplePrimary} />
          </View>
          <Text style={styles.emptyTitle}>Your Shopping Cart is Empty</Text>
          <Text style={styles.emptySub}>
            Explore acoustic guitars, concert tablas, club DJ mixers, and classical dance costumes
            from our verified partner shops.
          </Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            onPress={() => tabNav.navigate('Shop', { initialCategory: 'ALL' })}
          >
            <Text style={styles.shopNowText}>Browse Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Partner Routing Banner */}
          <View style={styles.partnerRouteBanner}>
            <Ionicons name="storefront" size={18} color={COLORS.purplePrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerRouteTitle}>
                Direct Partner Order → {activeShop.storeName}
              </Text>
              <Text style={styles.partnerRouteSub}>
                This order automatically appears in the {activeShop.storeName} Shop Partner App.
              </Text>
            </View>
          </View>

          {/* Cart Items */}
          {cart.map((item) => (
            <View key={`${item.product.id}_${item.variant}`} style={styles.cartCard}>
              <Image source={item.product.image} style={styles.cartThumb} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cartName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.cartVariant}>{item.variant}</Text>
                <Text style={styles.cartPrice}>
                  {formatInr(item.product.priceInr * item.qty)}
                </Text>

                <View style={styles.qtyRow}>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQty(item.product.id, item.variant, -1)}
                    >
                      <Ionicons name="remove" size={16} color={COLORS.ink} />
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{item.qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQty(item.product.id, item.variant, 1)}
                    >
                      <Ionicons name="add" size={16} color={COLORS.ink} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeFromCart(item.product.id, item.variant)}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Coupon Box */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Apply Promo Coupon</Text>
            {appliedCoupon ? (
              <View style={styles.appliedCouponRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appliedCode}>{appliedCoupon.code} APPLIED</Text>
                  <Text style={styles.appliedSavings}>
                    You save {formatInr(discountInr)} on this order!
                  </Text>
                </View>
                <TouchableOpacity onPress={removeCoupon}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.couponRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter SANJIT10 or BIHU15"
                    placeholderTextColor={COLORS.inkMuted}
                    value={couponInput}
                    onChangeText={setCouponInput}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.couponHint}>
                  Available codes: SANJIT10 (10% off above ₹1,500) • BIHU15 (15% off above ₹5,000)
                </Text>
              </>
            )}
          </View>

          {/* Delivery Address */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <TextInput
              style={styles.addressInput}
              multiline
              numberOfLines={3}
              value={addressInput}
              onChangeText={setAddressInput}
              placeholder="House/Flat, Street, Landmark, City, PIN"
              placeholderTextColor={COLORS.inkMuted}
            />
          </View>

          {/* Payment Method */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Payment Method</Text>

            <TouchableOpacity
              style={[
                styles.payOption,
                paymentMethod === 'RAZORPAY_UPI' && styles.payOptionActive,
              ]}
              onPress={() => setPaymentMethod('RAZORPAY_UPI')}
            >
              <Ionicons
                name={
                  paymentMethod === 'RAZORPAY_UPI' ? 'radio-button-on' : 'radio-button-off'
                }
                size={20}
                color={COLORS.purplePrimary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>UPI QR / GPay / PhonePe (Instant)</Text>
                <Text style={styles.paySub}>
                  Scan & Pay directly to {activeShop.upiVpa}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.payOption,
                paymentMethod === 'RAZORPAY_CARD' && styles.payOptionActive,
              ]}
              onPress={() => setPaymentMethod('RAZORPAY_CARD')}
            >
              <Ionicons
                name={
                  paymentMethod === 'RAZORPAY_CARD' ? 'radio-button-on' : 'radio-button-off'
                }
                size={20}
                color={COLORS.purplePrimary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>Online Card / NetBanking (Razorpay)</Text>
                <Text style={styles.paySub}>Visa, Mastercard, RuPay & Instant NetBanking</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.payOption,
                paymentMethod === 'COD' && styles.payOptionActive,
                !activeShop.codEnabled && { opacity: 0.5 },
              ]}
              disabled={!activeShop.codEnabled}
              onPress={() => setPaymentMethod('COD')}
            >
              <Ionicons
                name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={COLORS.purplePrimary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.paySub}>
                  {activeShop.codEnabled
                    ? 'Pay in cash or UPI at doorstep with 4-digit Delivery OTP'
                    : `Prepaid online payment required by ${activeShop.storeName}`}
                </Text>
              </View>
            </TouchableOpacity>

            {paymentMethod === 'RAZORPAY_UPI' ? (
              <View style={styles.qrBox}>
                <Text style={styles.qrHeading}>
                  Scan & Pay {formatInr(cartTotal)} to {activeShop.storeName}
                </Text>
                <View style={styles.qrWrap}>
                  <QRCode value={upiUri} size={150} color={COLORS.purpleDeep} />
                </View>
                <Text style={styles.qrVpa}>UPI ID: {activeShop.upiVpa}</Text>
                <TouchableOpacity style={styles.openUpiBtn} onPress={handleOpenUpiApp}>
                  <Ionicons name="open-outline" size={16} color={COLORS.purpleDeep} />
                  <Text style={styles.openUpiText}>Pay with Installed UPI App</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.utrInput}
                  placeholder="Optional: Enter 12-digit UPI UTR / Ref ID"
                  placeholderTextColor={COLORS.inkMuted}
                  value={upiRefInput}
                  onChangeText={setUpiRefInput}
                />
              </View>
            ) : null}
          </View>

          {/* Price Summary */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Order Bill Summary</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Items Subtotal</Text>
              <Text style={styles.billVal}>{formatInr(cartSubtotal)}</Text>
            </View>
            {discountInr > 0 ? (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: COLORS.success }]}>
                  Coupon Discount ({appliedCoupon?.code})
                </Text>
                <Text style={[styles.billVal, { color: COLORS.success }]}>
                  -{formatInr(discountInr)}
                </Text>
              </View>
            ) : null}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>
                Delivery (Free above {formatInr(activeShop.freeDeliveryThresholdInr)})
              </Text>
              <Text style={styles.billVal}>
                {deliveryFeeInr === 0 ? 'FREE' : formatInr(deliveryFeeInr)}
              </Text>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Total Payable</Text>
              <Text style={styles.billTotalVal}>{formatInr(cartTotal)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.placeOrderBtn, submitting && { opacity: 0.7 }]}
              onPress={handleCheckout}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.goldPrimary} />
                  <Text style={styles.placeOrderText}>
                    {paymentMethod === 'COD'
                      ? `Place COD Order • ${formatInr(cartTotal)}`
                      : `Confirm & Place Order • ${formatInr(cartTotal)}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: rs(17),
    fontWeight: '800',
  },
  headerSub: {
    color: '#DDD6FE',
    fontSize: rs(11.5),
    marginTop: 2,
  },
  emptyWrap: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: rs(16),
    fontWeight: '800',
  },
  emptySub: {
    color: COLORS.inkSecondary,
    fontSize: rs(12.5),
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  shopNowBtn: {
    marginTop: 18,
    backgroundColor: COLORS.purplePrimary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  shopNowText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: rs(13.5),
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
  partnerRouteBanner: {
    backgroundColor: COLORS.purpleSoft,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partnerRouteTitle: {
    color: COLORS.purpleDeep,
    fontSize: rs(12.5),
    fontWeight: '800',
  },
  partnerRouteSub: {
    color: COLORS.inkSecondary,
    fontSize: rs(11),
    marginTop: 2,
  },
  cartCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    flexDirection: 'row',
    gap: 12,
  },
  cartThumb: {
    width: 82,
    height: 86,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
  },
  cartName: {
    color: COLORS.ink,
    fontSize: rs(13),
    fontWeight: '800',
  },
  cartVariant: {
    color: COLORS.inkMuted,
    fontSize: rs(11),
    marginTop: 2,
  },
  cartPrice: {
    color: COLORS.purplePrimary,
    fontSize: rs(14.5),
    fontWeight: '900',
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  qtyVal: {
    color: COLORS.ink,
    fontSize: rs(13),
    fontWeight: '800',
    minWidth: 22,
    textAlign: 'center',
  },
  removeText: {
    color: COLORS.danger,
    fontSize: rs(12),
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: rs(14),
    fontWeight: '800',
    marginBottom: 10,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    height: 42,
    color: COLORS.ink,
    fontSize: rs(13),
    fontWeight: '700',
  },
  applyBtn: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  applyBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: rs(12.5),
  },
  couponHint: {
    color: COLORS.inkMuted,
    fontSize: rs(11),
    marginTop: 8,
  },
  appliedCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successSoft,
    borderRadius: RADIUS.sm,
    padding: 10,
  },
  appliedCode: {
    color: COLORS.success,
    fontSize: rs(12.5),
    fontWeight: '900',
  },
  appliedSavings: {
    color: COLORS.inkSecondary,
    fontSize: rs(11.5),
    marginTop: 2,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.sm,
    padding: 10,
    color: COLORS.ink,
    fontSize: rs(12.5),
    textAlignVertical: 'top',
    minHeight: 72,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
  },
  payOptionActive: {
    borderColor: COLORS.purplePrimary,
    backgroundColor: COLORS.purpleSoft,
  },
  payTitle: {
    color: COLORS.ink,
    fontSize: rs(13),
    fontWeight: '800',
  },
  paySub: {
    color: COLORS.inkSecondary,
    fontSize: rs(11),
    marginTop: 2,
  },
  qrBox: {
    marginTop: 6,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
  },
  qrHeading: {
    color: COLORS.purpleDeep,
    fontSize: rs(12.5),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  qrWrap: {
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrVpa: {
    color: COLORS.inkSecondary,
    fontSize: rs(11.5),
    fontWeight: '700',
    marginTop: 8,
  },
  openUpiBtn: {
    marginTop: 10,
    backgroundColor: COLORS.goldPrimary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openUpiText: {
    color: COLORS.purpleDeep,
    fontSize: rs(12),
    fontWeight: '800',
  },
  utrInput: {
    marginTop: 10,
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    height: 40,
    color: COLORS.ink,
    fontSize: rs(12),
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  billLabel: {
    color: COLORS.inkSecondary,
    fontSize: rs(12.5),
  },
  billVal: {
    color: COLORS.ink,
    fontSize: rs(12.5),
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  billTotalLabel: {
    color: COLORS.ink,
    fontSize: rs(15),
    fontWeight: '900',
  },
  billTotalVal: {
    color: COLORS.purplePrimary,
    fontSize: rs(16),
    fontWeight: '900',
  },
  placeOrderBtn: {
    marginTop: 14,
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeOrderText: {
    color: COLORS.white,
    fontSize: rs(14),
    fontWeight: '900',
  },
});
