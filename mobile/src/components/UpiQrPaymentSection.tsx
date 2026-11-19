import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';
import { PartnerOrder } from '../types';
import { PrimaryButton } from './DemoBanner';

export function buildNpciUpiUri(params: {
  vpa: string;
  payeeName: string;
  amountInr: number;
  transactionRef: string;
  note: string;
}): string {
  const qs = [
    `pa=${encodeURIComponent(params.vpa.trim())}`,
    `pn=${encodeURIComponent(params.payeeName.trim().slice(0, 60))}`,
    `am=${encodeURIComponent(params.amountInr.toFixed(2))}`,
    'cu=INR',
    `tr=${encodeURIComponent(params.transactionRef.trim())}`,
    `tn=${encodeURIComponent(params.note.trim().slice(0, 80))}`,
    'mc=5733',
  ].join('&');
  return `upi://pay?${qs}`;
}

interface UpiQrPaymentSectionProps {
  order: PartnerOrder;
  shopName: string;
  defaultUpiId: string;
  onConfirmUpiPayment: (orderId: string, utr: string, vpaUsed: string) => void;
}

export const UpiQrPaymentSection: React.FC<UpiQrPaymentSectionProps> = ({
  order,
  shopName,
  defaultUpiId,
  onConfirmUpiPayment,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [vpa, setVpa] = useState(defaultUpiId || 'sanjit.guwahati@okaxis');
  const [sessionSeed, setSessionSeed] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [utrInput, setUtrInput] = useState('');

  const isPaid = order.upiPaymentStatus === 'PAID_UPI_QR';

  useEffect(() => {
    if (!modalVisible || isPaid) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [modalVisible, isPaid]);

  const txRef = `${order.invoiceNo.replace(/[^a-zA-Z0-9]/g, '')}S${sessionSeed}`;
  const upiUri = useMemo(
    () =>
      buildNpciUpiUri({
        vpa: vpa.trim() || defaultUpiId,
        payeeName: shopName,
        amountInr: order.subtotalInr,
        transactionRef: txRef,
        note: `Order ${order.id} - ${shopName}`,
      }),
    [vpa, defaultUpiId, shopName, order.subtotalInr, order.id, txRef]
  );

  const formattedTimer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

  const handleRegenerateQr = () => {
    setSessionSeed((s) => s + 1);
    setSecondsLeft(300);
  };

  const handleOpenUpiApp = async () => {
    try {
      const supported = await Linking.canOpenURL(upiUri);
      if (supported) {
        await Linking.openURL(upiUri);
      } else {
        Alert.alert(
          'UPI App Not Found',
          'Ask the customer to scan this QR code using Google Pay, PhonePe, Paytm, or BHIM.'
        );
      }
    } catch {
      Alert.alert('Unable to launch UPI app', 'Have the customer scan the QR directly on screen.');
    }
  };

  const handleSharePaymentLink = async () => {
    try {
      await Share.share({
        message: `${shopName} — UPI Payment Request for Order ${order.id}\nAmount: ₹${order.subtotalInr.toLocaleString(
          'en-IN'
        )}\nUPI ID: ${vpa}\nPay via UPI: ${upiUri}`,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  const handleConfirmDemoPayment = () => {
    const cleanUtr =
      utrInput.trim().replace(/\s+/g, '') ||
      `4323${Math.floor(10000000 + Math.random() * 89999999)}`;
    onConfirmUpiPayment(order.id, cleanUtr, vpa.trim() || defaultUpiId);
    setUtrInput('');
    setModalVisible(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Ionicons name="qr-code-outline" size={18} color={COLORS.purplePrimary} />
          <Text style={styles.sectionTitle}>In-Store UPI QR Payment</Text>
        </View>
        <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.pendingBadge]}>
          <Text style={[styles.statusBadgeText, isPaid ? styles.paidText : styles.pendingText]}>
            {isPaid ? 'PAID · UPI QR' : 'SCAN & PAY'}
          </Text>
        </View>
      </View>

      {isPaid ? (
        <View style={styles.receiptBox}>
          <View style={styles.rowBetween}>
            <Text style={styles.receiptLabel}>Demo Collection Recorded</Text>
            <Text style={styles.receiptAmount}>
              ₹{order.subtotalInr.toLocaleString('en-IN')}
            </Text>
          </View>
          <Text style={styles.meta}>UTR Reference: {order.upiUtr}</Text>
          <Text style={styles.meta}>
            Merchant VPA: {order.upiVpaUsed || vpa} · {order.upiPaidAt}
          </Text>
          <Text style={styles.demoFootnote}>
            Demo Mode verification recorded locally. Connect Razorpay / Cashfree / PhonePe PG webhook for live settlement.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.meta}>
            Collect ₹{order.subtotalInr.toLocaleString('en-IN')} directly at your shop counter. Customer scans the NPCI UPI QR with GPay, PhonePe, Paytm, or BHIM.
          </Text>
          <View style={styles.vpaPreviewRow}>
            <Text style={styles.meta}>Counter UPI ID:</Text>
            <Text style={styles.vpaText}>{vpa}</Text>
          </View>
          <PrimaryButton
            title="Show Customer Scan & Pay QR"
            variant="gold"
            icon="qr-code-outline"
            onPress={() => {
              setSecondsLeft(300);
              setModalVisible(true);
            }}
          />
        </>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOverline}>SANJIT SHOP PARTNER · COUNTER UPI QR</Text>
                  <Text style={styles.modalTitle}>{shopName}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color={COLORS.purplePrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.amountStrip}>
                <View>
                  <Text style={styles.amountLabel}>Payable Amount ({order.id})</Text>
                  <Text style={styles.amountHero}>
                    ₹{order.subtotalInr.toLocaleString('en-IN')}.00
                  </Text>
                </View>
                <View style={styles.timerBox}>
                  <Ionicons name="time-outline" size={14} color={COLORS.goldPrimary} />
                  <Text style={styles.timerText}>
                    {secondsLeft > 0 ? formattedTimer : 'EXPIRED'}
                  </Text>
                </View>
              </View>

              {/* Scannable ISO/NPCI UPI QR Frame */}
              <View style={styles.qrFrame}>
                <View style={styles.qrInner}>
                  <QRCode
                    value={upiUri}
                    size={196}
                    color="#2E1065"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrVpaCaption}>{vpa}</Text>
                <Text style={styles.qrAppsCaption}>
                  Scan with Google Pay · PhonePe · Paytm · BHIM · Any UPI App
                </Text>
                <Text style={styles.qrRefCaption}>Ref: {txRef}</Text>
              </View>

              {secondsLeft === 0 ? (
                <PrimaryButton
                  title="QR Expired — Regenerate Dynamic QR"
                  variant="gold"
                  icon="refresh-outline"
                  onPress={handleRegenerateQr}
                />
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Partner Counter UPI ID (VPA)</Text>
                <TextInput
                  value={vpa}
                  onChangeText={setVpa}
                  autoCapitalize="none"
                  placeholder="shop@upi"
                  placeholderTextColor={COLORS.inkMuted}
                  style={styles.input}
                />
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Open UPI App"
                    variant="outline"
                    icon="open-outline"
                    onPress={handleOpenUpiApp}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Share QR Link"
                    variant="outline"
                    icon="share-social-outline"
                    onPress={handleSharePaymentLink}
                  />
                </View>
              </View>

              <View style={styles.verifyBox}>
                <Text style={styles.verifyTitle}>Verify Customer Payment (Demo Mode)</Text>
                <Text style={styles.meta}>
                  Enter 12-digit UPI UTR from customer&apos;s payment screen (optional in Demo Mode) and confirm receipt:
                </Text>
                <TextInput
                  value={utrInput}
                  onChangeText={setUtrInput}
                  keyboardType="number-pad"
                  maxLength={16}
                  placeholder="e.g. 432398451209 (Auto-generated if blank)"
                  placeholderTextColor={COLORS.inkMuted}
                  style={styles.input}
                />
                <PrimaryButton
                  title="Confirm UPI Payment Received (Demo)"
                  icon="checkmark-circle-outline"
                  onPress={handleConfirmDemoPayment}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    marginBottom: SPACING.md,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: { fontSize: rs(14), fontWeight: '800', color: COLORS.ink },
  meta: { fontSize: rs(12), color: COLORS.inkSecondary, lineHeight: rs(17) },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  paidBadge: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  pendingBadge: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  statusBadgeText: { fontSize: rs(10), fontWeight: '800' },
  paidText: { color: '#047857' },
  pendingText: { color: '#92400E' },
  vpaPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.purpleSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  vpaText: { fontSize: rs(12), fontWeight: '800', color: COLORS.purplePrimary },
  receiptBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 4,
  },
  receiptLabel: { fontSize: rs(12), fontWeight: '800', color: '#065F46' },
  receiptAmount: { fontSize: rs(15), fontWeight: '800', color: '#065F46' },
  demoFootnote: { fontSize: rs(10), color: '#047857', marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 7, 30, 0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '92%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderTopColor: COLORS.goldPrimary,
  },
  modalScroll: { padding: SPACING.md, gap: 12, paddingBottom: 28 },
  modalOverline: { fontSize: rs(10), fontWeight: '800', color: COLORS.goldDark },
  modalTitle: { fontSize: rs(17), fontWeight: '800', color: COLORS.purplePrimary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountStrip: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: { color: '#E9D5FF', fontSize: rs(11), fontWeight: '600' },
  amountHero: { color: COLORS.white, fontSize: rs(22), fontWeight: '800' },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timerText: { color: COLORS.goldPrimary, fontSize: rs(12), fontWeight: '800' },
  qrFrame: {
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 6,
  },
  qrInner: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
  },
  qrVpaCaption: { fontSize: rs(13), fontWeight: '800', color: COLORS.purplePrimary, marginTop: 4 },
  qrAppsCaption: { fontSize: rs(11), fontWeight: '600', color: COLORS.inkSecondary, textAlign: 'center' },
  qrRefCaption: { fontSize: rs(10), color: COLORS.inkMuted },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: rs(12), fontWeight: '700', color: COLORS.ink },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: rs(13),
    color: COLORS.ink,
    backgroundColor: COLORS.canvas,
  },
  twoCol: { flexDirection: 'row', gap: 8 },
  verifyBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 8,
  },
  verifyTitle: { fontSize: rs(13), fontWeight: '800', color: COLORS.purplePrimary },
});
