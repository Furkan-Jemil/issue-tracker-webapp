import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, EllipsisVertical, X, ListFilter } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { safeFetch } from '../utils/api';
import TopAppBar from '../components/TopAppBar';
import AnimatedEntry from '../components/AnimatedEntry';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PRIORITY_OPTIONS = ['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const;
const TYPE_OPTIONS = ['ALL', 'BUG', 'IMPROVEMENT'] as const;
const STATUS_OPTIONS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
const SEVERITY_OPTIONS = ['ALL', 'MINOR', 'MAJOR', 'CRITICAL'] as const;
const PAGE_SIZE = 10;

const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: ['OPEN'],
};

export default function TasksListScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { issues, isLoading, refreshData, user } = useAppContext();
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  const filteredIssues = useMemo(() => {
    let list = [...issues];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        const issue = item as any;
        return (
          (issue.title && issue.title.toLowerCase().includes(q)) ||
          (issue.id && issue.id.toLowerCase().includes(q))
        );
      });
    }
    if (filterPriority !== 'ALL') list = list.filter((item) => (item as any).priority === filterPriority);
    if (filterType !== 'ALL') list = list.filter((item) => (item as any).type === filterType);
    if (filterStatus !== 'ALL') list = list.filter((item) => (item as any).status === filterStatus);
    if (filterSeverity !== 'ALL') list = list.filter((item) => (item as any).severity === filterSeverity);
    return list;
  }, [issues, searchQuery, filterPriority, filterType, filterStatus, filterSeverity]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredIssues.length / PAGE_SIZE)), [filteredIssues.length]);
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageIssues = useMemo(
    () => filteredIssues.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filteredIssues, safePage],
  );

  const hasActiveFilters = filterPriority !== 'ALL' || filterType !== 'ALL' || filterStatus !== 'ALL' || filterSeverity !== 'ALL';

  const handleRowPress = useCallback((item: any) => {
    (navigation as any).navigate('TaskDetail', { issueId: item.id });
  }, [navigation]);

  const handleActionPress = useCallback((item: any) => {
    setSelectedIssue(item);
    setShowActionSheet(true);
  }, []);

  const handleStatusTransition = useCallback(async (newStatus: string) => {
    setShowActionSheet(false);
    try {
      await safeFetch(`/api/issues/${selectedIssue.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      refreshData();
    } catch {
      Alert.alert('Error', 'Failed to update issue status.');
    }
  }, [selectedIssue, refreshData]);

  const handleDelete = useCallback(() => {
    setShowActionSheet(false);
    Alert.alert('Delete Issue', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await safeFetch(`/api/issues/${selectedIssue.id}`, { method: 'DELETE' });
            refreshData();
          } catch {
            Alert.alert('Error', 'Failed to delete issue.');
          }
        },
      },
    ]);
  }, [selectedIssue, refreshData]);

  const isAdmin = user?.role === 'ADMIN';
  const onRefresh = useCallback(() => refreshData(), [refreshData]);

  const renderChip = (label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceContainerLow,
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.input,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[typography.labelBadge, { color: selected ? colors.onPrimary : colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <TopAppBar
        title="Issues"
        subtitle="Track, filter, and manage all tasks"
        onNotificationPress={() => (navigation as any).navigate('Notifications')}
        onProfilePress={() => (navigation as any).navigate('Profile')}
      />

      <View style={[styles.toolbar, { paddingHorizontal: spacing.pageMargin, gap: spacing.sm }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md }]}>
          <Search size={16} color={colors.onSurfaceVariant} style={{ marginLeft: spacing.sm }} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }, typography.bodySm]}
            placeholder="Search by title or ID..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: spacing.xs, marginRight: spacing.xs }}>
              <X size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: hasActiveFilters ? colors.primary : colors.surfaceContainerLow,
              borderRadius: radius.md,
            },
          ]}
          onPress={() => setShowFilterSheet(true)}
          activeOpacity={0.7}
        >
          <ListFilter size={18} color={hasActiveFilters ? colors.onPrimary : colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.pageMargin }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {hasActiveFilters && (
          <View style={[styles.filterBar, { marginTop: spacing.xs }]}>
            <Text style={[typography.micro, { color: colors.onSurfaceVariant }]}>
              {filteredIssues.length} result{filteredIssues.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={() => { setFilterPriority('ALL'); setFilterType('ALL'); setFilterStatus('ALL'); setFilterSeverity('ALL'); setSearchQuery(''); setCurrentPage(0); }}>
              <Text style={[typography.bodySmBold, { color: colors.primary }]}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {pageIssues.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Search size={40} color={colors.onSurfaceVariant} />}
            title="No Issues Found"
            subtitle={hasActiveFilters ? 'Try adjusting your filters.' : 'No issues yet. Create one to get started.'}
          />
        ) : (
          <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
            {pageIssues.map((item, idx) => {
              const issue = item as any;
              return (
                <AnimatedEntry key={issue.id} index={idx} delay={40}>
                  <TouchableOpacity
                    style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderRadius: radius.xl, padding: spacing.cardPadding, shadowColor: '#0b1c30', borderColor: colors.outlineVariant + '30', borderWidth: StyleSheet.hairlineWidth }]}
                    onPress={() => handleRowPress(issue)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={[typography.bodySmBold, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>
                        {issue.title ?? 'Untitled'}
                      </Text>
                      {isAdmin && (
                        <TouchableOpacity onPress={() => handleActionPress(issue)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <EllipsisVertical size={18} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={[typography.monoId, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
                      {issue.id}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
                      {issue.type && <StatusPill value={issue.type} type="type" />}
                      {issue.priority && <StatusPill value={issue.priority} type="priority" />}
                      {issue.status && <StatusPill value={issue.status} type="status" />}
                    </View>
                  </TouchableOpacity>
                </AnimatedEntry>
              );
            })}
          </View>
        )}

        {totalPages > 1 && (
          <View style={[styles.pagination, { borderTopColor: colors.surfaceContainer, marginTop: spacing.md }]}>
            <TouchableOpacity
              style={[styles.pageBtn, { opacity: safePage <= 0 ? 0.4 : 1 }]}
              onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={safePage <= 0}
            >
              <ChevronLeft size={16} color={colors.primary} />
              <Text style={[typography.bodySmBold, { color: colors.primary, marginLeft: spacing.xs }]}>Prev</Text>
            </TouchableOpacity>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
              Page {safePage + 1} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageBtn, { opacity: safePage >= totalPages - 1 ? 0.4 : 1 }]}
              onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              <Text style={[typography.bodySmBold, { color: colors.primary, marginRight: spacing.xs }]}>Next</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Filter bottom sheet ── */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFilterSheet(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.surfaceContainerHighest }]} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.sectionHeading, { color: colors.onSurface }]}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterSheet(false)}>
                <X size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetBody}>
              <Text style={[typography.nanoCaps, { color: colors.onSurfaceVariant, marginBottom: spacing.sm, marginTop: spacing.md }]}>Priority</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {PRIORITY_OPTIONS.map((opt) => renderChip(opt, filterPriority === opt, () => setFilterPriority(opt)))}
              </View>
              <Text style={[typography.nanoCaps, { color: colors.onSurfaceVariant, marginBottom: spacing.sm, marginTop: spacing.md }]}>Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {TYPE_OPTIONS.map((opt) => renderChip(opt, filterType === opt, () => setFilterType(opt)))}
              </View>
              <Text style={[typography.nanoCaps, { color: colors.onSurfaceVariant, marginBottom: spacing.sm, marginTop: spacing.md }]}>Status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {STATUS_OPTIONS.map((opt) => renderChip(opt, filterStatus === opt, () => setFilterStatus(opt)))}
              </View>
              <Text style={[typography.nanoCaps, { color: colors.onSurfaceVariant, marginBottom: spacing.sm, marginTop: spacing.md }]}>Severity</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {SEVERITY_OPTIONS.map((opt) => renderChip(opt, filterSeverity === opt, () => setFilterSeverity(opt)))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.primaryContainer, borderRadius: radius.md, margin: spacing.pageMargin }]}
              onPress={() => setShowFilterSheet(false)}
              activeOpacity={0.8}
            >
              <Text style={[typography.bodySmBold, { color: colors.onPrimaryContainer, textAlign: 'center' }]}>Apply</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Action bottom sheet ── */}
      <Modal visible={showActionSheet} transparent animationType="slide" onRequestClose={() => setShowActionSheet(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowActionSheet(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.surfaceContainerHighest }]} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.sectionHeading, { color: colors.onSurface }]}>Actions</Text>
              <TouchableOpacity onPress={() => setShowActionSheet(false)}>
                <X size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              {selectedIssue && STATUS_TRANSITIONS[selectedIssue.status]?.length > 0 && (
                <>
                  <Text style={[typography.nanoCaps, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}>Change Status</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
                    {STATUS_TRANSITIONS[selectedIssue.status].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[styles.chip, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.input }]}
                        onPress={() => handleStatusTransition(status)}
                        activeOpacity={0.7}
                      >
                        <Text style={[typography.labelBadge, { color: colors.onSurface }]}>{status.replace('_', ' ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <TouchableOpacity style={[styles.actionRow, { borderTopColor: colors.surfaceContainer }]} onPress={() => { setShowActionSheet(false); (navigation as any).navigate('CreateTask', { editId: selectedIssue?.id }); }}>
                <Text style={[typography.bodySmBold, { color: colors.onSurface }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionRow, { borderTopColor: colors.surfaceContainer }]} onPress={handleDelete}>
                <Text style={[typography.bodySmBold, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md, margin: spacing.pageMargin }]} onPress={() => setShowActionSheet(false)} activeOpacity={0.8}>
              <Text style={[typography.bodySmBold, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  card: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  chip: {
    marginBottom: 4,
  },
  applyBtn: {
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
