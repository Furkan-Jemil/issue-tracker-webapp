import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SlidersHorizontal, LayoutGrid, List, Plus, ChevronLeft, ChevronRight, Grip } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { useResponsive } from '../responsive/useResponsive';
import Grid from '../responsive/Grid';
import { relativeTime } from '../utils/formatters';
import { Screen, Card, Badge, Avatar, Button, SearchBar, IconButton, Select, AnimatedEntry } from '../components/ui';

type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type ViewMode = 'list' | 'board';

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
const BOARD_COLUMNS: Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

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

export default function TasksListScreen() {
  const { colors } = useTheme();
  const { isTablet } = useResponsive();
  const navigation = useNavigation<any>();
  const { issues } = useAppContext();

  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [priorityF, setPriorityF] = useState('all');
  const [severityF, setSeverityF] = useState('all');
  const [view, setView] = useState<ViewMode>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);

  const activeCount = [statusF, priorityF, severityF].filter((f) => f !== 'all').length;

  const filtered = useMemo<Issue[]>(() => {
    const q = search.trim().toLowerCase();
    return (issues as unknown as Issue[]).filter((i) => {
      const matchesSearch =
        !q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (statusF === 'all' || i.status === statusF) &&
        (priorityF === 'all' || i.priority === priorityF) &&
        (severityF === 'all' || i.severity === severityF)
      );
    });
  }, [issues, search, statusF, priorityF, severityF]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PER, (safePage + 1) * PER);

  const boards = useMemo<Record<Status, Issue[]>>(() => {
    const map: Record<Status, Issue[]> = { OPEN: [], IN_PROGRESS: [], RESOLVED: [], CLOSED: [] };
    filtered.forEach((i) => {
      (map[i.status] ?? map.CLOSED).push(i);
    });
    return map;
  }, [filtered]);

  const resetPage = () => setPage(0);
  const openDetail = (issue: Issue) => navigation.navigate('TaskDetail', { issueId: issue.id });

  const clearFilters = () => {
    setStatusF('all');
    setPriorityF('all');
    setSeverityF('all');
    resetPage();
  };

  const renderListCard = (issue: Issue, index: number) => (
    <AnimatedEntry key={issue.id} index={index}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => openDetail(issue)}>
      <Card padding={14}>
        <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.greenFg }]}>
          {issue.title}
        </Text>
        <Text style={[styles.monoId, { color: colors.mutedForeground }]}>{issue.id}</Text>
        <View style={styles.badgeRow}>
          <Badge kind="type" value={issue.type} />
          <Badge kind="status" value={issue.status} />
          <Badge kind="priority" value={issue.priority} />
        </View>
        <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
          <View style={styles.footerLeft}>
            <Avatar size="xs" name={issue.assignee} />
            <Text numberOfLines={1} style={[styles.footerText, { color: colors.mutedForeground }]}>
              {issue.assignee ?? 'Unassigned'}
            </Text>
          </View>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {relativeTime(issue.created_at)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
    </AnimatedEntry>
  );

  const renderMiniCard = (issue: Issue, index: number) => (
    <AnimatedEntry key={issue.id} index={index}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => openDetail(issue)}>
      <Card padding={12} style={{ marginBottom: 8 }}>
        <View style={styles.miniHeader}>
          <Text numberOfLines={2} style={[styles.miniTitle, { color: colors.greenFg }]}>
            {issue.title}
          </Text>
          <Grip size={12} color={colors.mutedForeground} style={{ marginTop: 2 }} />
        </View>
        <View style={styles.miniBadgeRow}>
          <Badge kind="type" value={issue.type} />
          <Badge kind="priority" value={issue.priority} />
        </View>
        <View style={styles.miniFooter}>
          <View style={styles.footerLeft}>
            <Avatar size="xs" name={issue.assignee} />
            <Text numberOfLines={1} style={[styles.footerText, { color: colors.mutedForeground }]}>
              {issue.assignee ?? 'Unassigned'}
            </Text>
          </View>
          <Text style={[styles.monoId, { color: colors.mutedForeground }]}>{issue.id}</Text>
        </View>
      </Card>
    </TouchableOpacity>
    </AnimatedEntry>
  );

  return (
    <Screen title="Issues" subtitle="Track, filter, and manage all open tasks">
      {/* Toolbar */}
      <View style={[styles.toolbar, { paddingHorizontal: isTablet ? 24 : 16 }]}>
        <SearchBar
          value={search}
          onChangeText={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Search issues…"
        />
        <IconButton
          icon={<SlidersHorizontal size={15} color={filtersOpen || activeCount > 0 ? '#fff' : colors.mutedForeground} />}
          active={filtersOpen || activeCount > 0}
          badge={activeCount}
          onPress={() => setFiltersOpen((v) => !v)}
        />
        <IconButton
          icon={
            view === 'list' ? (
              <LayoutGrid size={15} color={colors.mutedForeground} />
            ) : (
              <List size={15} color={colors.mutedForeground} />
            )
          }
          onPress={() => setView((v) => (v === 'list' ? 'board' : 'list'))}
        />
        <Button
          title="Create"
          size="sm"
          icon={<Plus size={14} color="#fff" />}
          onPress={() => navigation.navigate('CreateTask')}
        />
      </View>

      {/* Filters panel */}
      {filtersOpen && (
        <View style={[styles.filterWrap, { paddingHorizontal: isTablet ? 24 : 16 }]}>
          <Card padding={16}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { color: colors.foreground }]}>Filters</Text>
              {activeCount > 0 && (
                <TouchableOpacity onPress={clearFilters} hitSlop={8}>
                  <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ gap: 12 }}>
              <Select
                label="Status"
                value={statusF}
                options={STATUS_OPTIONS}
                onChange={(v) => {
                  setStatusF(v);
                  resetPage();
                }}
              />
              <Select
                label="Priority"
                value={priorityF}
                options={PRIORITY_OPTIONS}
                onChange={(v) => {
                  setPriorityF(v);
                  resetPage();
                }}
              />
              <Select
                label="Severity"
                value={severityF}
                options={SEVERITY_OPTIONS}
                onChange={(v) => {
                  setSeverityF(v);
                  resetPage();
                }}
              />
            </View>
          </Card>
        </View>
      )}

      {/* Content */}
      {view === 'board' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.board, { paddingHorizontal: isTablet ? 24 : 16 }]}
        >
          {BOARD_COLUMNS.map((col) => (
            <View key={col} style={styles.column}>
              <View style={styles.columnHeader}>
                <Badge kind="status" value={col} />
                <Text style={[styles.columnCount, { color: colors.mutedForeground }]}>
                  {boards[col].length}
                </Text>
              </View>
              {boards[col].length === 0 ? (
                <Text style={[styles.emptyCol, { color: colors.mutedForeground }]}>No issues</Text>
              ) : (
                boards[col].map((issue, index) => renderMiniCard(issue, index))
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.listWrap, { paddingHorizontal: isTablet ? 24 : 16 }]}>
          {paged.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No issues found.</Text>
          ) : isTablet ? (
            <Grid columns={2} gap={12}>
              {paged.map((issue, index) => renderListCard(issue, index))}
            </Grid>
          ) : (
            <View style={{ gap: 12 }}>{paged.map((issue, index) => renderListCard(issue, index))}</View>
          )}

          {/* Pagination */}
          <View style={styles.pagination}>
            <Text style={[styles.pageInfo, { color: colors.mutedForeground }]}>
              Page {safePage + 1} of {totalPages} · {filtered.length} issues
            </Text>
            <View style={styles.pageBtns}>
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
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    paddingBottom: 6,
  },
  filterWrap: { paddingTop: 8 },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterTitle: { fontFamily: 'Outfit_700Bold', fontSize: 13 },
  clearText: { fontFamily: 'Outfit_500Medium', fontSize: 11, textDecorationLine: 'underline' },
  listWrap: { paddingTop: 12 },
  cardTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, lineHeight: 19 },
  monoId: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, marginTop: 3 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  footerText: { fontFamily: 'Outfit_400Regular', fontSize: 11 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  pageInfo: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  pageBtns: { flexDirection: 'row', gap: 8 },
  board: { paddingTop: 12, gap: 12 },
  column: { width: 260 },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  columnCount: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  emptyCol: { fontFamily: 'Outfit_400Regular', fontSize: 12, paddingVertical: 8 },
  miniHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  miniTitle: { flex: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 12, lineHeight: 16 },
  miniBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  miniFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  empty: { fontFamily: 'Outfit_400Regular', fontSize: 13, textAlign: 'center', paddingVertical: 40 },
});
