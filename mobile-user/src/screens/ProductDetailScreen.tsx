import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCustomer } from '../context/CustomerContext';
import { COLORS, RADIUS, formatInr, rs } from '../theme/theme';
import { RootStackParamList } from '../types';

export const ProductDetailScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>();
  const {
    products,
    shops,
    cartShop,
    reviews,
    wishlistIds,
    toggleWishlist,
    addToCart,
    selectShop,
  } = useCustomer();

  const product = useMemo(
    () => products.find((p) => p.id === route.params.productId) || products[0],
    [products, route.params.productId]
  );

  const sellerShop = useMemo(
    () => shops.find((s) => s.tenantId === product.tenantId) || shops[0],
    [shops, product.tenantId]
  );

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] || 'Standard Edition'
  );

  const productReviews = useMemo(
    () => reviews.filter((r) => r.productId === product.id),
    [reviews, product.id]
  );

  const isSaved = wishlistIds.includes(product.id);
  const discountPct = Math.round(((product.mrpInr - product.priceInr) / product.mrpInr) * 100);

  const handleAddAction = (goToCart: boolean) => {
    const res = addToCart(product, selectedVariant);
    if (res === 'DIFFERENT_SHOP') {
      Alert.alert(
        'Switch Shop Cart?',
        `Your cart currently holds items from ${cartShop?.storeName || 'another shop'}. Replace cart with ${product.shopName} so this order routes directly to ${product.shopName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Order from ${product.shopName}`,
            onPress: () => {
              addToCart(product, selectedVariant, true);
              if (goToCart) {
                nav.navigate('MainTabs');
              }
            },
          },
        ]
      );
      return;
    }

    if (goToCart) {
      nav.navigate('MainTabs');
      Alert.alert('Added to Cart', `${product.name} is ready in your Cart tab for checkout.`);
    } else {
      Alert.alert('Added to Cart', `${product.name} (${selectedVariant}) added to your cart.`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          Product Details
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => toggleWishlist(product.id)}>
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={20}
            color={isSaved ? COLORS.goldPrimary : COLORS.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageBanner}>
          <Image source={product.image} style={styles.image} resizeMode="cover" />
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>SAVE {discountPct}%</Text>
          </View>
        </View>

        {/* Seller Shop Card */}
        <View style={styles.sellerStrip}>
          <View style={[styles.sellerIcon, { backgroundColor: sellerShop.primaryColor }]}>
            <Ionicons name="storefront" size={16} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellerLabel}>SOLD & FULFILLED BY</Text>
            <Text style={styles.sellerName}>{sellerShop.storeName}</Text>
            <Text style={styles.sellerMeta}>
              {sellerShop.city}, {sellerShop.state} •{' '}
              {sellerShop.codEnabled ? 'UPI, Cards & COD Available' : 'Prepaid UPI & Cards'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.verifiedPill}
            onPress={() => selectShop(sellerShop.tenantId)}
          >
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.verifiedText}>Verified</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.categoryTag}>
            {product.category} • {product.subcategory}
          </Text>
          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color={COLORS.white} />
              <Text style={styles.ratingPillText}>{product.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.reviewCountText}>{product.reviewCount} verified ratings</Text>
            <Text style={styles.stockText}>• {product.stock} in stock</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formatInr(product.priceInr)}</Text>
            <Text style={styles.mrpText}>{formatInr(product.mrpInr)}</Text>
            <Text style={styles.taxNote}>Incl. all taxes</Text>
          </View>

          {/* Variants */}
          <Text style={styles.blockTitle}>Select Variant / Size</Text>
          <View style={styles.variantsWrap}>
            {product.variants.map((variant) => {
              const active = selectedVariant === variant;
              return (
                <TouchableOpacity
                  key={variant}
                  style={[styles.variantChip, active && styles.variantChipActive]}
                  onPress={() => setSelectedVariant(variant)}
                >
                  <Text style={[styles.variantText, active && styles.variantTextActive]}>
                    {variant}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Delivery & Warranty */}
          <View style={styles.perksBox}>
            <View style={styles.perkRow}>
              <Ionicons name="cube-outline" size={16} color={COLORS.purplePrimary} />
              <Text style={styles.perkText}>{product.deliveryEstimate}</Text>
            </View>
            <View style={styles.perkRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.purplePrimary} />
              <Text style={styles.perkText}>
                {product.warrantyMonths} Months Official Partner Warranty
              </Text>
            </View>
            <View style={styles.perkRow}>
              <Ionicons name="card-outline" size={16} color={COLORS.purplePrimary} />
              <Text style={styles.perkText}>
                Free delivery above {formatInr(sellerShop.freeDeliveryThresholdInr)} (Otherwise{' '}
                {formatInr(sellerShop.baseDeliveryFeeInr)})
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.blockTitle}>Description</Text>
          <Text style={styles.descText}>{product.description}</Text>

          {/* Specs */}
          <Text style={styles.blockTitle}>Key Specifications</Text>
          <View style={styles.specBox}>
            {Object.entries(product.specifications).map(([k, v]) => (
              <View key={k} style={styles.specRow}>
                <Text style={styles.specKey}>{k}</Text>
                <Text style={styles.specVal}>{v}</Text>
              </View>
            ))}
          </View>

          {/* Reviews */}
          <Text style={styles.blockTitle}>Customer Reviews ({productReviews.length})</Text>
          {productReviews.length === 0 ? (
            <Text style={styles.noReviewText}>
              Be the first to review this item after purchasing from {sellerShop.storeName}.
            </Text>
          ) : (
            productReviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewAuthor}>{rev.customerName}</Text>
                  <Text style={styles.reviewStars}>{'★'.repeat(rev.rating)}</Text>
                </View>
                <Text style={styles.reviewBody}>{rev.comment}</Text>
                {rev.sellerReply ? (
                  <View style={styles.sellerReplyBox}>
                    <Text style={styles.sellerReplyTitle}>Reply from {sellerShop.storeName}:</Text>
                    <Text style={styles.sellerReplyBody}>{rev.sellerReply}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryCta}
          onPress={() => handleAddAction(false)}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={18} color={COLORS.purplePrimary} />
          <Text style={styles.secondaryCtaText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => handleAddAction(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryCtaText}>Buy Now • {formatInr(product.priceInr)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purpleDeep,
  },
  topBar: {
    backgroundColor: COLORS.purpleDeep,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: COLORS.white,
    fontSize: rs(15),
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageBanner: {
    height: 250,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: COLORS.purpleDeep,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountText: {
    color: COLORS.goldPrimary,
    fontSize: rs(11),
    fontWeight: '900',
  },
  sellerStrip: {
    margin: 14,
    marginBottom: 0,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sellerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerLabel: {
    color: COLORS.inkMuted,
    fontSize: rs(9.5),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sellerName: {
    color: COLORS.ink,
    fontSize: rs(13.5),
    fontWeight: '800',
  },
  sellerMeta: {
    color: COLORS.inkSecondary,
    fontSize: rs(11),
    marginTop: 1,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    color: COLORS.success,
    fontSize: rs(10.5),
    fontWeight: '800',
  },
  mainCard: {
    margin: 14,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  categoryTag: {
    color: COLORS.purplePrimary,
    fontSize: rs(11),
    fontWeight: '800',
  },
  productTitle: {
    color: COLORS.ink,
    fontSize: rs(17),
    fontWeight: '900',
    marginTop: 4,
    lineHeight: rs(23),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.success,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingPillText: {
    color: COLORS.white,
    fontSize: rs(11),
    fontWeight: '800',
  },
  reviewCountText: {
    color: COLORS.inkSecondary,
    fontSize: rs(12),
  },
  stockText: {
    color: COLORS.success,
    fontSize: rs(11.5),
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 12,
  },
  priceText: {
    color: COLORS.purplePrimary,
    fontSize: rs(22),
    fontWeight: '900',
  },
  mrpText: {
    color: COLORS.inkMuted,
    fontSize: rs(13),
    textDecorationLine: 'line-through',
  },
  taxNote: {
    color: COLORS.inkMuted,
    fontSize: rs(11),
  },
  blockTitle: {
    color: COLORS.ink,
    fontSize: rs(14),
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  variantsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  variantChipActive: {
    borderColor: COLORS.purplePrimary,
    backgroundColor: COLORS.purpleSoft,
  },
  variantText: {
    color: COLORS.inkSecondary,
    fontSize: rs(11.5),
    fontWeight: '700',
  },
  variantTextActive: {
    color: COLORS.purplePrimary,
  },
  perksBox: {
    marginTop: 14,
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 8,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    color: COLORS.ink,
    fontSize: rs(12),
    fontWeight: '600',
    flex: 1,
  },
  descText: {
    color: COLORS.inkSecondary,
    fontSize: rs(12.5),
    lineHeight: 19,
  },
  specBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  specKey: {
    color: COLORS.inkMuted,
    fontSize: rs(11.5),
    fontWeight: '700',
    flex: 1,
  },
  specVal: {
    color: COLORS.ink,
    fontSize: rs(11.5),
    fontWeight: '700',
    flex: 1.4,
    textAlign: 'right',
  },
  noReviewText: {
    color: COLORS.inkMuted,
    fontSize: rs(12),
  },
  reviewCard: {
    backgroundColor: COLORS.canvas,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    color: COLORS.ink,
    fontSize: rs(12.5),
    fontWeight: '800',
  },
  reviewStars: {
    color: COLORS.goldPrimary,
    fontSize: rs(12),
  },
  reviewBody: {
    color: COLORS.inkSecondary,
    fontSize: rs(12),
    marginTop: 4,
    lineHeight: 17,
  },
  sellerReplyBox: {
    marginTop: 8,
    backgroundColor: COLORS.purpleSoft,
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.purplePrimary,
  },
  sellerReplyTitle: {
    color: COLORS.purplePrimary,
    fontSize: rs(10.5),
    fontWeight: '800',
  },
  sellerReplyBody: {
    color: COLORS.ink,
    fontSize: rs(11.5),
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryCta: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.purplePrimary,
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryCtaText: {
    color: COLORS.purplePrimary,
    fontSize: rs(13),
    fontWeight: '800',
  },
  primaryCta: {
    flex: 1.3,
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: COLORS.white,
    fontSize: rs(13),
    fontWeight: '800',
  },
});
