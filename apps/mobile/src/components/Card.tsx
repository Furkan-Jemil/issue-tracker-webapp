import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding }: CardProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: radius.xl,
          padding: padding ?? 20,
          shadowColor: '#0b1c30',
          borderColor: colors.outlineVariant + '30',
          borderWidth: StyleSheet.hairlineWidth,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  const { colors, typography } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={[typography.sectionHeading, { color: colors.onSurface }]}>{title}</Text>
        {description && (
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{description}</Text>
        )}
      </View>
      {action}
    </View>
  );
}

interface CardRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

export function CardRow({ label, value, valueColor }: CardRowProps) {
  const { colors, typography } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.outlineVariant }]}>
      <Text style={[typography.nanoCaps, { color: colors.onSurfaceVariant, flex: 1 }]}>{label}</Text>
      <Text style={[typography.bodySmBold, { color: valueColor ?? colors.onSurface }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
