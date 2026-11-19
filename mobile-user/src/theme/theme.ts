import { Dimensions, PixelRatio } from 'react-native';

export const COLORS = {
  purpleDeep: '#2E1065',
  purpleDark: '#3B0764',
  purplePrimary: '#4C1D95',
  purpleLight: '#6D28D9',
  purpleSoft: '#F3EEFF',
  purpleBorder: '#DDD6FE',
  goldPrimary: '#F59E0B',
  goldDark: '#B45309',
  goldSoft: '#FEF3C7',
  goldBorder: '#FCD34D',
  canvas: '#F7F5FC',
  white: '#FFFFFF',
  ink: '#0F172A',
  inkSecondary: '#475569',
  inkMuted: '#64748B',
  border: '#E2E8F0',
  success: '#059669',
  successSoft: '#ECFDF5',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
};

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
};

export function rs(size: number): number {
  const { width } = Dimensions.get('window');
  const clampedWidth = Math.min(Math.max(width, 320), 430);
  const scale = clampedWidth / 375;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
