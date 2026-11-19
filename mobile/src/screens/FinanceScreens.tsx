import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePartnerStore } from '../context/PartnerStoreContext';
import { DEMO_SALES_SERIES } from '../data/demoData';
import { DemoModeBanner, PrimaryButton } from '../components/DemoBanner';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';

/** Screen 14: Earnings Hub (Earnings Tab) */
export const EarningsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { orders, withdrawals, shopProfile, plans } = usePartnerStore();
  const activePlan = plans.find((p) => p.id === shopProfile.activePlanId) || plans[1];

  const gross = orders
    .filter((o) => o.status !== 'REJECTED')
    .reduce((sum, o) => sum + o.subtotalInr, 0);
  const commission = orders
    .filter((o) => o.status !== 'REJECTED')
    .reduce((sum, o) => sum + o.platformCommissionInr, 0);
  const net = gross - commission;
  const withdrawn = withdrawals.reduce((sum, w) => sum + w.amountInr, 0);
  const availableDemoBalance = Math.max(0, net - withdrawn);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner note="Demo Earnings Ledger — All figures below are simulated demo calculations, not real bank payouts." />

        <View style={styles.heroCard}>
          <Text style={styles.heroOverline}>AVAILABLE DEMO PAYOUT BALANCE</Text>
          <Text style={styles.heroAmount}>
            ₹{availableDemoBalance.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.heroSub}>
            Gross ₹{gross.toLocaleString('en-IN')} · Commission ({activePlan.commissionPercent}%) ₹
            {commission.toLocaleString('en-IN')}
          </Text>
          <View style={{ marginTop: 12 }}>
            <PrimaryButton
              title="Request Withdrawal (Demo)"
              variant="gold"
              icon="wallet-outline"
              onPress={() => navigation.navigate('WithdrawalRequests')}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Finance & Subscription Screens</Text>
          <PrimaryButton
            title="Sales Reports & Weekly Chart"
            variant="outline"
            icon="bar-chart-outline"
            onPress={() => navigation.navigate('SalesReports')}
          />
          <PrimaryButton
            title="Platform Commission Calculator"
            variant="outline"
            icon="calculator-outline"
            onPress={() => navigation.navigate('PlatformCommission')}
          />
          <PrimaryButton
            title="Subscription Plans"
            variant="outline"
            icon="ribbon-outline"
            onPress={() => navigation.navigate('SubscriptionPlans')}
          />
          <PrimaryButton
            title="Subscription Payment History"
            variant="outline"
            icon="receipt-outline"
            onPress={() => navigation.navigate('SubscriptionPayments')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 13: Sales Reports Screen */
export const SalesReportsScreen: React.FC = () => {
  const maxSales = Math.max(...DEMO_SALES_SERIES.map((d) => d.salesInr), 1);
  const totalWeek = DEMO_SALES_SERIES.reduce((sum, d) => sum + d.salesInr, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner />
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>7-Day Demo Sales Performance</Text>
          <Text style={styles.bigMetric}>₹{totalWeek.toLocaleString('en-IN')}</Text>
          <Text style={styles.meta}>Top Category: Electronic Musical Equipment & Dance Dresses</Text>

          <View style={styles.chartRow}>
            {DEMO_SALES_SERIES.map((bar) => {
              const heightPct = Math.max(14, Math.round((bar.salesInr / maxSales) * 100));
              return (
                <View key={bar.label} style={styles.chartCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${heightPct}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{bar.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 15: Platform Commission Screen */
export const PlatformCommissionScreen: React.FC = () => {
  const { orders, plans, shopProfile } = usePartnerStore();
  const activePlan = plans.find((p) => p.id === shopProfile.activePlanId) || plans[1];
  const [sampleOrderAmt, setSampleOrderAmt] = useState('15000');

  const amt = Math.max(0, Number(sampleOrderAmt) || 0);
  const fee = Math.round((amt * activePlan.commissionPercent) / 100);
  const sellerGets = amt - fee;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner />
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Interactive Commission Calculator</Text>
          <Text style={styles.meta}>
            Active Plan: {activePlan.name} ({activePlan.commissionPercent}% commission)
          </Text>

          <Text style={styles.label}>Test Order Amount (₹)</Text>
          <TextInput
            value={sampleOrderAmt}
            onChangeText={setSampleOrderAmt}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.rowBetween}>
            <Text style={styles.meta}>Platform Fee ({activePlan.commissionPercent}%)</Text>
            <Text style={[styles.amount, { color: COLORS.danger }]}>
              -₹{fee.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Estimated Net Seller Earning</Text>
            <Text style={[styles.amount, { color: COLORS.success }]}>
              ₹{sellerGets.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order-Wise Commission Ledger</Text>
          {orders.map((ord) => (
            <View key={ord.id} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>{ord.id} · {ord.customerName}</Text>
                <Text style={styles.meta}>Gross ₹{ord.subtotalInr.toLocaleString('en-IN')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.meta, { color: COLORS.danger }]}>
                  Fee -₹{ord.platformCommissionInr}
                </Text>
                <Text style={styles.amount}>Net ₹{ord.netEarningInr.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 16: Subscription Plans Screen */
export const SubscriptionPlansScreen: React.FC = () => {
  const { plans, shopProfile, switchSubscriptionPlanDemo } = usePartnerStore();

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner note="Demo Subscription Preview — Switching plans updates demo state only; no real payment is charged." />
        {plans.map((plan) => {
          const isCurrent = plan.id === shopProfile.activePlanId;
          return (
            <View
              key={plan.id}
              style={[
                styles.card,
                isCurrent && { borderColor: COLORS.goldPrimary, borderWidth: 2 },
              ]}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>{plan.name}</Text>
                <Text style={styles.orderId}>₹{plan.monthlyPriceInr}/mo</Text>
              </View>
              <Text style={styles.meta}>
                Commission: {plan.commissionPercent}% · Max Products: {plan.productLimit}
              </Text>
              {plan.features.map((f) => (
                <Text key={f} style={styles.meta}>• {f}</Text>
              ))}
              <PrimaryButton
                title={isCurrent ? 'Current Active Plan (Demo)' : 'Switch to Plan (Demo)'}
                variant={isCurrent ? 'gold' : 'purple'}
                disabled={isCurrent}
                onPress={() => switchSubscriptionPlanDemo(plan.id)}
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 17: Subscription Payments Screen */
export const SubscriptionPaymentsScreen: React.FC = () => {
  const { subscriptionPayments } = usePartnerStore();

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner note="Demo Billing Records — Simulated entries only; not live payment gateway receipts." />
        {subscriptionPayments.map((pay) => (
          <View key={pay.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.orderId}>{pay.id}</Text>
              <Text style={styles.amount}>₹{pay.amountInr.toLocaleString('en-IN')}</Text>
            </View>
            <Text style={styles.sectionTitle}>{pay.planName}</Text>
            <Text style={styles.meta}>
              {pay.date} · {pay.mode} · {pay.status}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 18: Withdrawal Requests Screen */
export const WithdrawalRequestsScreen: React.FC = () => {
  const { withdrawals, shopProfile, requestWithdrawalDemo } = usePartnerStore();
  const [amountStr, setAmountStr] = useState('5000');

  const handleRequest = () => {
    const val = Number(amountStr) || 0;
    const ok = requestWithdrawalDemo(val);
    if (!ok) {
      Alert.alert('Minimum Amount', 'Enter at least ₹500 to test a demo withdrawal request.');
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <DemoModeBanner note="Demo Withdrawal Simulator — No real bank transfer or UPI disbursement occurs." />
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>New Demo Withdrawal Request</Text>
            <Text style={styles.meta}>
              Target Account: {shopProfile.bankAccountMasked} · UPI: {shopProfile.upiId}
            </Text>
            <TextInput
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="numeric"
              style={styles.input}
              placeholder="Amount in INR"
            />
            <PrimaryButton
              title="Submit Demo Withdrawal Request"
              variant="gold"
              icon="cash-outline"
              onPress={handleRequest}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Withdrawal History ({withdrawals.length})</Text>
            {withdrawals.map((w) => (
              <View key={w.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>{w.id} · {w.status}</Text>
                  <Text style={styles.meta}>{w.bankAccount} · {w.requestedAt}</Text>
                </View>
                <Text style={styles.amount}>₹{w.amountInr.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  heroOverline: { color: COLORS.goldPrimary, fontSize: rs(10), fontWeight: '700' },
  heroAmount: { color: COLORS.white, fontSize: rs(26), fontWeight: '800', marginTop: 4 },
  heroSub: { color: '#E9D5FF', fontSize: rs(12), marginTop: 4 },
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
  bigMetric: { fontSize: rs(24), fontWeight: '800', color: COLORS.purplePrimary },
  meta: { fontSize: rs(12), color: COLORS.inkSecondary },
  label: { fontSize: rs(12), fontWeight: '700', color: COLORS.ink },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: rs(14),
    color: COLORS.ink,
    backgroundColor: COLORS.canvas,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  orderId: { fontSize: rs(13), fontWeight: '800', color: COLORS.purplePrimary },
  amount: { fontSize: rs(14), fontWeight: '800', color: COLORS.ink },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.purpleSoft,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingTop: 14,
    gap: 8,
  },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: {
    width: '72%',
    flex: 1,
    backgroundColor: COLORS.purpleSoft,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: COLORS.purplePrimary, borderRadius: 8 },
  barLabel: { fontSize: rs(11), fontWeight: '700', color: COLORS.inkSecondary, marginTop: 6 },
});
