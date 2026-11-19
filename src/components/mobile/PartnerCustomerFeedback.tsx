import React, { useMemo, useState } from 'react';
import {
  Info,
  MessageSquareReply,
  Search,
  Send,
  Star,
  X,
} from 'lucide-react';
import { DemoCustomerReview } from '../../data/partnerDemoData.ts';
import { MAX_SELLER_REVIEW_REPLY_LEN } from '../../services/firebaseClient.ts';
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  View,
} from '../rn/ReactNativePrimitives.tsx';

type FeedbackScopeFilter = 'ALL' | 'PENDING' | 'STORE' | 'PRODUCT';
type FeedbackStarFilter = 'ALL' | '5' | '4' | 'LOW';

const QUICK_REPLY_TEMPLATES = [
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

function RatingStars({
  rating,
  sizeClass = 'w-3.5 h-3.5',
}: {
  rating: number;
  sizeClass?: string;
}) {
  return (
    <span
      className="inline-flex flex-row items-center gap-0.5 shrink-0"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sizeClass} ${
            n <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-300 dark:text-purple-800'
          }`}
        />
      ))}
    </span>
  );
}

export interface PartnerCustomerFeedbackProps {
  reviews: DemoCustomerReview[];
  shopName: string;
  onReplyToReview: (reviewId: string, replyText: string) => void;
}

export const PartnerCustomerFeedback: React.FC<PartnerCustomerFeedbackProps> = ({
  reviews,
  shopName,
  onReplyToReview,
}) => {
  const [scopeFilter, setScopeFilter] = useState<FeedbackScopeFilter>('ALL');
  const [starFilter, setStarFilter] = useState<FeedbackStarFilter>('ALL');
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
      if (scopeFilter === 'PENDING' && rev.status !== 'PENDING_REPLY') return false;
      if (scopeFilter === 'STORE' && rev.scope !== 'STORE') return false;
      if (scopeFilter === 'PRODUCT' && rev.scope !== 'PRODUCT') return false;
      if (starFilter === '5' && rev.rating !== 5) return false;
      if (starFilter === '4' && rev.rating !== 4) return false;
      if (starFilter === 'LOW' && rev.rating > 3) return false;
      if (q) {
        const hay = `${rev.customerName} ${rev.productName} ${rev.orderRef} ${rev.comment}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, scopeFilter, starFilter, searchQuery]);

  const openComposer = (rev: DemoCustomerReview) => {
    setActiveReplyId(rev.id);
    setDraftReply(rev.sellerReply || '');
  };

  const handlePublish = (reviewId: string) => {
    const clean = draftReply.trim().slice(0, MAX_SELLER_REVIEW_REPLY_LEN);
    if (clean.length < 2) return;
    onReplyToReview(reviewId, clean);
    setActiveReplyId(null);
    setDraftReply('');
    setSavedNoticeId(reviewId);
    setTimeout(() => {
      setSavedNoticeId((cur) => (cur === reviewId ? null : cur));
    }, 2600);
  };

  return (
    <ScrollView contentContainerClassName="px-3.5 pt-3 pb-24 gap-3.5">
      <KeyboardAvoidingView>
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 dark:border-amber-700/50 flex flex-row items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Demo + Firestore Sync:</strong> View store &amp; product ratings and publish seller replies directly.
          </span>
        </div>

        {/* Store & Product Rating Summary Card */}
        <View className="w-full rounded-2xl bg-gradient-to-br from-[#3B0764] via-[#4C1D95] to-[#5B21B6] p-4 text-white border border-amber-400/35 shadow-md gap-3">
          <div className="flex flex-row items-center gap-3.5">
            <div className="w-[106px] shrink-0 flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-wider text-amber-300">
                PARTNER RATING
              </span>
              <div className="flex flex-row items-baseline gap-1">
                <span className="text-3xl font-extrabold font-mono-tabular text-white leading-none">
                  {stats.avg.toFixed(1)}
                </span>
                <span className="text-xs text-purple-200 font-semibold">/ 5.0</span>
              </div>
              <RatingStars rating={Math.round(stats.avg)} sizeClass="w-3.5 h-3.5" />
              <span className="text-[11px] text-purple-200 font-mono-tabular mt-0.5">
                {stats.total} reviews · {stats.responseRate}% replied
              </span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              {stats.distribution.map((row) => (
                <div key={row.star} className="flex flex-row items-center gap-1.5">
                  <span className="text-[10px] font-bold font-mono-tabular text-amber-200 w-5 shrink-0">
                    {row.star}★
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(row.pct, row.count > 0 ? 8 : 0)}%` }}
                      className="h-full rounded-full bg-amber-400"
                    />
                  </div>
                  <span className="text-[10px] font-bold font-mono-tabular text-white w-4 text-right shrink-0">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-white/15" />

          <div className="flex flex-row items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-purple-100 font-medium">
            <span>
              Needs Reply:{' '}
              <strong className="text-amber-300 font-mono-tabular">
                {stats.pending}
              </strong>
            </span>
            <span aria-hidden="true" className="opacity-50">
              ·
            </span>
            <span>
              Store: <strong className="font-mono-tabular">{stats.storeCount}</strong>
            </span>
            <span aria-hidden="true" className="opacity-50">
              ·
            </span>
            <span>
              Products:{' '}
              <strong className="font-mono-tabular">{stats.productCount}</strong>
            </span>
          </div>
        </View>

        {/* Search & Interactive Segmented Filter Controls */}
        <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3 border border-purple-100 dark:border-purple-900/60 gap-2.5">
          <div className="relative flex flex-row items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyer, product, order..."
              className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                aria-label="Clear review search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-purple-50 dark:bg-purple-950/70">
            {(
              [
                { id: 'ALL', label: `All (${stats.total})` },
                { id: 'PENDING', label: `Pending (${stats.pending})` },
                { id: 'STORE', label: 'Store' },
                { id: 'PRODUCT', label: 'Products' },
              ] as const
            ).map((tab) => {
              const active = scopeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScopeFilter(tab.id)}
                  className={`min-h-[36px] px-1.5 rounded-lg text-[10.5px] font-bold whitespace-nowrap truncate transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#4C1D95] text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-purple-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'ALL', label: 'All ★' },
                { id: '5', label: '5 Stars' },
                { id: '4', label: '4 Stars' },
                { id: 'LOW', label: '3★ & Low' },
              ] as const
            ).map((sf) => {
              const active = starFilter === sf.id;
              return (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => setStarFilter(sf.id)}
                  className={`min-h-[34px] px-1.5 rounded-lg border text-[10.5px] font-bold whitespace-nowrap truncate transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-800 dark:text-amber-300'
                      : 'bg-white dark:bg-[#120924] border-purple-200/80 dark:border-purple-900 text-slate-600 dark:text-purple-300'
                  }`}
                >
                  {sf.label}
                </button>
              );
            })}
          </div>
        </View>

        {/* Customer Reviews Feed */}
        {filteredReviews.length === 0 ? (
          <View className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-6 border border-purple-100 dark:border-purple-900/60 items-center text-center gap-2">
            <Text className="text-sm font-bold text-slate-900 dark:text-white">
              No reviews match this filter
            </Text>
            <span className="text-xs text-slate-500 dark:text-purple-300">
              Clear search or switch back to view all store and product reviews.
            </span>
            <button
              type="button"
              onClick={() => {
                setScopeFilter('ALL');
                setStarFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-2 min-h-[42px] px-4 rounded-xl bg-[#4C1D95] text-amber-300 text-xs font-bold cursor-pointer"
            >
              Show All Reviews
            </button>
          </View>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredReviews.map((rev) => {
              const isComposing = activeReplyId === rev.id;
              const isReplied = rev.status === 'REPLIED' && Boolean(rev.sellerReply);
              return (
                <View
                  key={rev.id}
                  className="w-full bg-white dark:bg-[#1E1136] rounded-2xl p-3.5 border border-purple-100 dark:border-purple-900/60 gap-2"
                >
                  {/* Header: Product/Store title + Stars & Status */}
                  <div className="flex flex-row items-start justify-between gap-2.5">
                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                      <Text
                        numberOfLines={1}
                        className="text-xs font-extrabold text-slate-900 dark:text-white"
                      >
                        {rev.productName}
                      </Text>
                      <span className="text-[11px] text-slate-500 dark:text-purple-300 font-mono-tabular truncate">
                        {rev.scope === 'STORE' ? 'Store Review' : 'Product Review'} · {rev.orderRef} · {rev.createdAt}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <RatingStars rating={rev.rating} sizeClass="w-3 h-3" />
                      <span
                        className={`text-[10.5px] font-bold ${
                          isReplied
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isReplied ? 'Replied' : 'Awaiting Reply'}
                      </span>
                    </div>
                  </div>

                  {/* Clean unboxed customer byline */}
                  <span className="text-[11px] font-bold text-purple-900 dark:text-amber-300">
                    {rev.customerName} · {rev.customerCity}
                    {rev.verifiedPurchase ? ' · Verified Buyer' : ''}
                  </span>

                  {/* Customer Review Text */}
                  <p className="text-xs text-slate-700 dark:text-purple-100 leading-relaxed break-words">
                    {rev.comment}
                  </p>

                  {savedNoticeId === rev.id && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      Reply published publicly as {shopName}.
                    </span>
                  )}

                  {/* Published Seller Response */}
                  {isReplied && !isComposing && (
                    <div className="mt-1 p-3 rounded-xl bg-purple-50/90 dark:bg-purple-950/60 border border-purple-200/70 dark:border-purple-800/70 flex flex-col gap-1.5">
                      <div className="flex flex-row items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-purple-900 dark:text-amber-300">
                          Your Response · {rev.sellerRepliedAt || 'Just now'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openComposer(rev)}
                          className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                        >
                          Edit Reply
                        </button>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-purple-100 leading-relaxed break-words">
                        {rev.sellerReply}
                      </p>
                    </div>
                  )}

                  {/* Inline Reply Composer */}
                  {isComposing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePublish(rev.id);
                      }}
                      className="pt-2.5 mt-1 border-t border-purple-100 dark:border-purple-900/60 flex flex-col gap-2"
                    >
                      <span className="text-[11px] font-bold text-slate-600 dark:text-purple-200">
                        Quick Response Templates
                      </span>
                      <div className="flex flex-row flex-wrap gap-1.5">
                        {QUICK_REPLY_TEMPLATES.map((tpl) => (
                          <button
                            key={tpl.label}
                            type="button"
                            onClick={() => setDraftReply(tpl.text)}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-[10.5px] font-bold text-purple-900 dark:text-purple-100 cursor-pointer"
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={3}
                        value={draftReply}
                        maxLength={MAX_SELLER_REVIEW_REPLY_LEN}
                        onChange={(e) =>
                          setDraftReply(
                            e.target.value.slice(0, MAX_SELLER_REVIEW_REPLY_LEN)
                          )
                        }
                        placeholder={`Write your response as ${shopName}...`}
                        className="w-full p-3 rounded-xl bg-purple-50/50 dark:bg-[#120924] border border-purple-200 dark:border-purple-800 text-xs text-slate-900 dark:text-white resize-none"
                      />

                      <div className="flex flex-row items-center justify-between gap-2">
                        <span className="text-[10.5px] font-mono-tabular text-slate-500 dark:text-purple-300">
                          {draftReply.length}/{MAX_SELLER_REVIEW_REPLY_LEN}
                        </span>
                        <div className="flex flex-row items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyId(null);
                              setDraftReply('');
                            }}
                            className="min-h-[40px] px-3.5 rounded-xl border border-purple-200 dark:border-purple-800 text-xs font-bold text-slate-600 dark:text-purple-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={draftReply.trim().length < 2}
                            className="min-h-[40px] px-4 rounded-xl bg-[#4C1D95] text-amber-300 text-xs font-extrabold flex flex-row items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                            <span>Publish Reply</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : !isReplied ? (
                    <button
                      type="button"
                      onClick={() => openComposer(rev)}
                      className="mt-1 w-full min-h-[44px] px-4 rounded-xl bg-[#4C1D95] hover:bg-[#5B21B6] text-amber-300 text-xs font-extrabold flex flex-row items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <MessageSquareReply className="w-4 h-4 shrink-0" />
                      <span>Respond to Review</span>
                    </button>
                  ) : null}
                </View>
              );
            })}
          </div>
        )}
      </KeyboardAvoidingView>
    </ScrollView>
  );
};
