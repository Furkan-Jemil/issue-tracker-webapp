import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Alert, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SlidersHorizontal, Search, Plus, ChevronLeft, ChevronRight, ClipboardList, MoreVertical, Edit3, Trash2, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { useResponsive } from '../responsive/useResponsive';
import Grid from '../responsive/Grid';
import { relativeTime, shortId } from '../utils/formatters';
import usePersistedState from '../utils/usePersistedState';
import useDebounce from '../utils/useDebounce';
import { Screen, Card, Badge, Avatar, Button, SearchOverlay, IconButton, AnimatedEntry, Skeleton, FilterPopover, ContextualPopover, ContextualAnchor } from '../components/ui';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface Issue {
  id: string;
  title: string;
  status: Status;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  type: 'BUG' | 'IMPROVEMENT' | 'FEATURE' | 'TASK';
  reporter: string;
  assignee?: string;
  created_at: string;
}

const PER = 8;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];
const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];
const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severity' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'MINOR', label: 'Minor' },
];

const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['OPEN'],
};

export default function TasksListScreen() {
  const { colors, spacing, typography } = useTheme();
  const { isTablet } = useResponsive();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { issues, isLoading, fetchError, deleteIssue, updateIssue, refreshData } = useAppContext();
  const { showToast } = useToast();

  const [search, setSearch] = usePersistedState('tasks_search', '');
  const debouncedSearch = useDebounce(search, 300);
  const [statusF, setStatusF] = usePersistedState('tasks_status', 'all');
  const [priorityF, setPriorityF] = usePersistedState('tasks_priority', 'all');
  const [severityF, setSeverityF] = usePersistedState('tasks_severity', 'all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [page, setPage] = useState(0);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearch('');
    resetPage();
  };

  const activeCount = [statusF, priorityF, severityF].filter((f) => f !== 'all').length;

  const [menuIssue, setMenuIssue] = useState<Issue | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<any>(null);

  const openMenu = (issue: Issue, rect: any) => {
    setMenuAnchor(rect);
    setMenuIssue(issue);
    setMenuVisible(true);
  };

  const handleEdit = () => {
    if (!menuIssue) return;
    setMenuVisible(false);
    navigation.navigate('CreateTask', { issue: menuIssue });
  };

  const handleStatusChange = async (status: Status) => {
    if (!menuIssue) return;
    const target = menuIssue;
    setMenuVisible(false);
    try {
      await updateIssue(target.id, { status });
      showToast({ message: `${shortId(target.id)} moved to ${status.replace('_', ' ')}`, type: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'Failed to update status', type: 'error' });
    }
  };

  const handleDelete = () => {
    if (!menuIssue) return;
    setMenuVisible(false);
    Alert.alert('Delete Issue', `Delete ${shortId(menuIssue.id)}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIssue(menuIssue.id);
            showToast({ message: `${shortId(menuIssue.id)} deleted.`, type: 'success' });
          } catch (err) {
            showToast({
              message: err instanceof Error ? err.message : 'Failed to delete issue',
              type: 'error',
            });
          }
        },
      },
    ]);
  };

  useEffect(() => {
    const initialStatus = (route.params as any)?.initialStatus;
    if (initialStatus && typeof initialStatus === 'string') {
      setStatusF(initialStatus);
    }
  }, [(route.params as any)?.initialStatus]);

  const filtered = useMemo<Issue[]>(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const minMet = q.length === 0 || q.length >= 2;
    return (issues as unknown as Issue[]).filter((i) => {
      const matchesSearch = !minMet || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (statusF === 'all' || i.status === statusF) &&
        (priorityF === 'all' || i.priority === priorityF) &&
        (severityF === 'all' || i.severity === severityF)
      );
    });
  }, [issues, debouncedSearch, statusF, priorityF, severityF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PER, (safePage + 1) * PER);

  const resetPage = () => setPage(0);
  const openDetail = (issue: Issue) => navigation.navigate('TaskDetail', { issueId: issue.id });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const clearFilters = () => {
    setStatusF('all');
    setPriorityF('all');
    setSeverityF('all');
    resetPage();
  };

  const handleSwipeDelete = (issue: Issue) => {
    Alert.alert('Delete Issue', `Delete ${shortId(issue.id)}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteIssue(issue.id); } catch { Alert.alert('Error', 'Failed to delete issue'); }
      }},
    ]);
  };

  const renderListCard = (issue: Issue, index: number) => (
    <AnimatedEntry key={issue.id} index={index}>
        <Card padding={spacing.md}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${issue.title}`} activeOpacity={0.85} onPress={() => openDetail(issue)}>
          <Text numberOfLines={2} style={[typography.bodySmBold, { color: colors.foreground }]}>
            {issue.title}
          </Text>
          <Text style={[typography.monoId, styles.monoId, { color: colors.mutedForeground }]}>{shortId(issue.id)}</Text>
          <View style={[styles.badgeRow, { gap: spacing.iconGap, marginTop: spacing.sm }]}>
            <Badge kind="type" value={issue.type} />
            <Badge kind="status" value={issue.status} />
            <Badge kind="priority" value={issue.priority} />
          </View>
        </TouchableOpacity>
        <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder, marginTop: spacing.md, paddingTop: spacing.sm }]}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${issue.title}`} activeOpacity={0.85} onPress={() => openDetail(issue)} style={{ flex: 1 }}>
            <View style={[styles.footerLeft, { gap: spacing.iconGap, marginRight: spacing.sm }]}>
              <Avatar size="xs" name={issue.assignee} />
              <Text numberOfLines={1} style={[typography.cardDesc, { color: colors.mutedForeground }]}>
                {issue.assignee ?? 'Unassigned'}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.iconGap }}>
            <Text style={[typography.cardDesc, { color: colors.mutedForeground }]}>
              {relativeTime(issue.created_at)}
            </Text>
            <ContextualAnchor accessibilityRole="button" accessibilityLabel={`More actions for ${issue.title}`} onPressAnchor={(rect) => openMenu(issue, rect)} hitSlop={8} style={styles.menuBtn}>
              <MoreVertical size={14} color={colors.mutedForeground} />
            </ContextualAnchor>
          </View>
        </View>
      </Card>
    </AnimatedEntry>
  );

  return (
    <Screen
      title="Issues"
      subtitle="Track, filter, and manage all open tasks"
      scroll
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Toolbar: Filter, Search, and Create (mobile-first, card layout only) */}
      <View style={[styles.toolbar, { paddingHorizontal: isTablet ? 24 : 16, gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.xs, flexDirection: 'row', alignItems: 'center' }]}>
        <IconButton
          icon={<SlidersHorizontal size={15} color={colors.mutedForeground} />}
          badge={activeCount}
          badgeColor={colors.primary}
          accessibilityLabel={`Filters${activeCount > 0 ? `, ${activeCount} active` : ''}`}
          onPress={() => setFiltersOpen((v) => !v)}
        />
        <View style={{ flex: 1 }} />
        <IconButton
          icon={<Search size={16} color={colors.mutedForeground} />}
          accessibilityLabel="Search issues"
          onPress={() => setSearchOpen(true)}
        />
        <Button
          title="Create"
          size="sm"
          icon={<Plus size={14} color="#fff" />}
          onPress={() => navigation.navigate('CreateTask')}
        />
      </View>

      {/* Search overlay */}
      <SearchOverlay
        visible={searchOpen}
        onClose={closeSearch}
        value={search}
        onChangeText={(v) => { setSearch(v); resetPage(); }}
        placeholder="Search by title or ID…"
        prompt="Search issues by title or ID"
        resultCount={filtered.length}
      >
        {filtered.slice(0, 30).map((issue) => (
          <TouchableOpacity
            key={issue.id}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Open ${issue.title}`}
            style={[styles.resultRow, { borderBottomColor: colors.cardBorder }]}
            onPress={() => { closeSearch(); openDetail(issue); }}
          >
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[typography.bodySmBold, { color: colors.foreground }]}>{issue.title}</Text>
              <Text style={[typography.monoId, { color: colors.mutedForeground, marginTop: 2 }]}>{shortId(issue.id)}</Text>
            </View>
            <Badge kind="status" value={issue.status} />
          </TouchableOpacity>
        ))}
      </SearchOverlay>

      {/* Filters popover */}
      <FilterPopover
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        statusF={statusF}
        priorityF={priorityF}
        severityF={severityF}
        onApply={(s, p, sev) => {
          setStatusF(s);
          setPriorityF(p);
          setSeverityF(sev);
          resetPage();
        }}
      />

      {/* Error state — shown when API fetch fails */}
      {fetchError && !isLoading ? (
        <EmptyState
          variant="error"
          subtitle={fetchError}
          onRetry={() => void refreshData()}
        />
      ) : isLoading ? (
        <View style={[styles.listWrap, { paddingHorizontal: isTablet ? 24 : 16, paddingTop: spacing.md, gap: spacing.md }]}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} padding={spacing.cardPadding}>
              <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: spacing.xs }} />
              <Skeleton width="40%" height={10} borderRadius={4} style={{ marginBottom: spacing.sm }} />
              <View style={{ flexDirection: 'row', gap: spacing.iconGap }}>
                <Skeleton width={50} height={18} borderRadius={4} />
                <Skeleton width={60} height={18} borderRadius={4} />
              </View>
            </Card>
          ))}
        </View>
      ) : (
      <>
        <View style={[styles.listWrap, { paddingHorizontal: isTablet ? 24 : 16, paddingTop: spacing.md }]}>
          {paged.length === 0 ? (
            <View style={[styles.empty, { gap: spacing.md }]}>
              <ClipboardList size={48} color={colors.mutedForeground + '33'} />
              <Text style={[typography.detailValue, { color: colors.mutedForeground }]}>
                {activeCount > 0 || search ? 'No issues found' : 'No issues yet'}
              </Text>
              <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center' }]}>
                {activeCount > 0 || search
                  ? 'Try adjusting your search or filters.'
                  : "You haven't created any issues yet. Create your first issue to start reporting and tracking your work."}
              </Text>
              {!(activeCount > 0 || search) && (
                <Button
                  title="Create Issue"
                  icon={<Plus size={14} color="#fff" />}
                  onPress={() => navigation.navigate('CreateTask')}
                />
              )}
            </View>
          ) : isTablet ? (
            <Grid columns={2} gap={spacing.md}>
              {paged.map((issue, index) => renderListCard(issue, index))}
            </Grid>
          ) : (
            <View style={{ gap: spacing.md }}>{paged.map((issue, index) => renderListCard(issue, index))}</View>
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
          <View style={[styles.pagination, { marginTop: spacing.lg, gap: spacing.sm }]}>
            <Text style={[typography.micro, { color: colors.mutedForeground }]}>
              Page {safePage + 1} of {totalPages} · {filtered.length} issues
            </Text>
            <View style={[styles.pageBtns, { gap: spacing.sm }]}>
              <Button
                title="Prev"
                variant="outline"
                size="sm"
                disabled={safePage <= 0}
                icon={<ChevronLeft size={14} color={colors.foreground} />}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
              />
              <Button
                title="Next"
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages - 1}
                icon={<ChevronRight size={14} color={colors.foreground} />}
                onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              />
            </View>
          </View>
          )}
        </View>
      </>
      )}

      {/* Action menu modal */}
      <ContextualPopover
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        anchorRect={menuAnchor}
        width={200}
      >
        <View style={{ padding: spacing.sm }}>
          <Text style={[typography.labelBadge, { color: colors.mutedForeground, marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]}>
            {menuIssue?.id ? shortId(menuIssue.id) : ''}
          </Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit issue" style={styles.menuItem} onPress={handleEdit}>
            <Edit3 size={16} color={colors.foreground} />
            <Text style={[typography.bodySm, { color: colors.foreground, marginLeft: spacing.sm }]}>Edit</Text>
          </TouchableOpacity>
          {menuIssue && STATUS_TRANSITIONS[menuIssue.status]?.map((s) => (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Move to ${s.replace('_', ' ')}`} key={s} style={styles.menuItem} onPress={() => handleStatusChange(s as Status)}>
              <ArrowRight size={16} color={colors.foreground} />
              <Text style={[typography.bodySm, { color: colors.foreground, marginLeft: spacing.sm }]}>
                Move to {s.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Delete issue" style={styles.menuItem} onPress={handleDelete}>
            <Trash2 size={16} color={colors.error} />
            <Text style={[typography.bodySm, { color: colors.error, marginLeft: spacing.sm }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ContextualPopover>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center' },
  filterWrap: {},
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearText: { textDecorationLine: 'underline' },
  listWrap: {},
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  monoId: { marginTop: 3 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth },
  footerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  pageBtns: { flexDirection: 'row' },
  empty: { textAlign: 'center', paddingVertical: 40 },
  menuBtn: { padding: 4 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  menuCancel: { alignItems: 'center', paddingTop: 14, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
