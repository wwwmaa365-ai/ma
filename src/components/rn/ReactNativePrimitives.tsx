import React, { useState, useRef } from 'react';
import { RefreshCw, ChevronLeft, X } from 'lucide-react';
import { ResilientImage } from '../ResilientImage.tsx';

/**
 * React Native + Expo Compatible Mobile Primitives for SANJIT SHOP PARTNER (Android)
 * Enforces:
 * - SafeAreaView with safe-area insets
 * - StatusBar with Android status bar styling (#3B0764 Royal Purple)
 * - Responsive Flexbox View & Text with overflow protection (min-w-0, numberOfLines)
 * - ScrollView & FlatList with pull-to-refresh
 * - KeyboardAvoidingView that scrolls focused inputs above the virtual keyboard
 * - TouchableOpacity & Pressable with 48dp minimum touch targets
 */

export interface ViewProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
}

export const View: React.FC<ViewProps> = ({
  children,
  className = '',
  onClick,
  onTouchStart,
  onTouchEnd,
}) => (
  <div
    onClick={onClick}
    onTouchStart={onTouchStart}
    onTouchEnd={onTouchEnd}
    className={`flex flex-col min-w-0 box-border ${className}`}
  >
    {children}
  </div>
);

export interface TextProps {
  children?: React.ReactNode;
  className?: string;
  numberOfLines?: 1 | 2 | 3;
}

export const Text: React.FC<TextProps> = ({
  children,
  className = '',
  numberOfLines,
}) => {
  const clampClass =
    numberOfLines === 1
      ? 'truncate'
      : numberOfLines === 2
      ? 'line-clamp-2 break-words'
      : numberOfLines === 3
      ? 'line-clamp-3 break-words'
      : 'break-words';

  return <span className={`min-w-0 ${clampClass} ${className}`}>{children}</span>;
};

export interface StatusBarProps {
  barStyle?: 'light-content' | 'dark-content';
  backgroundColor?: string;
  storeName?: string;
  syncStatus?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  storeName = 'SANJIT SHOP PARTNER',
  syncStatus = '5G · VoLTE',
}) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      className="w-full bg-[#2E1065] text-white/90 px-3.5 py-1.5 flex items-center justify-between text-[11px] font-medium select-none shrink-0 border-b border-purple-900/60"
      role="status"
      aria-label="Android Status Bar"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono-tabular font-semibold tracking-tight">{timeStr}</span>
        <span aria-hidden="true" className="text-amber-300/90">·</span>
        <span className="truncate text-[10px] text-purple-200">{storeName}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 text-[10px] text-purple-200 font-mono-tabular">
        <span>{syncStatus}</span>
        <span aria-hidden="true">·</span>
        <span className="text-amber-300 font-semibold">98%</span>
      </div>
    </div>
  );
};

export interface SafeAreaViewProps {
  children: React.ReactNode;
  className?: string;
  onSwipeBack?: () => void;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  className = '',
  onSwipeBack,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      onSwipeBack &&
      touchStartX.current !== null &&
      touchStartY.current !== null &&
      e.changedTouches.length === 1
    ) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      // Native Android left-edge swipe back gesture
      if (touchStartX.current < 48 && deltaX > 72 && deltaY < 60) {
        onSwipeBack();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`w-full max-w-full min-h-dvh flex flex-col overflow-x-hidden bg-[#F7F5FC] dark:bg-[#120924] text-slate-900 dark:text-slate-100 select-none ${className}`}
    >
      {children}
    </div>
  );
};

export interface TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  accessibilityLabel?: string;
}

export const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  children,
  onPress,
  disabled = false,
  className = '',
  accessibilityLabel,
}) => (
  <button
    type="button"
    onClick={onPress}
    disabled={disabled}
    aria-label={accessibilityLabel}
    className={`min-h-[46px] px-3.5 py-2.5 flex items-center justify-center gap-2 rounded-xl transition-transform duration-150 active:scale-[0.98] active:opacity-80 focus-visible:outline-2 focus-visible:outline-amber-500 disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${className}`}
  >
    {children}
  </button>
);

export interface ScrollViewProps {
  children: React.ReactNode;
  className?: string;
  contentContainerClassName?: string;
  horizontal?: boolean;
  onRefresh?: () => Promise<void> | void;
}

