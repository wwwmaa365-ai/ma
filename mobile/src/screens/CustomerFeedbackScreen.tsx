import React, { useMemo, useState } from 'react';
import {
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
import { DemoModeBanner } from '../components/DemoBanner';
import { MAX_REVIEW_REPLY_LENGTH } from '../services/reviewService';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';
import { CustomerReviewItem } from '../types';

type FeedbackFilter = 'ALL' | 'PENDING' | 'STORE' | 'PRODUCT';
type StarFilter = 'ALL' | '5' | '4' | 'LOW';

const QUICK_REPLIES = [
  {
    label: 'Warm Thank You',
    text: 'Namaskar! Thank you for choosing Sanjit Musical Store. We are delighted you loved your purchase and look forward to serving you again.',
  },
  {
    label: 'Resolve & Assist',
    text: 'Thank you for your honest feedback. Our Guwahati technical desk has noted this and will share the setup guide right away—please reach out on Customer Chat anytime.',
  },
  {
    label: 'Delivery Note',
    text: 'Thank you for your patience and kind words! We are coordinating closely with our courier partner to make future dispatches even faster.',
  },
];

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? COLORS.goldPrimary : '#CBD5E1'}
        />
      ))}
    </View>
  );
}

export const CustomerFeedbackScreen: React.FC = () => {
  const { reviews, shopProfile, replyToCustomerReview } = usePartnerStore();

  const [filter, setFilter] = useState<FeedbackFilter>('ALL');
  const [starFilter, setStarFilter] = useState<StarFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState('');
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const pending = reviews.filter((r) => r.status === 'PENDING_REPLY').length;
    const replied = total - pending;
    const responseRate = total > 0 ? Math.round((replied / total) * 100) : 100;
    const storeCount = reviews.filter((r) => r.scope === 'STORE').length;
    const productCount = reviews.filter((r) => r.scope === 'PRODUCT').length;

    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { star, count, pct };
    });

    return {
      total,
      avg,
      pending,
      replied,
      responseRate,
      storeCount,
      productCount,
      distribution,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviews.filter((rev) => {
      if (filter === 'PENDING' && rev.status !== 'PENDING_REPLY') return false;
      if (filter === 'STORE' && rev.scope !== 'STORE') return false;
      if (filter === 'PRODUCT' && rev.scope !== 'PRODUCT') return false;
      if (starFilter === '5' && rev.rating !== 5) return false;
      if (starFilter === '4' && rev.rating !== 4) return false;
      if (starFilter === 'LOW' && rev.rating > 3) return false;
      if (q) {
        const hay = `${rev.customerName} ${rev.productName} ${rev.orderRef} ${rev.comment}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, filter, starFilter, searchQuery]);

  const openComposer = (rev: CustomerReviewItem) => {
    setActiveReplyId(rev.id);
    setDraftReply(rev.sellerReply || '');
  };

  const handlePublish = (reviewId: string) => {
    const trimmed = draftReply.trim().slice(0, MAX_REVIEW_REPLY_LENGTH);
    if (trimmed.length < 2) return;
    replyToCustomerReview(reviewId, trimmed);
    setActiveReplyId(null);
    setDraftReply('');
    setSavedNoticeId(reviewId);
    setTimeout(() => {
      setSavedNoticeId((cur) => (cur === reviewId ? null : cur));
    }, 2600);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
        >
          <DemoModeBanner note="Demo Mode + Live Firestore Sync — Seller replies update immediately and sync to Firestore when authenticated." />

          {/* Overall Rating Summary Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.scoreColumn}>
                <Text style={styles.heroOverline}>STORE &amp; PRODUCT RATING</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.heroScore}>{stats.avg.toFixed(1)}</Text>
                  <Text style={styles.heroOutOf}>/ 5.0</Text>
                </View>
                <StarRow rating={Math.round(stats.avg)} size={15} />
                <Text style={styles.heroMeta}>
                  {stats.total} reviews · {stats.responseRate}% replied
                </Text>
              </View>

              <View style={styles.distCol}>
                {stats.distribution.map((row) => (
                  <View key={row.star} style={styles.distRow}>
                    <Text style={styles.distStar}>{row.star}★</Text>
                    <View style={styles.distTrack}>
                      <View
                        style={[
                          styles.distFill,
                          { width: `${Math.max(row.pct, row.count > 0 ? 8 : 0)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.distCount}>{row.count}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.summaryStrip}>
              <Text style={styles.summaryStripItem}>
                Needs Reply: <Text style={styles.summaryGold}>{stats.pending}</Text>
              </Text>
              <Text style={styles.summaryDot}>·</Text>
              <Text style={styles.summaryStripItem}>Store: {stats.storeCount}</Text>
              <Text style={styles.summaryDot}>·</Text>
              <Text style={styles.summaryStripItem}>Products: {stats.productCount}</Text>
            </View>
          </View>

          {/* Search & Interactive Segmented Filters */}
          <View style={styles.filterCard}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={COLORS.inkMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search customer, instrument, order..."
                placeholderTextColor={COLORS.inkMuted}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={16} color={COLORS.inkMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.segmentedRow}>
              {(
                [
                  { id: 'ALL', label: `All (${stats.total})` },
                  { id: 'PENDING', label: `Pending (${stats.pending})` },
                  { id: 'STORE', label: 'Store' },
                  { id: 'PRODUCT', label: 'Products' },
                ] as const
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setFilter(tab.id)}
                    style={[styles.segBtn, active && styles.segBtnActive]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.segText, active && styles.segTextActive]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.starFilterRow}>
              {(
                [
                  { id: 'ALL', label: 'All Ratings' },
                  { id: '5', label: '5 Stars' },
                  { id: '4', label: '4 Stars' },
                  { id: 'LOW', label: '3★ & Below' },
                ] as const
              ).map((sf) => {
                const active = starFilter === sf.id;
                return (
                  <TouchableOpacity
                    key={sf.id}
                    onPress={() => setStarFilter(sf.id)}
                    style={[styles.starBtn, active && styles.starBtnActive]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.starBtnText, active && styles.starBtnTextActive]}
                    >
                      {sf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Reviews Feed */}
          {filteredReviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbox-ellipses-outline" size={28} color={COLORS.purplePrimary} />
              <Text style={styles.emptyTitle}>No reviews match this filter</Text>
              <Text style={styles.emptyMeta}>
                Try clearing your search or switching back to All reviews.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFilter('ALL');
                  setStarFilter('ALL');
                  setSearchQuery('');
                }}
                style={styles.resetBtn}
              >
                <Text style={styles.resetBtnText}>Show All Reviews</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredReviews.map((rev) => {
              const isComposing = activeReplyId === rev.id;
              const isReplied = rev.status === 'REPLIED' && Boolean(rev.sellerReply);
              return (
                <View key={rev.id} style={styles.reviewCard}>
                  {/* Review Header */}
                  <View style={styles.reviewTop}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text numberOfLines={1} style={styles.reviewTarget}>
                        {rev.productName}
                      </Text>
                      <Text style={styles.reviewMetaLine}>
                        {rev.scope === 'STORE' ? 'Store Review' : 'Product Review'} · {rev.orderRef} · {rev.createdAt}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <StarRow rating={rev.rating} size={13} />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isReplied ? COLORS.success : COLORS.warning },
                        ]}
                      >
                        {isReplied ? 'Replied' : 'Awaiting Reply'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.customerByline}>
                    {rev.customerName} · {rev.customerCity}
                    {rev.verifiedPurchase ? ' · Verified Buyer' : ''}
                  </Text>

                  <Text style={styles.reviewBody}>{rev.comment}</Text>

                  {savedNoticeId === rev.id ? (
                    <Text style={styles.savedNotice}>
                      Reply published publicly as {shopProfile.shopName}.
                    </Text>
                  ) : null}

                  {/* Existing Seller Reply */}
                  {isReplied && !isComposing ? (
                    <View style={styles.replyBox}>
                      <View style={styles.replyHeaderRow}>
                        <Text style={styles.replyAuthor}>
                          Your Response · {rev.sellerRepliedAt || 'Just now'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => openComposer(rev)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.editLink}>Edit Reply</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.replyText}>{rev.sellerReply}</Text>
                    </View>
                  ) : null}

                  {/* Inline Reply Composer */}
                  {isComposing ? (
                    <View style={styles.composerBox}>
                      <Text style={styles.composerLabel}>
                        Quick Response Templates
                      </Text>
                      <View style={styles.templateRow}>
                        {QUICK_REPLIES.map((tpl) => (
                          <TouchableOpacity
                            key={tpl.label}
                            onPress={() => setDraftReply(tpl.text)}
                            style={styles.templateBtn}
                          >
                            <Text style={styles.templateBtnText}>{tpl.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TextInput
                        value={draftReply}
                        onChangeText={(txt) =>
                          setDraftReply(txt.slice(0, MAX_REVIEW_REPLY_LENGTH))
                        }
                        placeholder={`Write your response as ${shopProfile.shopName}...`}
                        placeholderTextColor={COLORS.inkMuted}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        style={styles.composerInput}
                      />

                      <View style={styles.composerFooter}>
                        <Text style={styles.charCount}>
                          {draftReply.length}/{MAX_REVIEW_REPLY_LENGTH}
                        </Text>
                        <View style={styles.composerActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setActiveReplyId(null);
                              setDraftReply('');
                            }}
                            style={styles.cancelBtn}
                          >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handlePublish(rev.id)}
                            disabled={draftReply.trim().length < 2}
                            style={[
                              styles.publishBtn,
                              draftReply.trim().length < 2 && { opacity: 0.5 },
                            ]}
                          >
                            <Ionicons name="send" size={14} color={COLORS.goldPrimary} />
                            <Text style={styles.publishBtnText}>Publish Reply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : !isReplied ? (
                    <TouchableOpacity
                      onPress={() => openComposer(rev)}
                      style={styles.replyTriggerBtn}
                    >
                      <Ionicons
                        name="return-up-back-outline"
                        size={16}
                        color={COLORS.goldPrimary}
                      />
                      <Text style={styles.replyTriggerText}>Respond to Review</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.canvas },
  scrollBody: { padding: SPACING.md, paddingBottom: 32, gap: 12 },
  heroCard: {
    backgroundColor: COLORS.purplePrimary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    gap: 12,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreColumn: { width: 118, gap: 4 },
  heroOverline: {
    color: COLORS.goldPrimary,
    fontSize: rs(9.5),
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroScore: { color: COLORS.white, fontSize: rs(28), fontWeight: '800' },
  heroOutOf: { color: '#DDD6FE', fontSize: rs(12), fontWeight: '600' },
  heroMeta: { color: '#E9D5FF', fontSize: rs(11), marginTop: 2 },
  distCol: { flex: 1, gap: 5 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distStar: { color: '#FDE68A', fontSize: rs(10), fontWeight: '700', width: 22 },
  distTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.goldPrimary,
  },
  distCount: {
    color: COLORS.white,
    fontSize: rs(10),
    fontWeight: '700',
    width: 18,
    textAlign: 'right',
  },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  summaryStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  summaryStripItem: { color: '#E9D5FF', fontSize: rs(11.5), fontWeight: '600' },
  summaryGold: { color: COLORS.goldPrimary, fontWeight: '800' },
  summaryDot: { color: 'rgba(255,255,255,0.45)', fontSize: rs(12) },
  filterCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, fontSize: rs(12.5), color: COLORS.ink, paddingVertical: 8 },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.purpleSoft,
    padding: 3,
    borderRadius: 10,
    gap: 3,
  },
  segBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segBtnActive: { backgroundColor: COLORS.purplePrimary },
  segText: { fontSize: rs(10.5), fontWeight: '700', color: COLORS.inkSecondary },
  segTextActive: { color: COLORS.goldPrimary },
  starFilterRow: { flexDirection: 'row', gap: 6 },
  starBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    backgroundColor: COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  starBtnActive: {
    borderColor: COLORS.goldPrimary,
    backgroundColor: COLORS.goldSoft,
  },
  starBtnText: { fontSize: rs(10.5), fontWeight: '600', color: COLORS.inkSecondary },
  starBtnTextActive: { color: COLORS.goldDark, fontWeight: '800' },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    gap: 8,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewTarget: { fontSize: rs(13.5), fontWeight: '800', color: COLORS.ink },
  reviewMetaLine: { fontSize: rs(11), color: COLORS.inkMuted },
  statusText: { fontSize: rs(10.5), fontWeight: '700' },
  customerByline: { fontSize: rs(11.5), fontWeight: '700', color: COLORS.purplePrimary },
  reviewBody: { fontSize: rs(13), color: COLORS.ink, lineHeight: rs(19) },
  savedNotice: { fontSize: rs(11.5), fontWeight: '700', color: COLORS.success },
  replyBox: {
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.sm,
    padding: 12,
    gap: 4,
    marginTop: 2,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  replyAuthor: { fontSize: rs(11), fontWeight: '700', color: COLORS.purplePrimary },
  editLink: { fontSize: rs(11), fontWeight: '800', color: COLORS.goldDark },
  replyText: { fontSize: rs(12.5), color: COLORS.ink, lineHeight: rs(18) },
  replyTriggerBtn: {
    minHeight: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.purplePrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  replyTriggerText: { color: COLORS.goldPrimary, fontSize: rs(12.5), fontWeight: '800' },
  composerBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.purpleSoft,
    paddingTop: 10,
    gap: 8,
  },
  composerLabel: { fontSize: rs(11), fontWeight: '700', color: COLORS.inkSecondary },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  templateBtn: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.purpleSoft,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    justifyContent: 'center',
  },
  templateBtnText: { fontSize: rs(10.5), fontWeight: '700', color: COLORS.purplePrimary },
  composerInput: {
    minHeight: 84,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: rs(12.5),
    color: COLORS.ink,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  charCount: { fontSize: rs(10.5), color: COLORS.inkMuted },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelBtn: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: rs(12), fontWeight: '700', color: COLORS.inkSecondary },
  publishBtn: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.purplePrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  publishBtnText: { fontSize: rs(12), fontWeight: '800', color: COLORS.goldPrimary },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: rs(14), fontWeight: '800', color: COLORS.ink },
  emptyMeta: { fontSize: rs(12), color: COLORS.inkSecondary, textAlign: 'center' },
  resetBtn: {
    marginTop: 4,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: { color: COLORS.goldPrimary, fontSize: rs(12), fontWeight: '800' },
});
