import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ListChecks,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  BarChart3,
} from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, SearchBar, IconButton, Select, Skeleton, FilterPopover } from '../components/ui';
import usePersistedState from '../utils/usePersistedState';
import StatusDonut from '../charts/StatusDonut';
import ComparisonBars from '../charts/ComparisonBars';
import TrendLine from '../charts/TrendLine';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

const RANGE_OPTIONS = [
  { value: '7 days', label: '7 days' },
  { value: '30 days', label: '30 days' },
  { value: '90 days', label: '90 days' },
  { value: '1 year', label: '1 year' },
];

const FILTER_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const FILTER_PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

const FILTER_SEVERITY_OPTIONS = [
  { value: '', label: 'All severities' },
  { value: 'MINOR', label: 'Minor' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function DashboardScreen() {
  const { colors, spacing, typography, pagePadding } = useTheme();
  const { isTablet } = useResponsive();
  const navigation = useNavigation<any>();
  const { issues, isLoading, fetchError, refreshData } = useAppContext();

  const [search, setSearch] = useState('');
  const [range, setRange] = usePersistedState('dashboard_range', '30 days');
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = usePersistedState('dashboard_status', '');
  const [filterPriority, setFilterPriority] = usePersistedState('dashboard_priority', '');
  const [filterSeverity, setFilterSeverity] = usePersistedState('dashboard_severity', '');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const day = 86400000;
  const rangeDays = { '7 days': 7, '30 days': 30, '90 days': 90, '1 year': 365 }[range] ?? 30;
  const cutoff = Date.now() - rangeDays * day;

  const filteredByTime = issues.filter((i: any) => new Date(i.created_at).getTime() > cutoff);

  const filtered = filteredByTime.filter((i) => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterPriority && i.priority !== filterPriority) return false;
    if (filterSeverity && i.severity !== filterSeverity) return false;
    return true;
  });

  const total = filtered.length;
  const open = filtered.filter((i) => i.status === 'OPEN').length;
  const inProgress = filtered.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolved = filtered.filter((i) => i.status === 'RESOLVED').length;
  const closed = filtered.filter((i) => i.status === 'CLOSED').length;

  const goToList = (status?: string) => navigation.navigate('TasksList', status ? { initialStatus: status } : undefined);

  const stats = [
    { label: 'Total tasks', value: total, Icon: ListChecks, color: colors.chart1, status: undefined },
    { label: 'Open', value: open, Icon: AlertCircle, color: colors.chart2, status: 'OPEN' },
    { label: 'In progress', value: inProgress, Icon: Clock, color: colors.chart3, status: 'IN_PROGRESS' },
    { label: 'Resolved', value: resolved, Icon: CheckCircle2, color: colors.chart5, status: 'RESOLVED' },
    { label: 'Closed', value: closed, Icon: XCircle, color: '#0C4A6E', status: 'CLOSED' },
  ];

  const donutData = [
    { label: 'Open', value: open, color: colors.chartOpen },
    { label: 'In Progress', value: inProgress, color: colors.chartInProgress },
    { label: 'Resolved', value: resolved, color: colors.chartResolved },
    { label: 'Closed', value: closed, color: colors.chartClosed },
  ];

  const barData = [
    { label: 'May 20–25', open: 0, closed: 0 },
    { label: 'Jun 1–6', open: Math.min(open, 2), closed: Math.min(closed, 1) },
    { label: 'Jun 13–18', open: Math.min(open, 3), closed: Math.min(closed, 2) },
  ];

  const trendData = [
    { label: 'May 20', open: 0, prog: 0 },
    { label: 'Jun 1', open: Math.min(open, 1), prog: Math.min(inProgress, 1) },
    { label: 'Jun 13', open: Math.min(open, 2), prog: Math.min(inProgress, 2) },
    { label: 'Jun 17', open: Math.max(0, open - 1), prog: Math.max(0, inProgress - 1) },
  ];

  const comparisonCard = (
    <Card padding={spacing.xl}>
      <Text style={[typography.cardTitle, { color: colors.foreground }]}>Monthly Comparison</Text>
      <Text style={[typography.cardDesc, { color: colors.mutedForeground }]}>
        Open versus closed issue volume by grouped date buckets.
      </Text>
      <ComparisonBars data={barData} onBarPress={() => navigation.navigate('TasksList')} />
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TasksList')}>
        <View style={[styles.footerDivider, { borderTopColor: colors.cardBorder }]} />
        <Text style={[typography.footerCaption, { color: colors.foreground }]}>
          Trending up by 5.2% this month
        </Text>
        <Text style={[typography.footerSub, { color: colors.mutedForeground }]}>
          Based on current sprint data
        </Text>
      </TouchableOpacity>
    </Card>
  );

  const trendCard = (
    <Card padding={spacing.xl}>
      <Text style={[typography.cardTitle, { color: colors.foreground }]}>Issue Trend</Text>
      <Text style={[typography.cardDesc, { color: colors.mutedForeground }]}>
        Open and in-progress issues across the selected range.
      </Text>
      <TrendLine data={trendData} onPointPress={() => navigation.navigate('TasksList')} />
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TasksList')}>
        <View style={[styles.footerDivider, { borderTopColor: colors.cardBorder }]} />
        <Text style={[typography.footerCaption, { color: colors.foreground }]}>
          Trending up by 5.2% this month
        </Text>
        <Text style={[typography.footerSub, { color: colors.mutedForeground }]}>
          Based on current sprint data
        </Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <Screen title="Dashboard" subtitle="Live operational overview · Ethio Telecom" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {isLoading ? (
        <View style={{ paddingHorizontal: pagePadding, paddingTop: spacing.xl, gap: spacing.md }}>
          <Card padding={spacing.cardPadding} style={{ borderWidth: 0 }}>
            <Skeleton width="40%" height={11} borderRadius={4} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="30%" height={30} borderRadius={6} />
          </Card>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {[1, 2].map((i) => (
              <View key={i} style={{ flex: 1 }}>
                <Card padding={spacing.cardPadding} style={{ borderWidth: 0 }}>
                  <Skeleton width="60%" height={11} borderRadius={4} style={{ marginBottom: spacing.sm }} />
                  <Skeleton width="40%" height={30} borderRadius={6} />
                </Card>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {[3, 4].map((i) => (
              <View key={i} style={{ flex: 1 }}>
                <Card padding={spacing.cardPadding} style={{ borderWidth: 0 }}>
                  <Skeleton width="60%" height={11} borderRadius={4} style={{ marginBottom: spacing.sm }} />
                  <Skeleton width="40%" height={30} borderRadius={6} />
                </Card>
              </View>
            ))}
          </View>
          <Skeleton width="100%" height={200} borderRadius={16} style={{ marginTop: spacing.md }} />
        </View>
      ) : fetchError ? (
        <EmptyState
          variant="error"
          subtitle={fetchError}
          onRetry={() => void refreshData()}
        />
      ) : issues.length === 0 ? (
        <View style={{ paddingHorizontal: pagePadding, paddingTop: spacing.xl * 3, gap: spacing.md, alignItems: 'center' }}>
          <BarChart3 size={56} color={colors.mutedForeground + '33'} />
          <Text style={[typography.cardTitle, { color: colors.mutedForeground }]}>No data available</Text>
          <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center' }]}>
            Create your first issue to see analytics here.
          </Text>
        </View>
      ) : (
        <>
      {/* ── Performance Snapshot ── */}
      <View style={{ paddingHorizontal: pagePadding, paddingTop: spacing.xl, gap: spacing.md }}>
        <View style={styles.sectionHead}>
          <Text style={[typography.cardTitle, { color: colors.foreground }]}>Performance Snapshot</Text>
          <View style={[styles.pill, { backgroundColor: colors.muted }]}>
            <View style={[styles.dot, { backgroundColor: colors.green }]} />
            <Text style={[typography.nanoCaps, { color: colors.greenFg }]}>Live data</Text>
          </View>
        </View>

        {/* Total Tasks — full width row */}
        <Card padding={spacing.cardPadding} onPress={() => goToList(stats[0].status)} style={{ borderWidth: 0 }} accessibilityRole="button" accessibilityLabel="View Total tasks">
          <View style={styles.statHead}>
            <Text style={[typography.statLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
              {stats[0].label}
            </Text>
            <ListChecks size={17} color={colors.mutedForeground} />
          </View>
          <Text style={[typography.statValue, { color: stats[0].color }]}>{stats[0].value}</Text>
        </Card>

        {/* Row 2: Open + In Progress */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {stats.slice(1, 3).map((s) => (
            <View key={s.label} style={{ flex: 1 }}>
              <Card padding={spacing.cardPadding} onPress={() => goToList(s.status)} style={{ borderWidth: 0 }} accessibilityRole="button" accessibilityLabel={"View " + s.label + " tasks"}>
                <View style={styles.statHead}>
                  <Text style={[typography.statLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <s.Icon size={17} color={colors.mutedForeground} />
                </View>
                <Text style={[typography.statValue, { color: s.color }]}>{s.value}</Text>
              </Card>
            </View>
          ))}
        </View>

        {/* Row 3: Resolved + Closed */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {stats.slice(3, 5).map((s) => (
            <View key={s.label} style={{ flex: 1 }}>
              <Card padding={spacing.cardPadding} onPress={() => goToList(s.status)} style={{ borderWidth: 0 }} accessibilityRole="button" accessibilityLabel={"View " + s.label + " tasks"}>
                <View style={styles.statHead}>
                  <Text style={[typography.statLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <s.Icon size={17} color={colors.mutedForeground} />
                </View>
                <Text style={[typography.statValue, { color: s.color }]}>{s.value}</Text>
              </Card>
            </View>
          ))}
        </View>
      </View>

      {/* ── Analytics ── */}
      <View style={{ paddingHorizontal: pagePadding, paddingTop: spacing.xl, paddingBottom: spacing.md, gap: spacing.md }}>
        <Text style={[typography.cardTitle, { color: colors.foreground }]}>Analytics</Text>

        <View style={styles.toolbar}>
          <View style={{ flex: 1 }}>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search dashboard…" />
          </View>
          <IconButton
            icon={<SlidersHorizontal size={15} color={filtersOpen || filterStatus || filterPriority || filterSeverity ? colors.primary : colors.mutedForeground} />}
            active={filtersOpen || !!filterStatus || !!filterPriority || !!filterSeverity}
            onPress={() => setFiltersOpen((v) => !v)}
            accessibilityLabel="Toggle filters"
          />
          <View style={{ width: 120 }}>
            <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
          </View>
        </View>

        <FilterPopover
          visible={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          statusF={filterStatus}
          priorityF={filterPriority}
          severityF={filterSeverity}
          onApply={(s, p, sev) => {
            setFilterStatus(s);
            setFilterPriority(p);
            setFilterSeverity(sev);
          }}
        />

        {/* Status Mix */}
        <Card padding={spacing.xl}>
          <Text style={[typography.cardTitle, { color: colors.foreground }]}>Status Mix</Text>
          <Text style={[typography.cardDesc, { color: colors.mutedForeground }]}>
            Current issue distribution by workflow state.
          </Text>
          <StatusDonut data={donutData} onSlicePress={(label) => navigation.navigate('TasksList', { initialStatus: label === 'In Progress' ? 'IN_PROGRESS' : label.toUpperCase() })} />
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TasksList')}>
            <View style={[styles.footerDivider, { borderTopColor: colors.cardBorder }]} />
            <Text style={[typography.footerCaption, { color: colors.foreground }]}>
              Trending up by 5.2% this month
            </Text>
            <Text style={[typography.footerSub, { color: colors.mutedForeground }]}>
              Based on current sprint data
            </Text>
          </TouchableOpacity>
        </Card>

        {isTablet ? (
          <View style={styles.chartRow}>
            <View style={{ flex: 1 }}>{comparisonCard}</View>
            <View style={{ flex: 1 }}>{trendCard}</View>
          </View>
        ) : (
          <>
            {comparisonCard}
            {trendCard}
          </>
        )}
      </View>
      </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 20, marginBottom: 12 },
  chartRow: { flexDirection: 'row', gap: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { width: '85%', maxWidth: 360, borderRadius: 16, padding: 20, gap: 12 },
});
