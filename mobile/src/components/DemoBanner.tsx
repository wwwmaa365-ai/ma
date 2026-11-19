import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, rs, SPACING } from '../theme/theme';

export const DemoModeBanner: React.FC<{ note?: string }> = ({
  note = 'Demo Mode Active — Sample store data only. No real money or live payments are processed.',
}) => (
  <View style={styles.banner}>
    <Ionicons name="information-circle" size={16} color={COLORS.goldDark} />
    <Text style={styles.bannerText}>{note}</Text>
  </View>
);

export const PrimaryButton: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'purple' | 'gold' | 'outline' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}> = ({ title, onPress, variant = 'purple', icon, disabled }) => {
  const bgStyle =
    variant === 'gold'
      ? { backgroundColor: COLORS.goldPrimary }
      : variant === 'outline'
      ? { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.purpleBorder }
      : variant === 'danger'
      ? { backgroundColor: COLORS.dangerSoft, borderWidth: 1, borderColor: '#FECACA' }
      : { backgroundColor: COLORS.purplePrimary };

  const textColor =
    variant === 'gold'
      ? COLORS.ink
      : variant === 'outline'
      ? COLORS.purplePrimary
      : variant === 'danger'
      ? COLORS.danger
      : COLORS.goldSoft;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[styles.btn, bgStyle, disabled && { opacity: 0.5 }]}
    >
      {icon ? <Ionicons name={icon} size={17} color={textColor} /> : null}
      <Text numberOfLines={1} style={[styles.btnText, { color: textColor }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.goldSoft,
    borderColor: COLORS.goldBorder,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: rs(11),
    lineHeight: rs(15),
    color: COLORS.goldDark,
    fontWeight: '600',
  },
  btn: {
    minHeight: 46,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: rs(13),
    fontWeight: '700',
  },
});
