import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCustomer } from '../context/CustomerContext';
import { COLORS, RADIUS, formatInr, rs } from '../theme/theme';
import { CustomerOrder, OrderStatus } from '../types';

const STATUS_STEPS: OrderStatus[] = ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function statusColor(status: OrderStatus): { bg: string; fg: string } {
  if (status === 'DELIVERED') return { bg: COLORS.successSoft, fg: COLORS.success };
  if (status === 'CANCELLED') return { bg: COLORS.dangerSoft, fg: COLORS.danger };
  if (status === 'OUT_FOR_DELIVERY') return { bg: COLORS.goldSoft, fg: COLORS.goldDark };
  return { bg: COLORS.purpleSoft, fg: COLORS.purplePrimary };
}

export const OrdersScreen: React.FC = () => {
  const { orders, cancelOrder, submitReview } = useCustomer();

  const [reviewOrder, setReviewOrder] = useState<CustomerOrder | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleCancel = (order: CustomerOrder) => {
    Alert.alert(
      'Cancel Order?',
      `Are you sure you want to cancel ${order.id} from ${order.shopName}?`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelOrder(order.id).catch(() => {});
          },
        },
      ]
    );
  };

  const handleReviewSubmit = async () => {
    if (!reviewOrder) return;
    if (comment.trim().length < 5) {
      Alert.alert('Review Needed', 'Please write a short review (at least 5 characters).');
      return;
    }
    const firstItem = reviewOrder.items[0];
    await submitReview({
      tenantId: reviewOrder.tenantId,
      productId: firstItem?.productId || 'store_general',
      productName: firstItem?.name || reviewOrder.shopName,
      orderRef: reviewOrder.id,
      rating,
      comment: comment.trim(),
    });
    setReviewOrder(null);
    setComment('');
    setRating(5);
    Alert.alert('Thank You!', `Your review has been submitted to ${reviewOrder.shopName}.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders & Live Tracking</Text>
        <Text style={styles.headerSub}>{orders.length} order(s) placed</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {orders.map((order) => {
          const badge = statusColor(order.status);
          const activeStepIndex = STATUS_STEPS.indexOf(order.status);
          const canCancel = order.status === 'CONFIRMED' || order.status === 'PACKED';

          return (
            <View key={order.id} style={styles.orderCard}>
              {/* Header */}
              <View style={styles.orderTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.shopPill}>
                    <Ionicons name="storefront-outline" size={11} color={COLORS.purplePrimary} />
                    <Text style={styles.shopPillText} numberOfLines={1}>
                      {order.shopName}
                    </Text>
                  </View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderDate}>{order.createdAt}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusText, { color: badge.fg }]}>
                    {order.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              {/* Sync indicator */}
              {order.syncedToBackend || order.syncedToFirestore ? (
                <View style={styles.syncRow}>
                  <Ionicons name="checkmark-done-circle" size={14} color={COLORS.success} />
                  <Text style={styles.syncText}>
                    Synced to {order.shopName} Partner App
                  </Text>
                </View>
              ) : null}

              {/* Items */}
              <View style={styles.itemsBox}>
                {order.items.map((it, idx) => (
                  <View key={`${order.id}_${idx}`} style={styles.itemLine}>
                    <Text style={styles.itemLineName} numberOfLines={2}>
                      {it.qty}× {it.name}
                    </Text>
                    <Text style={styles.itemLinePrice}>
                      {formatInr(it.unitPriceInr * it.qty)}
                    </Text>
                  </View>
                ))}
                <View style={styles.totalLine}>
                  <Text style={styles.paymentChip}>
                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod.replace('RAZORPAY_', 'Online ')} •{' '}
                    {order.paymentStatus.replace('_', ' ')}
                  </Text>
                  <Text style={styles.totalAmount}>{formatInr(order.totalInr)}</Text>
                </View>
              </View>

              {/* Delivery OTP + Courier */}
              {order.status !== 'CANCELLED' ? (
                <View style={styles.otpStrip}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courierText}>{order.courierName}</Text>
                    <Text style={styles.awbText}>AWB: {order.awbCode}</Text>
                  </View>
                  <View style={styles.otpBox}>
                    <Text style={styles.otpLabel}>DELIVERY OTP</Text>
                    <Text style={styles.otpVal}>{order.deliveryOtp}</Text>
                  </View>
                </View>
              ) : null}

              {/* Progress Stepper */}
              {order.status !== 'CANCELLED' ? (
                <View style={styles.stepperRow}>
                  {STATUS_STEPS.map((step, i) => {
                    const reached = i <= activeStepIndex;
                    return (
                      <View key={step} style={styles.stepItem}>
                        <View style={[styles.stepDot, reached && styles.stepDotActive]} />
                        <Text
                          style={[styles.stepLabel, reached && styles.stepLabelActive]}
                          numberOfLines={1}
                        >
                          {step === 'OUT_FOR_DELIVERY'
                            ? 'Out'
                            : step.charAt(0) + step.slice(1).toLowerCase()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* Latest Tracking Updates */}
              <View style={styles.timelineBox}>
                {order.trackingHistory.slice(-2).map((entry, idx) => (
                  <View key={`${order.id}_trk_${idx}`} style={styles.timelineRow}>
                    <View style={styles.timelineBullet} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timelineLoc}>
                        {entry.location} • {entry.timestamp}
                      </Text>
                      <Text style={styles.timelineNote}>{entry.note}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                {canCancel ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(order)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Order</Text>
                  </TouchableOpacity>
                ) : null}
                {order.status !== 'CANCELLED' ? (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => setReviewOrder(order)}
                  >
                    <Ionicons name="star-outline" size={15} color={COLORS.purplePrimary} />
                    <Text style={styles.reviewBtnText}>Rate & Review</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={Boolean(reviewOrder)}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate {reviewOrder?.shopName}</Text>
            <Text style={styles.modalSub}>Order {reviewOrder?.id}</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={30}
                    color={COLORS.goldPrimary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              multiline
              numberOfLines={4}
              placeholder="Share sound quality, packaging, or delivery experience..."
              placeholderTextColor={COLORS.inkMuted}
              value={comment}
              onChangeText={setComment}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setReviewOrder(null)}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleReviewSubmit}>
                <Text style={styles.modalSubmitText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scroll: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    padding: 14,
    gap: 14,
    paddingBottom: 28,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  shopPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.purpleSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  shopPillText: {
    color: COLORS.purplePrimary,
    fontSize: rs(10.5),
    fontWeight: '800',
  },
  orderId: {
    color: COLORS.ink,
    fontSize: rs(14.5),
    fontWeight: '900',
  },
  orderDate: {
    color: COLORS.inkMuted,
    fontSize: rs(11),
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: rs(10),
    fontWeight: '900',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  syncText: {
    color: COLORS.success,
    fontSize: rs(11),
    fontWeight: '700',
  },
  itemsBox: {
    marginTop: 10,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 6,
  },
  itemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemLineName: {
    color: COLORS.ink,
    fontSize: rs(12),
    fontWeight: '700',
    flex: 1,
  },
  itemLinePrice: {
    color: COLORS.ink,
    fontSize: rs(12),
    fontWeight: '800',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
  },
  paymentChip: {
    color: COLORS.inkSecondary,
    fontSize: rs(11),
    fontWeight: '700',
    flex: 1,
  },
  totalAmount: {
    color: COLORS.purplePrimary,
    fontSize: rs(15),
    fontWeight: '900',
  },
  otpStrip: {
    marginTop: 10,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  courierText: {
    color: COLORS.ink,
    fontSize: rs(12),
    fontWeight: '800',
  },
  awbText: {
    color: COLORS.inkSecondary,
    fontSize: rs(11),
    marginTop: 1,
  },
  otpBox: {
    backgroundColor: COLORS.purpleDeep,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  otpLabel: {
    color: '#DDD6FE',
    fontSize: 8.5,
    fontWeight: '800',
  },
  otpVal: {
    color: COLORS.goldPrimary,
    fontSize: rs(14),
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 2,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: COLORS.purplePrimary,
  },
  stepLabel: {
    color: COLORS.inkMuted,
    fontSize: 9.5,
    fontWeight: '700',
  },
  stepLabelActive: {
    color: COLORS.purplePrimary,
  },
  timelineBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  timelineBullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.goldPrimary,
    marginTop: 5,
  },
  timelineLoc: {
    color: COLORS.ink,
    fontSize: rs(11.5),
    fontWeight: '800',
  },
  timelineNote: {
    color: COLORS.inkSecondary,
    fontSize: rs(11),
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: COLORS.dangerSoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontSize: rs(12),
    fontWeight: '800',
  },
  reviewBtn: {
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewBtnText: {
    color: COLORS.purplePrimary,
    fontSize: rs(12),
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
  },
  modalTitle: {
    color: COLORS.ink,
    fontSize: rs(16),
    fontWeight: '900',
  },
  modalSub: {
    color: COLORS.inkMuted,
    fontSize: rs(12),
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.md,
    padding: 10,
    color: COLORS.ink,
    fontSize: rs(12.5),
    minHeight: 88,
    textAlignVertical: 'top',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: COLORS.inkSecondary,
    fontWeight: '700',
  },
  modalSubmit: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalSubmitText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
