import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import { usePartnerStore } from '../context/PartnerStoreContext';
import { DemoModeBanner, PrimaryButton } from '../components/DemoBanner';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';
import { PartnerProduct, ProductCategory } from '../types';

/** Screen 5: Seller Dashboard (Home Tab) */
export const SellerDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { shopProfile, products, orders, plans, pendingReviewCount } = usePartnerStore();
  const activePlan = plans.find((p) => p.id === shopProfile.activePlanId) || plans[1];

  const grossSales = orders
    .filter((o) => o.status !== 'REJECTED')
    .reduce((sum, o) => sum + o.subtotalInr, 0);
  const totalCommission = orders
    .filter((o) => o.status !== 'REJECTED')
    .reduce((sum, o) => sum + o.platformCommissionInr, 0);
  const netEarnings = grossSales - totalCommission;
  const newOrderCount = orders.filter((o) => o.status === 'NEW').length;
  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        <DemoModeBanner />

        {/* Royal Purple & Gold Header Banner */}
        <View style={styles.heroCard}>
          <Text style={styles.heroOverline}>SANJIT MUSICAL STORE · PARTNER</Text>
          <Text numberOfLines={1} style={styles.heroTitle}>
            {shopProfile.shopName}
          </Text>
          <Text style={styles.heroMeta}>
            {shopProfile.city}, {shopProfile.state} · {activePlan.name}
          </Text>

          <View style={styles.divider} />

          <View style={styles.heroMetricsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroMetricLabel}>Net Demo Earnings</Text>
              <Text style={styles.heroMetricValue}>
                ₹{netEarnings.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroMetricLabel}>Commission ({activePlan.commissionPercent}%)</Text>
              <Text style={styles.heroGoldValue}>
                ₹{totalCommission.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* 2x2 Responsive KPI Grid */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('OrdersTab')}
          >
            <Text style={styles.kpiLabel}>New Orders</Text>
            <Text style={styles.kpiValue}>{newOrderCount}</Text>
            <Text style={styles.kpiSub}>{orders.length} total orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('ProductsTab')}
          >
            <Text style={styles.kpiLabel}>Products</Text>
            <Text style={styles.kpiValue}>{products.length}</Text>
            <Text style={styles.kpiSub}>/{activePlan.productLimit} plan limit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('InventoryManagement')}
          >
            <Text style={styles.kpiLabel}>Low Stock</Text>
            <Text style={[styles.kpiValue, { color: COLORS.warning }]}>{lowStockCount}</Text>
            <Text style={styles.kpiSub}>Tap to restock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('SalesReports')}
          >
            <Text style={styles.kpiLabel}>Gross Sales</Text>
            <Text style={styles.kpiValue}>₹{grossSales.toLocaleString('en-IN')}</Text>
            <Text style={styles.kpiSub}>View chart report</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Partner Actions</Text>
          <View style={styles.actionGrid}>
            <View style={styles.actionHalf}>
              <PrimaryButton
                title="Add Product"
                icon="add-circle-outline"
                onPress={() => navigation.navigate('AddProduct')}
              />
            </View>
            <View style={styles.actionHalf}>
              <PrimaryButton
                title="Inventory"
                variant="gold"
                icon="cube-outline"
                onPress={() => navigation.navigate('InventoryManagement')}
              />
            </View>
            <View style={styles.actionHalf}>
              <PrimaryButton
                title="Delivery Desk"
                variant="outline"
                icon="bicycle-outline"
                onPress={() => navigation.navigate('DeliveryManagement')}
              />
            </View>
            <View style={styles.actionHalf}>
              <PrimaryButton
                title="Customer Chat"
                variant="outline"
                icon="chatbubbles-outline"
                onPress={() => navigation.navigate('CustomerChat')}
              />
            </View>
          </View>
          <PrimaryButton
            title={
              pendingReviewCount > 0
                ? `Customer Feedback (${pendingReviewCount} awaiting reply)`
                : 'Customer Feedback & Reviews'
            }
            variant="outline"
            icon="star-half-outline"
            onPress={() => navigation.navigate('CustomerFeedback')}
          />
        </View>

        {/* Recent Orders List */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>
          {orders.slice(0, 3).map((ord) => (
            <TouchableOpacity
              key={ord.id}
              style={styles.listRow}
              onPress={() => navigation.navigate('OrderDetails', { orderId: ord.id })}
            >
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.rowTitle}>
                  {ord.id} · {ord.customerName}
                </Text>
                <Text numberOfLines={1} style={styles.rowSub}>
                  {ord.items[0]?.name} · {ord.status.replace(/_/g, ' ')}
                </Text>
              </View>
              <Text style={styles.rowAmount}>₹{ord.subtotalInr.toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/** Screen 6: Add / Edit Product Screen */
export const AddProductScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const { addProduct, updateProduct, products } = usePartnerStore();
  const editId: string | undefined = route?.params?.productId;
  const existing = editId ? products.find((p) => p.id === editId) : undefined;

  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState<ProductCategory>(
    existing?.category || 'Musical Instruments'
  );
  const [subcategory, setSubcategory] = useState(existing?.subcategory || 'Guitar');
  const [priceInr, setPriceInr] = useState(String(existing?.priceInr || 8999));
  const [mrpInr, setMrpInr] = useState(String(existing?.mrpInr || 10999));
  const [stock, setStock] = useState(String(existing?.stock || 10));
  const [threshold, setThreshold] = useState(String(existing?.lowStockThreshold || 3));
  const [description, setDescription] = useState(
    existing?.description || 'Stage-tested professional quality with seller warranty.'
  );

  const categories: ProductCategory[] = [
    'Musical Instruments',
    'Electronic Equipment',
    'Dance Dresses',
    'Dance Accessories',
  ];

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Title', 'Please enter a product name.');
      return;
    }
    const price = Math.max(99, Number(priceInr) || 999);
    const mrp = Math.max(price, Number(mrpInr) || price);
    const qty = Math.max(0, Number(stock) || 0);
    const low = Math.max(1, Number(threshold) || 3);

    if (existing) {
      updateProduct(existing.id, {
        name: name.trim(),
        category,
        subcategory: subcategory.trim() || category,
        priceInr: price,
        mrpInr: mrp,
        stock: qty,
        lowStockThreshold: low,
        description: description.trim(),
      });
    } else {
      addProduct({
        name: name.trim(),
        category,
        subcategory: subcategory.trim() || category,
        priceInr: price,
        mrpInr: mrp,
        stock: qty,
        lowStockThreshold: low,
        warrantyMonths: 12,
        description: description.trim(),
      });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          <DemoModeBanner />
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {existing ? 'Edit Store Product' : 'Add New Store Product'}
            </Text>

            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Yamaha Acoustic Guitar / Muga Bihu Dress"
              placeholderTextColor={COLORS.inkMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipWrap}>
              {categories.map((cat) => {
                const active = cat === category;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.catBtn, active && styles.catBtnActive]}
                  >
                    <Text style={[styles.catBtnText, active && styles.catBtnTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Subcategory</Text>
            <TextInput
              value={subcategory}
              onChangeText={setSubcategory}
              placeholder="Guitar, Tabla, DJ Mixer, Bharatanatyam, Ghungroo..."
              placeholderTextColor={COLORS.inkMuted}
              style={styles.input}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  value={priceInr}
                  onChangeText={setPriceInr}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>MRP (₹)</Text>
                <TextInput
                  value={mrpInr}
                  onChangeText={setMrpInr}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Stock Qty</Text>
                <TextInput
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Low Stock Alert</Text>
                <TextInput
                  value={threshold}
                  onChangeText={setThreshold}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            />

            <PrimaryButton
              title={existing ? 'Save Product Changes' : 'Publish Product (Demo)'}
              icon="checkmark-circle-outline"
              onPress={handleSave}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/** Screen 7: Product Management Screen (Products Tab) */
export const ProductManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, deleteProduct } = usePartnerStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'ALL' | ProductCategory>('ALL');

  const filtered = products.filter((p) => {
    const matchCat = catFilter === 'ALL' || p.category === catFilter;
    const q = search.trim().toLowerCase();
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const renderItem = ({ item }: { item: PartnerProduct }) => (
    <View style={styles.productCard}>
      <View style={styles.productTopRow}>
        <Image source={item.image} style={styles.productImage} resizeMode="cover" />
        <View style={{ flex: 1, gap: 3 }}>
          <Text numberOfLines={1} style={styles.productSubcat}>
            {item.subcategory} · {item.sku}
          </Text>
          <Text numberOfLines={2} style={styles.productName}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>
            ₹{item.priceInr.toLocaleString('en-IN')}{' '}
            <Text style={styles.productMrp}>₹{item.mrpInr.toLocaleString('en-IN')}</Text>
          </Text>
          <Text
            style={[
              styles.stockText,
              item.stock <= item.lowStockThreshold && { color: COLORS.warning },
            ]}
          >
            Stock: {item.stock} units
          </Text>
        </View>
      </View>

      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title="Edit"
            variant="outline"
            icon="create-outline"
            onPress={() => navigation.navigate('AddProduct', { productId: item.id })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title="Delete"
            variant="danger"
            icon="trash-outline"
            onPress={() => deleteProduct(item.id)}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollBody}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 12 }}>
            <DemoModeBanner />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search guitar, tabla, mixer, dress, ghungroo..."
              placeholderTextColor={COLORS.inkMuted}
              style={styles.input}
            />
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title="Add Product"
                  icon="add-circle-outline"
                  onPress={() => navigation.navigate('AddProduct')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title="Stock Manager"
                  variant="gold"
                  icon="layers-outline"
                  onPress={() => navigation.navigate('InventoryManagement')}
                />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(
                [
                  'ALL',
                  'Musical Instruments',
                  'Electronic Equipment',
                  'Dance Dresses',
                  'Dance Accessories',
                ] as const
              ).map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCatFilter(c)}
                  style={[styles.catBtn, { marginRight: 8 }, catFilter === c && styles.catBtnActive]}
                >
                  <Text style={[styles.catBtnText, catFilter === c && styles.catBtnTextActive]}>
                    {c === 'ALL' ? `All (${products.length})` : c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
      />
    </SafeAreaView>
  );
};

/** Screen 8: Inventory Management Screen */
export const InventoryManagementScreen: React.FC = () => {
  const { products, updateStock } = usePartnerStore();

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollBody}
        ListHeaderComponent={<DemoModeBanner note="Inventory Demo — Tap -1 or +5 to test real-time stock alerts." />}
        renderItem={({ item }) => {
          const isLow = item.stock <= item.lowStockThreshold;
          return (
            <View style={styles.productCard}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowSub}>
                    SKU: {item.sku} · Alert ≤ {item.lowStockThreshold}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.kpiValue,
                    { fontSize: rs(18), color: isLow ? COLORS.warning : COLORS.success },
                  ]}
                >
                  {item.stock}
                </Text>
              </View>

              <View style={styles.twoCol}>
                <TouchableOpacity
                  style={[styles.stockBtn, { backgroundColor: COLORS.purpleSoft }]}
                  onPress={() => updateStock(item.id, item.stock - 1)}
                >
                  <Ionicons name="remove" size={18} color={COLORS.purplePrimary} />
                  <Text style={styles.stockBtnText}>-1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stockBtn, { backgroundColor: COLORS.purplePrimary }]}
                  onPress={() => updateStock(item.id, item.stock + 5)}
                >
                  <Ionicons name="add" size={18} color={COLORS.goldPrimary} />
                  <Text style={[styles.stockBtnText, { color: COLORS.goldSoft }]}>+5 Restock</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
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
  heroOverline: { color: COLORS.goldPrimary, fontSize: rs(10), fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: COLORS.white, fontSize: rs(18), fontWeight: '800', marginTop: 4 },
  heroMeta: { color: '#E9D5FF', fontSize: rs(12), marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 12 },
  heroMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroMetricLabel: { color: '#DDD6FE', fontSize: rs(11) },
  heroMetricValue: { color: COLORS.white, fontSize: rs(22), fontWeight: '800', marginTop: 2 },
  heroGoldValue: { color: COLORS.goldPrimary, fontSize: rs(15), fontWeight: '800', marginTop: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
  },
  kpiLabel: { fontSize: rs(12), color: COLORS.inkSecondary, fontWeight: '600' },
  kpiValue: { fontSize: rs(20), fontWeight: '800', color: COLORS.ink, marginTop: 4 },
  kpiSub: { fontSize: rs(11), color: COLORS.purplePrimary, marginTop: 2 },
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
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionHalf: { width: '48%', flexGrow: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: COLORS.purplePrimary, fontSize: rs(12), fontWeight: '700' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.purpleSoft,
    gap: 8,
  },
  rowTitle: { fontSize: rs(13), fontWeight: '700', color: COLORS.ink },
  rowSub: { fontSize: rs(11), color: COLORS.inkSecondary, marginTop: 2 },
  rowAmount: { fontSize: rs(13), fontWeight: '800', color: COLORS.purplePrimary },
  label: { fontSize: rs(12), fontWeight: '700', color: COLORS.ink },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: rs(13),
    color: COLORS.ink,
    backgroundColor: COLORS.white,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    justifyContent: 'center',
  },
  catBtnActive: { backgroundColor: COLORS.purplePrimary, borderColor: COLORS.purplePrimary },
  catBtnText: { fontSize: rs(12), fontWeight: '600', color: COLORS.inkSecondary },
  catBtnTextActive: { color: COLORS.goldSoft },
  twoCol: { flexDirection: 'row', gap: 10 },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    marginBottom: 10,
    gap: 12,
  },
  productTopRow: { flexDirection: 'row', gap: 12 },
  productImage: { width: 78, height: 78, borderRadius: RADIUS.sm, backgroundColor: COLORS.purpleSoft },
  productSubcat: { fontSize: rs(11), fontWeight: '700', color: COLORS.purplePrimary },
  productName: { fontSize: rs(14), fontWeight: '700', color: COLORS.ink },
  productPrice: { fontSize: rs(14), fontWeight: '800', color: COLORS.purpleDark },
  productMrp: { fontSize: rs(11), color: COLORS.inkMuted, textDecorationLine: 'line-through' },
  stockText: { fontSize: rs(12), fontWeight: '700', color: COLORS.success },
  stockBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stockBtnText: { fontSize: rs(13), fontWeight: '700', color: COLORS.purplePrimary },
});
