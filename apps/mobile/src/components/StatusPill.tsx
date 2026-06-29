import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Circle, CircleDot, CheckCircle2, XCircle, AlertTriangle, AlertCircle, Bug, Sparkles, User, Shield, Wrench } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../theme/useTheme';

interface StatusPillProps {
  value: string;
  type?: 'status' | 'priority' | 'type' | 'severity' | 'role';
}

// ── Semantic color + icon map per type ──

function statusEntry(colors: ThemeColors, value: string) {
  switch (value) {
    case 'OPEN': return { bg: colors.statusOpenBg, fg: colors.statusOpenText, Icon: Circle };
    case 'IN_PROGRESS': return { bg: colors.statusInProgressBg, fg: colors.statusInProgressText, Icon: CircleDot };
    case 'RESOLVED': return { bg: colors.statusResolvedBg, fg: colors.statusResolvedText, Icon: CheckCircle2 };
    case 'CLOSED': return { bg: colors.statusClosedBg, fg: colors.statusClosedText, Icon: XCircle };
    default: return { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant, Icon: Circle };
  }
}

function priorityEntry(colors: ThemeColors, value: string) {
  switch (value) {
    case 'HIGH': return { bg: colors.priorityHighBg, fg: colors.priorityHighText, Icon: AlertTriangle };
    case 'MEDIUM': return { bg: colors.priorityMediumBg, fg: colors.priorityMediumText, Icon: AlertCircle };
    case 'LOW': return { bg: colors.priorityLowBg, fg: colors.priorityLowText, Icon: Circle };
    default: return { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant, Icon: Circle };
  }
}

function typeEntry(colors: ThemeColors, value: string) {
  switch (value) {
    case 'BUG': return { bg: colors.statusOpenBg, fg: colors.statusOpenText, Icon: Bug };
    case 'IMPROVEMENT': return { bg: colors.statusResolvedBg, fg: colors.statusResolvedText, Icon: Sparkles };
    case 'FEATURE': return { bg: colors.statusResolvedBg, fg: colors.statusResolvedText, Icon: Sparkles };
    case 'TASK': return { bg: colors.priorityLowBg, fg: colors.priorityLowText, Icon: Circle };
    case 'DESIGN': return { bg: colors.statusInProgressBg, fg: colors.statusInProgressText, Icon: Wrench };
    default: return { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant, Icon: Circle };
  }
}

function severityEntry(colors: ThemeColors, value: string) {
  switch (value) {
    case 'CRITICAL': return { bg: colors.statusOpenBg, fg: colors.statusOpenText, Icon: AlertTriangle };
    case 'MAJOR': return { bg: colors.priorityHighBg, fg: colors.priorityHighText, Icon: AlertCircle };
    case 'MINOR': return { bg: colors.priorityLowBg, fg: colors.priorityLowText, Icon: Circle };
    default: return { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant, Icon: Circle };
  }
}

function roleEntry(colors: ThemeColors, _value: string) {
  switch (_value) {
    case 'ADMIN': return { bg: '#f3e8ff', fg: '#7c3aed', Icon: Shield };
    case 'TESTER': return { bg: '#dbeafe', fg: '#1d4ed8', Icon: Bug };
    case 'USER': return { bg: '#f1f5f9', fg: '#64748b', Icon: User };
    default: return { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant, Icon: User };
  }
}

const ENTRY_MAP: Record<string, (c: ThemeColors, v: string) => { bg: string; fg: string; Icon: React.ElementType }> = {
  status: statusEntry,
  priority: priorityEntry,
  type: typeEntry,
  severity: severityEntry,
  role: roleEntry,
};

const LABEL_MAP: Record<string, (v: string) => string> = {
  status: (v) =>
    v === 'IN_PROGRESS' ? 'In Progress' : v.charAt(0) + v.slice(1).toLowerCase(),
  priority: (v) => v.charAt(0) + v.slice(1).toLowerCase(),
  type: (v) => v.charAt(0) + v.slice(1).toLowerCase(),
  severity: (v) => v.charAt(0) + v.slice(1).toLowerCase(),
  role: (v) => v.charAt(0) + v.slice(1).toLowerCase(),
};

export default function StatusPill({ value, type = 'status' }: StatusPillProps) {
  const { colors, typography } = useTheme();
  const entryFn = ENTRY_MAP[type];
  const entry = entryFn ? entryFn(colors, value) : { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant, Icon: Circle };
  const labelFn = LABEL_MAP[type];
  const label = labelFn ? labelFn(value) : value;
  const { bg, fg, Icon } = entry;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Icon size={11} color={fg} style={styles.icon} />
      <Text style={[typography.labelBadge, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  icon: {
    marginRight: 5,
  },
});
