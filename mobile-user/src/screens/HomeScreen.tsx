import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useCustomer } from '../context/CustomerContext';
import { STORE_CATEGORIES } from '../data/storeData';
import { COLORS, RADIUS, formatInr, rs } from '../theme/theme';
import { MainTabParamList, RootStackParamList, StoreProduct } from '../types';

export const HomeScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {
    shops,
    selectedShop,
    selectShop,
    products,
    cartCount,
    cartShop,
    wishlistIds,
    toggleWishlist,
    addToCart,
    profile,
  } = useCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBySelectedShop, setFilterBySelectedShop] = useState(false);

  const cardWidth = Math.max(144, Math.floor((width - 44) / 2));

  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (filterBySelectedShop && p.tenantId !== selectedShop.tenantId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        p.shopName.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, filterBySelectedShop, selectedShop.tenantId]);

  const featuredProducts = useMemo(() => {
    if (searchQuery.trim() || filterBySelectedShop) return visibleProducts;
    return visibleProducts.filter((p) => p.isFeatured);
  }, [visibleProducts, searchQuery, filterBySelectedShop]);

  const handleQuickAdd = (product: StoreProduct) => {
    const res = addToCart(product);
    if (res === 'DIFFERENT_SHOP') {
      Alert.alert(
        'Switch Shop Cart?',
        `Your cart currently has items from ${cartShop?.storeName || 'another shop'}. Replace cart with this item from ${product.shopName} so your order routes directly to ${product.shopName}?`,
        [
          { text: 'Keep Current Cart', style: 'cancel' },
          {
            text: `Shop ${product.shopName}`,
            onPress: () => addToCart(product, undefined, true),
          },
        ]
      );
    }
  };

  const renderProductCard = (product: StoreProduct) => {
    const isSaved = wishlistIds.includes(product.id);
    const discountPct = Math.round(((product.mrpInr - product.priceInr) / product.mrpInr) * 100);

    return (
      <TouchableOpacity
        key={product.id}
        style={[styles.productCard, { width: cardWidth }]}
        activeOpacity={0.9}
        onPress={() => rootNav.navigate('ProductDetail', { productId: product.id })}
      >
        <View style={styles.imageWrap}>
          <Image source={product.image} style={styles.productImage} resizeMode="cover" />
          <View style={styles.discountTag}>
            <Text style={styles.discountTagText}>{discountPct}% OFF</Text>
          </View>
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => toggleWishlist(product.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={18}
              color={isSaved ? COLORS.danger : COLORS.inkSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.shopTagRow}>
            <Ionicons name="storefront-outline" size={11} color={COLORS.purplePrimary} />
            <Text style={styles.shopTagText} numberOfLines={1}>
              {product.shopName}
            </Text>
          </View>

          <Text style={styles.productTitle} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={COLORS.goldPrimary} />
            <Text style={styles.ratingText}>
              {product.rating.toFixed(1)} ({product.reviewCount})
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formatInr(product.priceInr)}</Text>
            <Text style={styles.mrpText}>{formatInr(product.mrpInr)}</Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleQuickAdd(product)}
            activeOpacity={0.85}
          >
            <Ionicons name="bag-add-outline" size={15} color={COLORS.white} />
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Brand Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="musical-notes" size={19} color={COLORS.purpleDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName} numberOfLines={1}>
              SANJIT MUSICAL STORE
            </Text>
            <Text style={styles.brandSub} numberOfLines={1}>
              Hi {profile.name.split(' ')[0]} • Deliver to {profile.city} {profile.pincode}
            </Text>
          </View>
          <TouchableOpacity style={styles.cartIconBtn} onPress={() => tabNav.navigate('Cart')}>
            <Ionicons name="cart-outline" size={22} color={COLORS.white} />
            {cartCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops, guitars, tabla, DJ mixer, costumes..."
            placeholderTextColor={COLORS.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.inkMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Promo Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>FESTIVAL OFFER • CODE: SANJIT10</Text>
          </View>
          <Text style={styles.heroTitle}>Multi-Shop Musical & Dance Marketplace</Text>
          <Text style={styles.heroDesc}>
            Shop directly from verified music & dance houses. Instant UPI QR, Cards, COD & live
            partner fulfillment.
          </Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => tabNav.navigate('Shop', { initialCategory: 'ALL' })}
          >
            <Text style={styles.heroBtnText}>Explore Full Catalog</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.purpleDeep} />
          </TouchableOpacity>
        </View>

        {/* Browse Verified Partner Shops */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Partner Shops ({shops.length})</Text>
          <TouchableOpacity
            onPress={() => setFilterBySelectedShop((v) => !v)}
          >
            <Text style={styles.seeAllText}>
              {filterBySelectedShop ? 'Show All Shops' : 'Filter Active'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shopsRow}
        >
          {shops.map((shop) => {
            const isActive = shop.tenantId === selectedShop.tenantId;
            return (
              <TouchableOpacity
                key={shop.tenantId}
                style={[styles.shopCard, isActive && styles.shopCardActive]}
                activeOpacity={0.88}
                onPress={() => {
                  selectShop(shop.tenantId);
                  tabNav.navigate('Shop', {
                    initialCategory: 'ALL',
                    initialTenantId: shop.tenantId,
                  });
                }}
              >
                <View style={styles.shopCardTop}>
                  <View style={[styles.shopAvatar, { backgroundColor: shop.primaryColor }]}>
                    <Ionicons name="storefront" size={16} color={COLORS.white} />
                  </View>
                  <View style={styles.shopRatingPill}>
                    <Ionicons name="star" size={11} color={COLORS.goldPrimary} />
                    <Text style={styles.shopRatingText}>{shop.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.shopNameText} numberOfLines={1}>
                  {shop.storeName}
                </Text>
                <Text style={styles.shopMetaText} numberOfLines={1}>
                  {shop.city}, {shop.state} • {shop.codEnabled ? 'UPI & COD' : 'UPI / Card'}
                </Text>
                <Text style={styles.shopTagline} numberOfLines={2}>
                  {shop.tagline}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <TouchableOpacity onPress={() => tabNav.navigate('Shop', { initialCategory: 'ALL' })}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {STORE_CATEGORIES.filter((c) => c.key !== 'ALL').map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryCard}
              onPress={() => tabNav.navigate('Shop', { initialCategory: cat.key })}
            >
              <View style={styles.categoryIconCircle}>
                <Ionicons
                  name={cat.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={COLORS.purplePrimary}
                />
              </View>
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {cat.shortLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Products Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim()
              ? `Search Results (${featuredProducts.length})`
              : filterBySelectedShop
              ? `${selectedShop.storeName} Picks`
              : 'Featured Across All Shops'}
          </Text>
          <TouchableOpacity onPress={() => tabNav.navigate('Shop', { initialCategory: 'ALL' })}>
            <Text style={styles.seeAllText}>Browse All</Text>
          </TouchableOpacity>
        </View>

        {featuredProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={32} color={COLORS.inkMuted} />
            <Text style={styles.emptyTitle}>No matching items found</Text>
            <Text style={styles.emptySub}>Try searching for Guitar, Tabla, Mixer, or Ghungroo.</Text>
          </View>
        ) : (
          <View style={styles.grid}>{featuredProducts.map(renderProductCard)}</View>
        )}

        {/* Trust Strip */}
        <View style={styles.trustCard}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.purplePrimary} />
            <Text style={styles.trustText}>Genuine Brands</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="qr-code-outline" size={18} color={COLORS.purplePrimary} />
            <Text style={styles.trustText}>UPI & COD</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="notifications-outline" size={18} color={COLORS.purplePrimary} />
            <Text style={styles.trustText}>Live Alerts</Text>
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
    paddingTop: 8,
    paddingBottom: 14,
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.goldPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: COLORS.white,
    fontSize: rs(15),
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  brandSub: {
    color: '#DDD6FE',
    fontSize: rs(11),
    marginTop: 1,
  },
  cartIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.goldPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: COLORS.purpleDeep,
    fontSize: 10,
    fontWeight: '900',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.ink,
    fontSize: rs(13),
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.goldPrimary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: COLORS.goldPrimary,
    fontSize: rs(10),
    fontWeight: '800',
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: rs(18),
    fontWeight: '900',
    lineHeight: rs(24),
  },
  heroDesc: {
    color: '#EDE9FE',
    fontSize: rs(12),
    marginTop: 6,
    lineHeight: 18,
  },
  heroBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.goldPrimary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBtnText: {
    color: COLORS.purpleDeep,
    fontWeight: '800',
    fontSize: rs(12.5),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: rs(15),
    fontWeight: '800',
  },
  seeAllText: {
    color: COLORS.purplePrimary,
    fontSize: rs(12),
    fontWeight: '700',
  },
  shopsRow: {
    gap: 10,
    paddingBottom: 18,
  },
  shopCard: {
    width: 204,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  shopCardActive: {
    borderColor: COLORS.purplePrimary,
    backgroundColor: '#FAF8FF',
  },
  shopCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.goldSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  shopRatingText: {
    color: COLORS.goldDark,
    fontSize: rs(11),
    fontWeight: '800',
  },
  shopNameText: {
    color: COLORS.ink,
    fontSize: rs(13),
    fontWeight: '800',
  },
  shopMetaText: {
    color: COLORS.purplePrimary,
    fontSize: rs(10.5),
    fontWeight: '700',
    marginTop: 2,
  },
  shopTagline: {
    color: COLORS.inkSecondary,
    fontSize: rs(11),
    marginTop: 4,
    lineHeight: 15,
  },
  categoryRow: {
    gap: 10,
    paddingBottom: 18,
  },
  categoryCard: {
    width: 96,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    color: COLORS.ink,
    fontSize: rs(11.5),
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 126,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.purpleDeep,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountTagText: {
    color: COLORS.goldPrimary,
    fontSize: 9.5,
    fontWeight: '900',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 10,
  },
  shopTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  shopTagText: {
    color: COLORS.purplePrimary,
    fontSize: rs(10),
    fontWeight: '700',
    flex: 1,
  },
  productTitle: {
    color: COLORS.ink,
    fontSize: rs(12.5),
    fontWeight: '700',
    lineHeight: 17,
    minHeight: 34,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    color: COLORS.inkSecondary,
    fontSize: rs(10.5),
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  priceText: {
    color: COLORS.purplePrimary,
    fontSize: rs(14),
    fontWeight: '900',
  },
  mrpText: {
    color: COLORS.inkMuted,
    fontSize: rs(10.5),
    textDecorationLine: 'line-through',
  },
  addBtn: {
    marginTop: 8,
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: rs(11.5),
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontSize: rs(14),
    fontWeight: '800',
    marginTop: 8,
  },
  emptySub: {
    color: COLORS.inkMuted,
    fontSize: rs(12),
    textAlign: 'center',
    marginTop: 4,
  },
  trustCard: {
    marginTop: 18,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustItem: {
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    color: COLORS.inkSecondary,
    fontSize: rs(10.5),
    fontWeight: '700',
  },
});
