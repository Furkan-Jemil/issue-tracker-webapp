import React, { useState, useCallback, useMemo } from 'react';
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
import { useResponsive } from '../responsive/useResponsive';
import { Screen, Card, IconButton, Select, Skeleton, FilterPopover, Button } from '../components/ui';
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

export default function DashboardScreen() {
  const { colors, spacing, typography, pagePadding } = useTheme();
  const { isTablet } = useResponsive();
  const navigation = useNavigation<any>();
  const { issues, isLoading, fetchError, refreshData } = useAppContext();

  const [range, setRange] = usePersistedState('dashboard_range', '30 days');
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = usePersistedState('dashboard_status', '');
  const [filterPriority, setFilterPriority] = usePersistedState('dashboard_priority', '');
  const [filterSeverity, setFilterSeverity] = usePersistedState('dashboard_severity', '');

  const activeFilterCount = [filterStatus, filterPriority, filterSeverity].filter(Boolean).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const day = 86400000;
  const rangeDays = { '7 days': 7, '30 days': 30, '90 days': 90, '1 year': 365 }[range] ?? 30;
  const cutoff = Date.now() - rangeDays * day;

   const filteredByTime = (issues as any[]).filter((i: any) => {
     const ts = i.created_at ?? i.createdAt;
     if (!ts) return false;
     const date = new Date(ts);
     return !isNaN(date.getTime()) && date.getTime() > cutoff;
   });

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

   const barData = useMemo(() => {
     if (!filtered.length) return [];
     const buckets = 3;
     const validDates = filtered.filter(i => {
       const date = new Date(i.created_at ?? i.createdAt);
       return !isNaN(date.getTime());
     });
     if (validDates.length === 0) return [];
     
     const minT = Math.min(...validDates.map((i) => new Date(i.created_at ?? i.createdAt).getTime()));
     const maxT = Math.max(...validDates.map((i) => new Date(i.created_at ?? i.createdAt).getTime()));
     const span = Math.max(maxT - minT, day);
     const bucketSize = span / buckets;
     return Array.from({ length: buckets }, (_, b) => {
       const lo = minT + b * bucketSize;
       const hi = lo + bucketSize;
       const inBucket = validDates.filter((i) => {
         const t = new Date(i.created_at ?? i.createdAt).getTime();
         return t >= lo && t < hi;
       });
       const label = `${new Date(lo).toLocaleDateString('en', { month: 'short', day: 'numeric' })}–${new Date(hi).toLocaleDateString('en', { day: 'numeric' })}`;
       return { label, open: inBucket.filter((i) => i.status === 'OPEN').length, closed: inBucket.filter((i) => i.status === 'CLOSED').length };
     });
   }, [filtered, day]);

   const trendData = useMemo(() => {
     if (!filtered.length) return [];
     const points = 4;
     const validDates = filtered.filter(i => {
       const date = new Date(i.created_at ?? i.createdAt);
       return !isNaN(date.getTime());
     });
     if (validDates.length === 0) return [];
     
     const minT = Math.min(...validDates.map((i) => new Date(i.created_at ?? i.createdAt).getTime()));
     const maxT = Math.max(...validDates.map((i) => new Date(i.created_at ?? i.createdAt).getTime()));
     const span = Math.max(maxT - minT, day);
     const step = span / (points - 1);
     return Array.from({ length: points }, (_, p) => {
       const t = minT + p * step;
       const label = new Date(t).toLocaleDateString('en', { month: 'short', day: 'numeric' });
       return { 
         label, 
         open: validDates.filter((i) => new Date(i.created_at ?? i.createdAt).getTime() <= t && i.status === 'OPEN').length, 
         prog: validDates.filter((i) => new Date(i.created_at ?? i.createdAt).getTime() <= t && i.status === 'IN_PROGRESS').length 
       };
     });
   }, [filtered, day]);

  const comparisonCard = (
    <Card padding={spacing.xl}>
      <Text style={[typography.cardTitle, { color: colors.foreground }]}>Monthly Comparison</Text>
      <Text style={[typography.cardDesc, { color: colors.mutedForeground }]}>
        Open versus closed issue volume by grouped date buckets.
      </Text>
      <ComparisonBars data={barData} onSegmentPress={(kind) => navigation.navigate('TasksList', { initialStatus: kind === 'open' ? 'OPEN' : 'CLOSED' })} />
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TasksList')} accessibilityRole="button" accessibilityLabel="View all issues">
        <View style={[styles.footerDivider, { borderTopColor: colors.cardBorder }]} />
        <Text style={[typography.footerCaption, { color: colors.primary }]}>
          View all issues →
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
      <TrendLine data={trendData} onSeriesPress={(series) => navigation.navigate('TasksList', { initialStatus: series === 'open' ? 'OPEN' : 'IN_PROGRESS' })} />
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TasksList')} accessibilityRole="button" accessibilityLabel="View all issues">
        <View style={[styles.footerDivider, { borderTopColor: colors.cardBorder }]} />
        <Text style={[typography.footerCaption, { color: colors.primary }]}>
          View all issues →
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
      ) : (
        // Note: we intentionally do NOT early-return on `issues.length === 0`.
        // The summary stat cards should always render (showing zeros), while the
        // charts below hide themselves when their data is empty.
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
          <IconButton
            icon={<SlidersHorizontal size={15} color={colors.mutedForeground} />}
            badge={activeFilterCount}
            badgeColor={colors.primary}
            onPress={() => setFiltersOpen((v) => !v)}
            accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          />
          <View style={{ flex: 1 }} />
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
            // FilterPopover emits 'all' for "no filter"; this screen uses '' as the
            // empty sentinel, so normalize here — otherwise 'all' is treated as a
            // real status value and filters every issue out.
            setFilterStatus(s === 'all' ? '' : s);
            setFilterPriority(p === 'all' ? '' : p);
            setFilterSeverity(sev === 'all' ? '' : sev);
          }}
        />

        {filtered.length === 0 ? (
          <Card padding={spacing.xl}>
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
              <BarChart3 size={40} color={colors.mutedForeground + '33'} />
              <Text style={[typography.detailValue, { color: colors.mutedForeground }]}>
                {issues.length === 0 ? 'No issues found' : 'No issues match these filters'}
              </Text>
              <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center' }]}>
                {issues.length === 0
                  ? 'Create your first issue to see analytics here.'
                  : activeFilterCount > 0
                  ? 'Adjust or clear the filters to see analytics.'
                  : 'No issues fall within the selected time range.'}
              </Text>
              {activeFilterCount > 0 && (
                <Button
                  title="Clear filters"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setFilterStatus('');
                    setFilterPriority('');
                    setFilterSeverity('');
                  }}
                />
              )}
            </View>
          </Card>
         ) : (
           <>
             {/* Status Mix - only show if we have data */}
             {donutData.some(d => d.value > 0) && (
               <Card padding={spacing.xl}>
                 <Text style={[typography.cardTitle, { color: colors.foreground }]}>Status Mix</Text>
                 <Text style={[typography.cardDesc, { color: colors.mutedForeground }]}>
                   Current issue distribution by workflow state.
                 </Text>
                 <StatusDonut data={donutData} onSlicePress={(label) => navigation.navigate('TasksList', { initialStatus: label === 'In Progress' ? 'IN_PROGRESS' : label.toUpperCase() })} />
                 <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TasksList')} accessibilityRole="button" accessibilityLabel="View all issues">
                   <View style={[styles.footerDivider, { borderTopColor: colors.cardBorder }]} />
                   <Text style={[typography.footerCaption, { color: colors.primary }]}>
                     View all issues →
                   </Text>
                 </TouchableOpacity>
               </Card>
             )}

             {isTablet ? (
               <View style={styles.chartRow}>
                 {barData.length > 0 && <View style={{ flex: 1 }}>{comparisonCard}</View>}
                 {trendData.length > 0 && <View style={{ flex: 1 }}>{trendCard}</View>}
               </View>
             ) : (
               <>
                 {barData.length > 0 && comparisonCard}
                 {trendData.length > 0 && trendCard}
               </>
             )}
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
