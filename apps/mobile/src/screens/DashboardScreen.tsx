import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  ListChecks,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { useResponsive } from '../responsive/useResponsive';
import Grid from '../responsive/Grid';
import { Screen, Card, SearchBar, IconButton, Select } from '../components/ui';
import StatusDonut from '../charts/StatusDonut';
import ComparisonBars from '../charts/ComparisonBars';
import TrendLine from '../charts/TrendLine';

const RANGE_OPTIONS = [
  { value: '7 days', label: '7 days' },
  { value: '30 days', label: '30 days' },
  { value: '90 days', label: '90 days' },
  { value: '1 year', label: '1 year' },
];

export default function DashboardScreen() {
  const { colors, pagePadding } = useTheme();
  const { isTablet } = useResponsive();
  const { issues } = useAppContext();

  const [search, setSearch] = useState('');
  const [range, setRange] = useState('30 days');

  const total = issues.length;
  const open = issues.filter((i) => i.status === 'OPEN').length;
  const inProgress = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolved = issues.filter((i) => i.status === 'RESOLVED').length;
  const closed = issues.filter((i) => i.status === 'CLOSED').length;

  const stats = [
    { label: 'Total tasks', value: total, Icon: ListChecks, color: colors.chart1 },
    { label: 'Open', value: open, Icon: AlertCircle, color: colors.chart1 },
    { label: 'In progress', value: inProgress, Icon: Clock, color: colors.chart2 },
    { label: 'Resolved', value: resolved, Icon: CheckCircle2, color: colors.chart1 },
    { label: 'Closed', value: closed, Icon: XCircle, color: colors.chart5 },
  ];

  const donutData = [
    { label: 'Open', value: open, color: colors.chartOpen },
    { label: 'In Progress', value: inProgress, color: colors.chartInProgress },
    { label: 'Resolved', value: resolved, color: colors.chartResolved },
    { label: 'Closed', value: closed, color: colors.chartClosed },
  ];

  const barData = [
    { label: 'May 20–25', open: 0, closed: 0 },
    { label: 'Jun 1–6', open: 1, closed: 0 },
    { label: 'Jun 13–18', open: Math.min(open, 3), closed: 1 },
  ];

  const trendData = [
    { label: 'May 20', open: 0, prog: 0 },
    { label: 'Jun 1', open: 0, prog: 0 },
    { label: 'Jun 13', open: 2, prog: 1 },
    { label: 'Jun 17', open: Math.max(0, open - 1), prog: 1 },
  ];

  const comparisonCard = (
    <Card padding={20}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>Monthly Comparison</Text>
      <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
        Open versus closed issue volume by grouped date buckets.
      </Text>
      <ComparisonBars data={barData} />
    </Card>
  );

  const trendCard = (
    <Card padding={20}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>Issue Trend</Text>
      <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
        Open and in-progress issues across the selected range.
      </Text>
      <TrendLine data={trendData} />
    </Card>
  );

  return (
    <Screen title="Dashboard" subtitle="Live operational overview · Ethio Telecom">
      {/* ── Performance Snapshot ── */}
      <View style={{ paddingHorizontal: pagePadding, paddingTop: 20, gap: 12 }}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Performance Snapshot</Text>
          <View style={[styles.pill, { backgroundColor: colors.muted }]}>
            <View style={[styles.dot, { backgroundColor: colors.green }]} />
            <Text style={[styles.pillText, { color: colors.greenFg }]}>Live data</Text>
          </View>
        </View>

        <Grid columns={isTablet ? 3 : 2}>
          {stats.map((s) => (
            <Card key={s.label} padding={16}>
              <View style={styles.statHead}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {s.label}
                </Text>
                <s.Icon size={17} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </Card>
          ))}
        </Grid>
      </View>

      {/* ── Analytics ── */}
      <View style={{ paddingHorizontal: pagePadding, paddingTop: 24, paddingBottom: 12, gap: 12 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Analytics</Text>

        <View style={styles.toolbar}>
          <View style={{ flex: 1 }}>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search dashboard…" />
          </View>
          <IconButton icon={<SlidersHorizontal size={15} color={colors.mutedForeground} />} />
          <View style={{ width: 120 }}>
            <Select value={range} options={RANGE_OPTIONS} onChange={setRange} />
          </View>
        </View>

        {/* Status Mix */}
        <Card padding={20}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Status Mix</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
            Current issue distribution by workflow state.
          </Text>
          <StatusDonut data={donutData} />
          <Text style={[styles.footerCaption, { color: colors.foreground }]}>
            Trending up by 5.2% this month
          </Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: 'Outfit_600SemiBold', fontSize: 10 },
  statHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { fontFamily: 'Outfit_500Medium', fontSize: 11, flex: 1, marginRight: 6 },
  statValue: { fontFamily: 'Outfit_700Bold', fontSize: 30, lineHeight: 34 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14 },
  cardDesc: { fontFamily: 'Outfit_400Regular', fontSize: 11, marginTop: 2, marginBottom: 16 },
  footerCaption: { fontFamily: 'Outfit_700Bold', fontSize: 12, textAlign: 'center', marginTop: 16 },
  chartRow: { flexDirection: 'row', gap: 12 },
});
