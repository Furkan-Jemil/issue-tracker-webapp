import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import AnimatedEntry from '../components/AnimatedEntry';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ClipboardList, CircleAlert, CirclePlay, CircleCheck, ChartBar, Plus } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import TopAppBar from '../components/TopAppBar';
import EmptyState from '../components/EmptyState';

interface Stat {
  label: string;
  value: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  filterStatus?: string;
}

export default function DashboardScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { issues, isLoading, refreshData } = useAppContext();
  const navigation = useNavigation();

  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => (i as any).status === 'OPEN').length;
    const inProgress = issues.filter((i) => (i as any).status === 'IN_PROGRESS').length;
    const resolved = issues.filter((i) => (i as any).status === 'RESOLVED').length;
    return { total, open, inProgress, resolved };
  }, [issues]);

  const statCards: Stat[] = useMemo(
    () => [
      { label: 'Total Issues', value: stats.total, icon: ClipboardList, color: colors.primary, filterStatus: undefined },
      { label: 'Open', value: stats.open, icon: CircleAlert, color: colors.chartOpen, filterStatus: 'OPEN' },
      { label: 'In Progress', value: stats.inProgress, icon: CirclePlay, color: colors.chartInProgress, filterStatus: 'IN_PROGRESS' },
      { label: 'Resolved', value: stats.resolved, icon: CircleCheck, color: colors.chartResolved, filterStatus: 'RESOLVED' },
    ],
    [stats, colors],
  );

  const maxStatValue = useMemo(() => Math.max(...statCards.map((s) => s.value), 1), [statCards]);

  const handleStatPress = useCallback(
    (filterStatus?: string) => {
      (navigation as any).navigate('TasksList', filterStatus ? { filterStatus } : undefined);
    },
    [navigation],
  );

  const onRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <TopAppBar
        title="Dashboard"
        subtitle="Live operational overview"
        onNotificationPress={() => (navigation as any).navigate('Notifications')}
        onProfilePress={() => (navigation as any).navigate('Profile')}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.pageMargin }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {issues.length === 0 && !isLoading ? (
          <EmptyState
            icon={<ClipboardList size={40} color={colors.onSurfaceVariant} />}
            title="No Issues Yet"
            subtitle="Issues you create will appear here on the dashboard."
          />
        ) : (
          <>
            {/* ── Stat cards (2x2 grid) ── */}
            <View style={[styles.grid, { gap: spacing.sm, marginTop: spacing.sm }]}>
              {statCards.map((stat, idx) => (
                <AnimatedEntry key={stat.label} index={idx} delay={60}>
                  <TouchableOpacity
                    onPress={() => handleStatPress(stat.filterStatus)}
                    activeOpacity={0.7}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: colors.surfaceContainerLowest,
                        borderRadius: radius.xl,
                        padding: spacing.cardPadding,
                        shadowColor: '#0b1c30',
                        borderColor: colors.outlineVariant + '30',
                        borderWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <View style={[styles.statIconWrap, { backgroundColor: stat.color + '15', borderRadius: radius.md }]}>
                      <stat.icon size={20} color={stat.color} />
                    </View>
                    <Text style={[typography.display, { color: stat.color, marginTop: spacing.xs }]}>
                      {stat.value}
                    </Text>
                    <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                      {stat.label}
                    </Text>
                  </TouchableOpacity>
                </AnimatedEntry>
              ))}
            </View>

            {/* ── Performance Snapshot ── */}
            <AnimatedEntry index={4} delay={60}>
              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.xl, marginTop: spacing.sectionGap, padding: spacing.cardPadding, borderColor: colors.outlineVariant + '30', borderWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.sectionHeader}>
                  <ChartBar size={18} color={colors.primary} />
                  <Text style={[typography.sectionHeading, { color: colors.onSurface, marginLeft: spacing.sm }]}>
                    Performance Snapshot
                  </Text>
                </View>

                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  {statCards.slice(1).map((stat) => {
                    const barWidth = maxStatValue > 0 ? (stat.value / maxStatValue) * 100 : 0;
                    return (
                      <View key={stat.label} style={styles.barRow}>
                        <Text style={[typography.bodySmBold, { color: colors.onSurfaceVariant, width: 90 }]}>{stat.label}</Text>
                        <View style={[styles.barTrack, { backgroundColor: colors.surfaceContainer, borderRadius: radius.full, flex: 1 }]}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                backgroundColor: stat.color,
                                borderRadius: radius.full,
                                width: `${Math.max(barWidth, 3)}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[typography.bodySmBold, { color: colors.onSurface, width: 36, textAlign: 'right' }]}>
                          {stat.value}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <Text style={[typography.micro, { color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' }]}>
                  {stats.total} total issue{stats.total !== 1 ? 's' : ''}
                </Text>
              </View>
            </AnimatedEntry>

            {/* ── Quick create CTA ── */}
            <AnimatedEntry index={5} delay={60}>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('CreateTask')}
                activeOpacity={0.8}
                style={[styles.cta, { backgroundColor: colors.primaryContainer, borderRadius: radius.xl, marginTop: spacing.sectionGap, marginBottom: 100, borderColor: colors.outlineVariant + '30', borderWidth: StyleSheet.hairlineWidth }]}
              >
                <Plus size={20} color={colors.onPrimaryContainer} />
                <Text style={[typography.bodySmBold, { color: colors.onPrimaryContainer, marginLeft: spacing.sm }]}>
                  Report new issue
                </Text>
              </TouchableOpacity>
            </AnimatedEntry>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '48%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTrack: {
    height: 18,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});
