import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCustomer } from '../context/CustomerContext';
import { STORE_CATEGORIES } from '../data/storeData';
import { COLORS, RADIUS, formatInr, rs } from '../theme/theme';
import { CategoryName, MainTabParamList, RootStackParamList, StoreProduct } from '../types';

type SortOption = 'POPULAR' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING';

export const CatalogScreen: React.FC = () => {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Shop'>>();
  const { shops, products, cartShop, wishlistIds, toggleWishlist, addToCart } = useCustomer();

  const [selectedCategory, setSelectedCategory] = useState<CategoryName | 'ALL'>(
    route.params?.initialCategory || 'ALL'
  );
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    route.params?.initialTenantId || 'ALL'
  );
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('POPULAR');

  useEffect(() => {
    if (route.params?.initialCategory) {
      setSelectedCategory(route.params.initialCategory);
    }
    if (route.params?.initialTenantId) {
      setSelectedTenantId(route.params.initialTenantId);
    }
  }, [route.params?.initialCategory, route.params?.initialTenantId]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedTenantId !== 'ALL' && p.tenantId !== selectedTenantId) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        p.shopName.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'PRICE_LOW') return [...list].sort((a, b) => a.priceInr - b.priceInr);
    if (sortBy === 'PRICE_HIGH') return [...list].sort((a, b) => b.priceInr - a.priceInr);
    if (sortBy === 'RATING') return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, selectedTenantId, selectedCategory, search, sortBy]);

  const handleAdd = (product: StoreProduct) => {
    const res = addToCart(product);
    if (res === 'DIFFERENT_SHOP') {
      Alert.alert(
        'Switch Shop Cart?',
        `Your cart currently contains items from ${cartShop?.storeName || 'another shop'}. Replace cart to order from ${product.shopName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Switch to ${product.shopName}`,
            onPress: () => addToCart(product, undefined, true),
          },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: StoreProduct }) => {
    const isSaved = wishlistIds.includes(item.id);
    const discountPct = Math.round(((item.mrpInr - item.priceInr) / item.mrpInr) * 100);

    return (
      <TouchableOpacity
        style={styles.rowCard}
        activeOpacity={0.9}
        onPress={() => rootNav.navigate('ProductDetail', { productId: item.id })}
      >
        <Image source={item.image} style={styles.thumb} resizeMode="cover" />
        <View style={styles.rowInfo}>
          <View style={styles.rowTopMeta}>
            <View style={styles.shopBadge}>
              <Ionicons name="storefront-outline" size={11} color={COLORS.purplePrimary} />
              <Text style={styles.shopBadgeText} numberOfLines={1}>
                {item.shopName}
              </Text>
            </View>
            <TouchableOpacity onPress={() => toggleWishlist(item.id)}>
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={19}
                color={isSaved ? COLORS.danger : COLORS.inkMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.metaLine}>
            <Ionicons name="star" size={12} color={COLORS.goldPrimary} />
            <Text style={styles.metaText}>
              {item.rating.toFixed(1)} • {item.subcategory} • {discountPct}% OFF
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.price}>{formatInr(item.priceInr)}</Text>
              <Text style={styles.mrp}>{formatInr(item.mrpInr)}</Text>
            </View>
            <TouchableOpacity style={styles.cartBtn} onPress={() => handleAdd(item)}>
              <Ionicons name="cart-outline" size={15} color={COLORS.white} />
              <Text style={styles.cartBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Shops & Catalog</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search instruments, costumes, shop name..."
            placeholderTextColor={COLORS.inkMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.inkMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Shop Filter Strip */}
      <View style={styles.filterBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity
            style={[styles.shopChip, selectedTenantId === 'ALL' && styles.shopChipActive]}
            onPress={() => setSelectedTenantId('ALL')}
          >
            <Text
              style={[
                styles.shopChipText,
                selectedTenantId === 'ALL' && styles.shopChipTextActive,
              ]}
            >
              All Shops ({shops.length})
            </Text>
          </TouchableOpacity>
          {shops.map((shop) => {
            const active = selectedTenantId === shop.tenantId;
            return (
              <TouchableOpacity
                key={shop.tenantId}
                style={[styles.shopChip, active && styles.shopChipActive]}
                onPress={() => setSelectedTenantId(shop.tenantId)}
              >
                <Text style={[styles.shopChipText, active && styles.shopChipTextActive]}>
                  {shop.storeName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Filter Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {STORE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                  {cat.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort Strip */}
        <View style={styles.sortRow}>
          <Text style={styles.countText}>{filteredProducts.length} items</Text>
          <View style={styles.sortChips}>
            {(
              [
                { k: 'POPULAR', label: 'Popular' },
                { k: 'PRICE_LOW', label: 'Low ₹' },
                { k: 'PRICE_HIGH', label: 'High ₹' },
                { k: 'RATING', label: 'Top Rated' },
              ] as { k: SortOption; label: string }[]
            ).map((opt) => (
              <TouchableOpacity
                key={opt.k}
                style={[styles.sortPill, sortBy === opt.k && styles.sortPillActive]}
                onPress={() => setSortBy(opt.k)}
              >
                <Text
                  style={[styles.sortPillText, sortBy === opt.k && styles.sortPillTextActive]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="musical-notes-outline" size={34} color={COLORS.inkMuted} />
            <Text style={styles.emptyTitle}>No products match these filters</Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSelectedCategory('ALL');
                setSelectedTenantId('ALL');
                setSearch('');
              }}
            >
              <Text style={styles.resetBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: rs(16.5),
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.ink,
    fontSize: rs(13),
  },
  filterBlock: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    gap: 8,
  },
  chipsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  shopChip: {
    backgroundColor: COLORS.purpleSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
  },
  shopChipActive: {
    backgroundColor: COLORS.purplePrimary,
    borderColor: COLORS.purplePrimary,
  },
  shopChipText: {
    color: COLORS.purplePrimary,
    fontSize: rs(11.5),
    fontWeight: '700',
  },
  shopChipTextActive: {
    color: COLORS.white,
  },
  catChip: {
    backgroundColor: COLORS.canvas,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: COLORS.goldSoft,
    borderColor: COLORS.goldPrimary,
  },
  catChipText: {
    color: COLORS.inkSecondary,
    fontSize: rs(11.5),
    fontWeight: '700',
  },
  catChipTextActive: {
    color: COLORS.goldDark,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 2,
  },
  countText: {
    color: COLORS.inkMuted,
    fontSize: rs(11.5),
    fontWeight: '700',
  },
  sortChips: {
    flexDirection: 'row',
    gap: 6,
  },
  sortPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.canvas,
  },
  sortPillActive: {
    backgroundColor: COLORS.purpleDeep,
  },
  sortPillText: {
    color: COLORS.inkSecondary,
    fontSize: rs(10.5),
    fontWeight: '700',
  },
  sortPillTextActive: {
    color: COLORS.goldPrimary,
  },
  listContent: {
    padding: 14,
    gap: 12,
    backgroundColor: COLORS.canvas,
    flexGrow: 1,
  },
  rowCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    flexDirection: 'row',
    gap: 12,
  },
  thumb: {
    width: 102,
    height: 112,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
  },
  rowInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rowTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  shopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.purpleSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 1,
  },
  shopBadgeText: {
    color: COLORS.purplePrimary,
    fontSize: rs(10),
    fontWeight: '800',
  },
  itemName: {
    color: COLORS.ink,
    fontSize: rs(13),
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 4,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    color: COLORS.inkSecondary,
    fontSize: rs(11),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  price: {
    color: COLORS.purplePrimary,
    fontSize: rs(15),
    fontWeight: '900',
  },
  mrp: {
    color: COLORS.inkMuted,
    fontSize: rs(11),
    textDecorationLine: 'line-through',
  },
  cartBtn: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cartBtnText: {
    color: COLORS.white,
    fontSize: rs(12),
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: rs(14),
    fontWeight: '800',
    marginTop: 8,
  },
  resetBtn: {
    marginTop: 12,
    backgroundColor: COLORS.purplePrimary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  resetBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: rs(12),
  },
});