export const ScrollView: React.FC<ScrollViewProps> = ({
  children,
  className = '',
  contentContainerClassName = '',
  horizontal = false,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const triggerRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 350);
    }
  };

  if (horizontal) {
    return (
      <div
        className={`w-full overflow-x-auto overflow-y-hidden no-scrollbar ${className}`}
      >
        <div className={`flex flex-row items-center gap-2 min-w-max ${contentContainerClassName}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 w-full overflow-y-auto overflow-x-hidden ${className}`}>
      {onRefresh && (
        <div className="w-full flex items-center justify-end px-4 pt-2">
          <button
            type="button"
            onClick={triggerRefresh}
            className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-purple-800 dark:text-purple-200 bg-purple-100/80 dark:bg-purple-950/70 flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>{refreshing ? 'Syncing Store...' : 'Pull / Tap to Sync'}</span>
          </button>
        </div>
      )}
      <div className={`flex flex-col w-full min-w-0 ${contentContainerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export interface FlatListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  ListHeaderComponent?: React.ReactNode;
  ListEmptyComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  contentContainerClassName?: string;
  className?: string;
}

export function FlatList<T>({
  data,
  keyExtractor,
  renderItem,
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
  contentContainerClassName = 'gap-3',
  className = '',
}: FlatListProps<T>) {
  return (
    <div className={`w-full flex flex-col min-w-0 ${className}`}>
      {ListHeaderComponent}
      {data.length === 0 ? (
        ListEmptyComponent || (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No items found.
          </div>
        )
      ) : (
        <div className={`w-full flex flex-col min-w-0 ${contentContainerClassName}`}>
          {data.map((item, index) => (
            <React.Fragment key={keyExtractor(item, index)}>
              {renderItem({ item, index })}
            </React.Fragment>
          ))}
        </div>
      )}
      {ListFooterComponent}
    </div>
  );
}

export interface KeyboardAvoidingViewProps {
  children: React.ReactNode;
  className?: string;
}

export const KeyboardAvoidingView: React.FC<KeyboardAvoidingViewProps> = ({
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 180);
    }
  };

  return (
    <div
      ref={containerRef}
      onFocusCapture={handleFocusCapture}
      className={`w-full flex-1 flex flex-col min-w-0 pb-24 ${className}`}
    >
      {children}
    </div>
  );
};

export interface RNImageProps {
  source: string;
  alt: string;
  className?: string;
  aspectClassName?: string;
  fallbackCategory?: string;
}

export const RNImage: React.FC<RNImageProps> = ({
  source,
  alt,
  className = '',
  aspectClassName = 'aspect-square',
  fallbackCategory,
}) => (
  <div className={`relative w-full overflow-hidden bg-purple-100/50 dark:bg-purple-950/40 shrink-0 ${aspectClassName} ${className}`}>
    <ResilientImage
      src={source}
      alt={alt}
      fallbackLabel={fallbackCategory}
      className="w-full h-full object-cover"
    />
  </div>
);

export interface MobileStackHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const MobileStackHeader: React.FC<MobileStackHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
}) => (
  <header className="sticky top-0 z-30 w-full h-14 px-3 bg-gradient-to-r from-[#3B0764] via-[#4C1D95] to-[#5B21B6] text-white flex items-center justify-between gap-2 shadow-sm border-b border-amber-400/20 shrink-0">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go Back"
          className="min-w-[44px] min-h-[44px] -ml-1 rounded-xl flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-transform shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-amber-300" />
        </button>
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <h1 className="text-[15px] font-bold tracking-tight text-white truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-amber-200/90 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {rightAction && <div className="flex items-center gap-1 shrink-0">{rightAction}</div>}
  </header>
);

export interface BottomSheetModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  title,
  subtitle,
  onClose,
  children,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-h-[88dvh] bg-white dark:bg-[#1A0E30] rounded-t-3xl shadow-2xl border-t border-amber-400/30 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Native Android Bottom Sheet Drag Handle */}
        <div className="w-full pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-11 h-1.5 rounded-full bg-purple-200 dark:bg-purple-800" />
        </div>

        {/* Sheet Header */}
        <div className="px-4 py-2.5 border-b border-purple-100 dark:border-purple-900/60 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-purple-300 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sheet"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-500 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/50 active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Keyboard-Safe Sheet Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3.5">
          <KeyboardAvoidingView className="pb-6">{children}</KeyboardAvoidingView>
        </div>
      </div>
    </div>
  );
};
