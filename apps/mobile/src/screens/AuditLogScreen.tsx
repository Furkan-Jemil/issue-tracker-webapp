import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
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
  Search,
  SlidersHorizontal,
  Check,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { loadToken } from '../utils/secureStore';
const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
import { Screen, Card, SearchOverlay, IconButton, AnimatedEntry, Skeleton, Button } from '../components/ui';
import { getInitials, relativeTime } from '../utils/formatters';

const FILTER_OPTIONS = [
  'All', 'Created', 'Status', 'Priority', 'Assignee', 'Other',
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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { auditLogs, isLoading, refreshData, members } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, []);

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
      if (filterType === 'Other') {
        const otherTypes = ['COMMENT_ADDED', 'SEVERITY_CHANGED', 'TYPE_CHANGED'];
        list = list.filter((item) => otherTypes.includes(item.eventType ?? item.type));
      } else {
        const typeMap: Record<string, string> = {
          Created: 'CREATED',
          Status: 'STATUS_CHANGED',
          Priority: 'PRIORITY_CHANGED',
          Assignee: 'ASSIGNEE_CHANGED',
        };
        const match = typeMap[filterType];
        if (match) {
          list = list.filter((item) => item.eventType === match || item.type === match);
        }
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
      const token = await loadToken();
      const res = await fetch(`${API_BASE}/api/audit-log/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
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
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AuditDetail', { entry: item })}
        accessibilityRole="button"
        accessibilityLabel={`Open audit entry: ${event.label}`}
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
      </TouchableOpacity>
    );
  };

  return (
    <Screen title="Audit Log" subtitle="Track all changes and activities" scroll={false}>
      {/* Filter / Search / Export toolbar */}
      <View
        style={[
          styles.searchRow,
          { paddingHorizontal: pagePadding, paddingTop: spacing.md, marginBottom: spacing.elementGap, gap: spacing.elementGap },
        ]}
      >
        <IconButton
          icon={<SlidersHorizontal size={16} color={filterType !== 'All' ? colors.primary : colors.mutedForeground} />}
          accessibilityLabel="Filter log entries"
          onPress={() => setFilterOpen(true)}
        />
        <View style={{ flex: 1 }} />
        <IconButton
          icon={<Search size={16} color={colors.mutedForeground} />}
          accessibilityLabel="Search log entries"
          onPress={() => setSearchOpen(true)}
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

      {/* Search overlay */}
      <SearchOverlay
        visible={searchOpen}
        onClose={closeSearch}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search log entries…"
        prompt="Search the audit log"
        resultCount={filteredLogs.length}
      >
        {filteredLogs.slice(0, 40).map((item: any) => {
          const event = getEventBadge(colors, item.eventType ?? item.type ?? '');
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => { closeSearch(); navigation.navigate('AuditDetail', { entry: item }); }}
              accessibilityRole="button"
              accessibilityLabel={`Open audit entry: ${event.label}`}
              style={[styles.resultRow, { borderBottomColor: colors.cardBorder }]}
            >
              <View style={[styles.resultDot, { backgroundColor: event.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.micro, { color: event.color, fontWeight: '700' }]}>{event.label}</Text>
                <Text numberOfLines={2} style={[typography.bodySm, { color: colors.foreground, marginTop: 2 }]}>
                  {item.description ?? item.message ?? ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </SearchOverlay>

      {/* Filter modal */}
      <Modal transparent visible={filterOpen} animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <View style={[filterStyles.overlay, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setFilterOpen(false)} accessibilityRole="button" accessibilityLabel="Close filters" />
          <View style={[filterStyles.card, { backgroundColor: colors.card, borderRadius: radius.xl, marginHorizontal: spacing.lg }]}>
            <Text style={[typography.cardTitle, { color: colors.foreground, marginBottom: spacing.md }]}>Filter by Event</Text>
            <View style={{ gap: spacing.xs }}>
              {FILTER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    filterStyles.option,
                    {
                      backgroundColor: filterType === opt ? colors.primary + '15' : 'transparent',
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.elementGap,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                  onPress={() => {
                    setFilterType(opt);
                    setFilterOpen(false);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${opt}`}
                >
                  <View style={[filterStyles.radio, {
                    borderColor: filterType === opt ? colors.primary : colors.outlineVariant,
                    backgroundColor: filterType === opt ? colors.primary : 'transparent',
                  }]}>
                    {filterType === opt && <Check size={12} color="#fff" />}
                  </View>
                  <Text style={[typography.bodySm, { color: filterType === opt ? colors.foreground : colors.onSurfaceVariant }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  resultDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  exportBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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

const filterStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', paddingHorizontal: 16 },
  card: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 20, marginTop: 40 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
