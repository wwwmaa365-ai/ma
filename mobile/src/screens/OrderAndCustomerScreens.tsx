import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePartnerStore } from '../context/PartnerStoreContext';
import { DemoModeBanner, PrimaryButton } from '../components/DemoBanner';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';
import { OrderStatus } from '../types';

/** Screen 9: New Orders & Order List (Orders Tab) */
export const NewOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { orders, updateOrderStatus } = usePartnerStore();
  const [filter, setFilter] = useState<'ALL' | OrderStatus>('ALL');

  const statuses: ('ALL' | OrderStatus)[] = [
    'ALL',
    'NEW',
    'ACCEPTED',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const filtered = orders.filter((o) => filter === 'ALL' || o.status === filter);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.scrollBody}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 12 }}>
            <DemoModeBanner />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {statuses.map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setFilter(st)}
                  style={[styles.filterBtn, filter === st && styles.filterBtnActive]}
                >
                  <Text style={[styles.filterText, filter === st && styles.filterTextActive]}>
                    {st === 'ALL' ? `All (${orders.length})` : st.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item: order }) => (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.orderId}>
                {order.id} · {order.status.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.amount}>₹{order.subtotalInr.toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('CustomerDetails', { customerId: order.customerId })}
            >
              <Text style={styles.customerName}>{order.customerName} (View Customer)</Text>
            </TouchableOpacity>

            <Text style={styles.meta}>
              {order.city}, {order.pincode} · {order.paymentMethod} · {order.createdAt}
            </Text>

            <View style={styles.itemBox}>
              {order.items.map((line, i) => (
                <Text key={`${line.productId}_${i}`} numberOfLines={1} style={styles.itemLine}>
                  {line.qty}× {line.name} — ₹{(line.qty * line.unitPriceInr).toLocaleString('en-IN')}
                </Text>
              ))}
            </View>

            {order.status === 'NEW' ? (
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Accept Order"
                    icon="checkmark-outline"
                    onPress={() => updateOrderStatus(order.id, 'ACCEPTED')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Reject"
                    variant="danger"
                    onPress={() => updateOrderStatus(order.id, 'REJECTED')}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Order Details"
                    variant="outline"
                    onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Track Order"
                    variant="gold"
                    onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

/** Screen 10: Order Details Screen */
export const OrderDetailsScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { orders, updateOrderStatus } = usePartnerStore();
  const order = orders.find((o) => o.id === route.params?.orderId) || orders[0];

  const nextActionMap: Record<OrderStatus, { label: string; next: OrderStatus } | null> = {
    NEW: { label: 'Accept Order', next: 'ACCEPTED' },
    ACCEPTED: { label: 'Mark as Packed', next: 'PACKED' },
    PACKED: { label: 'Mark as Shipped', next: 'SHIPPED' },
    SHIPPED: { label: 'Mark Out for Delivery', next: 'OUT_FOR_DELIVERY' },
    OUT_FOR_DELIVERY: { label: 'Confirm Delivered (OTP)', next: 'DELIVERED' },
    DELIVERED: null,
    REJECTED: null,
  };
  const nextStep = nextActionMap[order.status];

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner />

        <View style={styles.heroCard}>
          <Text style={styles.heroOverline}>{order.invoiceNo}</Text>
          <Text style={styles.heroTitle}>{order.id} · {order.status.replace(/_/g, ' ')}</Text>
          <Text style={styles.heroSub}>Delivery OTP: {order.deliveryOtp} · {order.paymentMethod}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer & Shipping</Text>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.meta}>{order.customerPhone}</Text>
          <Text style={styles.meta}>{order.address}, {order.city} - {order.pincode}</Text>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Customer Profile"
                variant="outline"
                onPress={() => navigation.navigate('CustomerDetails', { customerId: order.customerId })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Order Tracking"
                variant="gold"
                onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items & Payout Split</Text>
          {order.items.map((item, idx) => (
            <View key={`${item.productId}_${idx}`} style={styles.rowBetween}>
              <Text numberOfLines={1} style={[styles.itemLine, { flex: 1 }]}>
                {item.qty}× {item.name}
              </Text>
              <Text style={styles.amount}>
                ₹{(item.qty * item.unitPriceInr).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.meta}>Subtotal</Text>
            <Text style={styles.meta}>₹{order.subtotalInr.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.meta}>Platform Commission</Text>
            <Text style={[styles.meta, { color: COLORS.danger }]}>
              -₹{order.platformCommissionInr.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Net Seller Earning</Text>
            <Text style={styles.amount}>₹{order.netEarningInr.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {nextStep ? (
          <PrimaryButton
            title={nextStep.label}
            icon="arrow-forward-circle-outline"
            onPress={() => updateOrderStatus(order.id, nextStep.next)}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 11: Order Tracking Screen */
export const OrderTrackingScreen: React.FC<{ route: any }> = ({ route }) => {
  const { orders, updateOrderStatus } = usePartnerStore();
  const order = orders.find((o) => o.id === route.params?.orderId) || orders[0];

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner />
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Live Delivery Tracking · {order.id}</Text>
          <Text style={styles.meta}>
            Courier: {order.courierName} · AWB: {order.awbCode}
          </Text>
          <Text style={styles.meta}>
            Assigned Rider: {order.riderName} ({order.riderPhone})
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tracking Milestones</Text>
          {order.trackingHistory.map((step, i) => (
            <View key={`${step.status}_${i}`} style={styles.trackRow}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.purplePrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>
                  {step.status.replace(/_/g, ' ')} · {step.location}
                </Text>
                <Text style={styles.meta}>{step.note}</Text>
                <Text style={styles.smallMeta}>{step.timestamp}</Text>
              </View>
            </View>
          ))}
        </View>

        {order.status !== 'DELIVERED' ? (
          <PrimaryButton
            title="Log Next Milestone (Out for Delivery)"
            variant="gold"
            icon="navigate-outline"
            onPress={() =>
              updateOrderStatus(
                order.id,
                order.status === 'OUT_FOR_DELIVERY' ? 'DELIVERED' : 'OUT_FOR_DELIVERY',
                'Milestone updated from Delivery Tracking screen (Demo)'
              )
            }
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 12: Customer Details Screen */
export const CustomerDetailsScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { customers, orders } = usePartnerStore();
  const customer =
    customers.find((c) => c.id === route.params?.customerId) || customers[0];
  const customerOrders = orders.filter((o) => o.customerId === customer.id);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner />
        <View style={styles.heroCard}>
          <Text style={styles.heroOverline}>VERIFIED BUYER PROFILE</Text>
          <Text style={styles.heroTitle}>{customer.name}</Text>
          <Text style={styles.heroSub}>
            {customer.phone} · {customer.city} · Joined {customer.joinedDate}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact & Address</Text>
          <Text style={styles.meta}>Email: {customer.email}</Text>
          <Text style={styles.meta}>Address: {customer.address}</Text>
          <Text style={styles.meta}>Seller Notes: {customer.notes}</Text>
          <View style={styles.twoCol}>
            <View style={styles.statBox}>
              <Text style={styles.smallMeta}>Total Orders</Text>
              <Text style={styles.amount}>{customer.totalOrders}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.smallMeta}>Demo Lifetime Spend</Text>
              <Text style={styles.amount}>₹{customer.totalSpentInr.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <PrimaryButton
            title="Message Customer"
            icon="chatbubble-ellipses-outline"
            onPress={() => navigation.navigate('CustomerChat')}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Order History ({customerOrders.length})</Text>
          {customerOrders.map((ord) => (
            <TouchableOpacity
              key={ord.id}
              style={styles.trackRow}
              onPress={() => navigation.navigate('OrderDetails', { orderId: ord.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>{ord.id} · {ord.status}</Text>
                <Text style={styles.meta}>{ord.createdAt}</Text>
              </View>
              <Text style={styles.amount}>₹{ord.subtotalInr.toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 20: Delivery Management Screen */
export const DeliveryManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { orders, assignDeliveryRider, updateOrderStatus } = usePartnerStore();

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner note="Delivery Management Demo — Assign own riders or Shiprocket/Delhivery AWB labels." />
        {orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.orderId}>{order.id} · {order.city}</Text>
              <Text style={styles.meta}>{order.status.replace(/_/g, ' ')}</Text>
            </View>
            <Text style={styles.meta}>
              Courier: {order.courierName} · AWB: {order.awbCode}
            </Text>
            <Text style={styles.meta}>
              Rider: {order.riderName} ({order.riderPhone}) · OTP: {order.deliveryOtp}
            </Text>
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title="Assign Own Rider"
                  variant="outline"
                  onPress={() => assignDeliveryRider(order.id, 'Bikram Das', 'Sanjit Own Rider')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title="Shiprocket AWB"
                  variant="gold"
                  onPress={() => {
                    assignDeliveryRider(order.id, 'Raju Kalita', 'Shiprocket Express');
                    if (order.status === 'PACKED' || order.status === 'ACCEPTED') {
                      updateOrderStatus(order.id, 'SHIPPED', 'Dispatched via Shiprocket (Demo)');
                    }
                  }}
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
            >
              <Text style={styles.customerName}>Open Live Tracking Timeline →</Text>
            </TouchableOpacity>
          </View>
        ))}
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
    gap: 8,
  },
  filterBtn: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    justifyContent: 'center',
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: COLORS.purplePrimary, borderColor: COLORS.purplePrimary },
  filterText: { fontSize: rs(12), fontWeight: '600', color: COLORS.inkSecondary },
  filterTextActive: { color: COLORS.goldSoft },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  orderId: { fontSize: rs(13), fontWeight: '800', color: COLORS.purplePrimary },
  amount: { fontSize: rs(14), fontWeight: '800', color: COLORS.ink },
  customerName: { fontSize: rs(13), fontWeight: '700', color: COLORS.purpleLight },
  meta: { fontSize: rs(12), color: COLORS.inkSecondary },
  smallMeta: { fontSize: rs(11), color: COLORS.inkMuted },
  itemBox: { backgroundColor: COLORS.purpleSoft, borderRadius: RADIUS.sm, padding: 10, gap: 4 },
  itemLine: { fontSize: rs(12), fontWeight: '600', color: COLORS.ink },
  twoCol: { flexDirection: 'row', gap: 10, marginTop: 4 },
  sectionTitle: { fontSize: rs(15), fontWeight: '800', color: COLORS.ink },
  divider: { height: 1, backgroundColor: COLORS.purpleSoft, marginVertical: 6 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.purpleSoft,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 2,
  },
});
