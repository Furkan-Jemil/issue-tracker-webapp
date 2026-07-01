import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { getBadge, BadgeKind } from './badgeConfig';

interface BadgeProps {
  /** Pre-resolved colors + label. */
  bg?: string;
  fg?: string;
  label?: string;
  /** Or resolve from data: pass kind + raw enum value. */
  kind?: BadgeKind;
  value?: string;
  /** Show the leading status/type icon when the config has one. */
  showIcon?: boolean;
  style?: ViewStyle;
}

export default function Badge({ bg, fg, label, kind, value, showIcon = true, style }: BadgeProps) {
  const { colors } = useTheme();

  let resolvedBg = bg;
  let resolvedFg = fg;
  let resolvedLabel = label;
  let Icon: React.ElementType | undefined;

  if (kind && value != null) {
    const b = getBadge(kind, value, colors);
    resolvedBg = b.bg;
    resolvedFg = b.fg;
    resolvedLabel = b.label;
    Icon = b.Icon;
  }

  return (
    <View style={[styles.badge, { backgroundColor: resolvedBg ?? colors.muted }, style]}>
      {showIcon && Icon ? <Icon size={11} color={resolvedFg} style={{ marginRight: 4 }} /> : null}
      <Text numberOfLines={1} style={[styles.text, { color: resolvedFg ?? colors.mutedForeground }]}>{resolvedLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
  },
});
