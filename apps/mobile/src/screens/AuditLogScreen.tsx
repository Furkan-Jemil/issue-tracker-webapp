import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Download,
  FilePlus,
  History,
  MessageSquare,
  UserCheck,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { safeFetch } from '../utils/api';
import { Screen, Card, SearchBar, AnimatedEntry, Skeleton } from '../components/ui';
import { getInitials, relativeTime } from '../utils/formatters';

const FILTER_OPTIONS = [
  'All', 'Created', 'Status', 'Comment', 'Priority', 'Assignee', 'Severity', 'Type',
] as const;

function getEventBadge(colors: any, type: string) {
  switch (type) {
    case 'CREATED':
      return { icon: FilePlus, color: colors.primary, label: 'Created' };
    case 'STATUS_CHANGED':
      return { icon: History, color: colors.error, label: 'Status Changed' };
    case 'COMMENT_ADDED':
      return { icon: MessageSquare, color: colors.onSurfaceVariant, label: 'Comment Added' };
    case 'PRIORITY_CHANGED':
      return { icon: AlertTriangle, color: colors.chartOpen, label: 'Priority Changed' };
    case 'ASSIGNEE_CHANGED':
      return { icon: UserCheck, color: colors.chartResolved, label: 'Assignee Changed' };
    case 'SEVERITY_CHANGED':
      return { icon: AlertTriangle, color: colors.error, label: 'Severity Changed' };
    case 'TYPE_CHANGED':
      return { icon: Sparkles, color: colors.chartInProgress, label: 'Type Changed' };
    default:
      return {
        icon: History,
        color: colors.onSurfaceVariant,
        label: type.replace(/_/g, ' '),
      };
  }
}

export default function AuditLogScreen() {
  const { colors, typography, spacing, radius, pagePadding } = useTheme();
  const { auditLogs, isLoading, refreshData, members } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  const memberMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of members) {
      map[m.id] = m;
    }
    return map;
  }, [members]);

  const filteredLogs = useMemo(() => {
    let list = [...auditLogs] as any[];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        const text = item.description ?? item.message ?? '';
        return text.toLowerCase().includes(q);
      });
    }

    if (filterType !== 'All') {
      const typeMap: Record<string, string> = {
        Created: 'CREATED',
        Status: 'STATUS_CHANGED',
        Comment: 'COMMENT_ADDED',
        Priority: 'PRIORITY_CHANGED',
        Assignee: 'ASSIGNEE_CHANGED',
        Severity: 'SEVERITY_CHANGED',
        Type: 'TYPE_CHANGED',
      };
      const match = typeMap[filterType];
      if (match) {
        list = list.filter((item) => item.eventType === match || item.type === match);
      }
    }

    list.sort(
      (a, b) =>
        new Date(b.createdAt ?? b.timestamp ?? 0).getTime() -
        new Date(a.createdAt ?? a.timestamp ?? 0).getTime(),
    );

    return list;
  }, [auditLogs, searchQuery, filterType]);

  const handleExport = useCallback(async () => {
    try {
      await safeFetch('/api/audit-log/export');
    } catch {
      Alert.alert('Error', 'Failed to export audit log. Please try again.');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const renderLogEntry = ({ item, index }: { item: any; index: number }) => {
    const event = getEventBadge(colors, item.eventType ?? item.type ?? '');
    const EventIcon = event.icon;
    const userId = item.userId ?? item.user?.id ?? item.createdBy;
    const member = memberMap[userId];
    const initials = getInitials(member?.name, member?.email);

    return (
      <View
        style={[
          styles.logCard,
          {
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            borderColor: colors.cardBorder,
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.logEntryRow}>
          <View style={[styles.timelineCol, { marginRight: spacing.md }]}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: event.color + '20', borderRadius: radius.full },
              ]}
            >
              <Text style={[typography.micro, { color: event.color, fontWeight: '700' }]}>
                {initials}
              </Text>
            </View>
            <View style={[styles.timelineLine, { backgroundColor: colors.cardBorder, marginTop: spacing.xs }]} />
          </View>
          <View style={[styles.logContent, { paddingBottom: spacing.elementGap, marginLeft: spacing.xs }]}>
            <View
              style={[
                styles.eventBadge,
                {
                  backgroundColor: event.color + '15',
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 3,
                  alignSelf: 'flex-start',
                },
              ]}
            >
              <EventIcon size={12} color={event.color} />
              <Text
                style={[
                  typography.micro,
                  { color: event.color, fontWeight: '700', marginLeft: spacing.xs },
                ]}
              >
                {event.label}
              </Text>
            </View>
            <Text
              style={[typography.bodySm, { color: colors.foreground, marginTop: spacing.xs }]}
              numberOfLines={3}
            >
              {item.description ?? item.message ?? ''}
            </Text>
            <Text style={[typography.micro, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
              {relativeTime(item.createdAt ?? item.timestamp ?? new Date())}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Screen title="Audit Log" subtitle="Track all changes and activities" scroll={false}>
      {/* Search + export */}
      <View
        style={[
          styles.searchRow,
          { paddingHorizontal: pagePadding, paddingTop: spacing.md, marginBottom: spacing.elementGap, gap: spacing.elementGap },
        ]}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search log entries…"
        />
        <TouchableOpacity
          style={[
            styles.exportBtn,
            {
              backgroundColor: colors.muted,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={handleExport}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Export audit log"
        >
          <Download size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={[styles.chipRow, { paddingHorizontal: pagePadding, gap: spacing.xs, marginBottom: spacing.elementGap }]}>
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.chip,
              {
                backgroundColor: filterType === opt ? colors.primary : colors.surfaceContainerLow,
                borderRadius: radius.full,
                paddingHorizontal: spacing.elementGap,
                paddingVertical: spacing.xs,
                borderWidth: 1,
                borderColor: filterType === opt ? colors.primary : colors.outlineVariant,
                marginBottom: spacing.xs,
              },
            ]}
            onPress={() => setFilterType(opt)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${opt}`}
          >
            <Text
              style={[
                typography.bodySmBold,
                { color: filterType === opt ? colors.onPrimary : colors.onSurfaceVariant },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={[styles.listContent, { paddingHorizontal: pagePadding, paddingTop: spacing.xs, gap: spacing.xs }]}>
          {[1,2,3,4].map((i) => (
            <Card key={i} padding={20}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Skeleton width={36} height={36} borderRadius={18} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Skeleton width="30%" height={10} borderRadius={4} />
                  <Skeleton width="90%" height={10} borderRadius={4} />
                  <Skeleton width="20%" height={8} borderRadius={4} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : (
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogEntry}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: pagePadding, paddingBottom: 120, paddingTop: spacing.xs },
        ]}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <AnimatedEntry>
              <View style={[styles.empty, { gap: spacing.md }]}>
                <History size={40} color={colors.mutedForeground + '40'} />
                <Text style={[typography.sectionHeading, { color: colors.mutedForeground }]}>
                  No Log Entries
                </Text>
                <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center' }]}>
                  {searchQuery || filterType !== 'All'
                    ? 'Try adjusting your search or filters.'
                    : 'Audit log entries will appear here.'}
                </Text>
              </View>
            </AnimatedEntry>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
      />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  exportBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
  listContent: { flexGrow: 1 },
  logCard: {
    padding: 20,
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  logEntryRow: { flexDirection: 'row' },
  timelineCol: { alignItems: 'center', width: 36 },
  avatar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1 },
  logContent: { flex: 1 },
  eventBadge: { flexDirection: 'row', alignItems: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
});
