import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  RefreshControl,
  LayoutRectangle,
} from 'react-native';
import { UserCheck, Shield, X, ChevronDown, ChevronRight, Search } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Badge, Avatar, Button, SearchOverlay, IconButton, AnimatedEntry, Skeleton, ContextualPopover, ContextualAnchor } from '../components/ui';
import { getInitials } from '../utils/formatters';
import usePersistedState from '../utils/usePersistedState';
import useDebounce from '../utils/useDebounce';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ROLE_OPTIONS = ['ALL', 'ADMIN', 'TESTER', 'USER'] as const;
const PAGE_SIZE = 10;

export default function MembersScreen() {
  const { colors, typography, spacing, radius, pagePadding, isTablet } = useTheme();
  const { members, user, changeUserRole, isLoading, refreshData } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterRole, setFilterRole] = usePersistedState('members_role', 'ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [roleAnchor, setRoleAnchor] = useState<LayoutRectangle | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<LayoutRectangle | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setCurrentPage(0);
  }, []);

  const filteredMembers = useMemo(() => {
    let list = [...members];

    const q = debouncedSearch.trim().toLowerCase();
    const minMet = q.length === 0 || q.length >= 2;
    if (minMet && q) {
      list = list.filter((item) => {
        const m = item as any;
        return (
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q))
        );
      });
    }

    if (filterRole !== 'ALL') {
      list = list.filter((item) => (item as any).role === filterRole);
    }

    return list;
  }, [members, debouncedSearch, filterRole]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE)),
    [filteredMembers],
  );
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageMembers = useMemo(
    () => filteredMembers.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filteredMembers, safePage],
  );

  const handleMemberPress = useCallback((member: any, rect: LayoutRectangle) => {
    setSelectedMember(member);
    setRoleAnchor(rect);
  }, []);

  const handleRoleChange = useCallback(
    async (role: string) => {
      if (!selectedMember) return;
      setRoleAnchor(null);
      try {
         await changeUserRole(selectedMember.id, role);
       } catch (err) {
         Alert.alert('Role Update Failed', err instanceof Error ? err.message : 'Please try again.');
       }
    },
    [selectedMember, changeUserRole],
  );

  const isAdmin = user?.role === 'ADMIN';

  const renderChip = (label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceContainerLow,
          borderRadius: radius.full,
          paddingHorizontal: spacing.elementGap,
          paddingVertical: spacing.xs,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.outlineVariant,
          marginBottom: spacing.xs,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          typography.bodySmBold,
          { color: selected ? colors.onPrimary : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderMember = ({ item, index }: { item: any; index: number }) => {
    const initials = getInitials(item.name, item.email);
    const isSelf = item.id === user?.id;

    return (
      <AnimatedEntry index={index}>
      <ContextualAnchor
        style={[
          styles.memberCard,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.md,
            borderColor: colors.cardBorder,
            borderWidth: StyleSheet.hairlineWidth,
            shadowColor: '#0b1c30',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name ?? 'Unnamed'}`}
        onPressAnchor={(rect) => handleMemberPress(item, rect)}
        activeOpacity={isAdmin ? 0.7 : 1}
        disabled={!isAdmin}
      >
        <View style={[styles.memberRow, { gap: spacing.md }]}>
          <Avatar name={item.name} email={item.email} size="sm" />
          <View style={styles.memberInfo}>
            <Text
              style={[typography.bodySmBold, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {item.name ?? 'Unnamed'}
              {isSelf ? ' (You)' : ''}
            </Text>
            <Text
              style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}
              numberOfLines={1}
            >
              {item.email ?? '—'}
            </Text>
          </View>
          <View style={[styles.memberRight, { gap: spacing.xs }]}>
            <Badge kind="role" value={item.role ?? 'USER'} />
            {isAdmin && <ChevronRight size={16} color={colors.onSurfaceVariant} />}
          </View>
        </View>
      </ContextualAnchor>
    </AnimatedEntry>
    );
  };

  return (
    <Screen title="Members" subtitle={isAdmin ? 'Tap a member to change role' : undefined} scroll={false}>
      {/* Role filter + search icon — horizontal */}
      <View style={[styles.searchRow, { paddingHorizontal: pagePadding, paddingTop: spacing.md, gap: spacing.sm }]}>
        <ContextualAnchor
          style={[styles.filterBtn, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.full, borderColor: colors.outlineVariant }]}
          accessibilityRole="button"
          accessibilityLabel={`Filter by role, currently ${filterRole === 'ALL' ? 'All Roles' : filterRole}`}
          onPressAnchor={(rect) => setFilterAnchor(rect)}
          activeOpacity={0.7}
        >
          <Text style={[typography.bodySmBold, { color: filterRole === 'ALL' ? colors.onSurfaceVariant : colors.primary }]}>
            {filterRole === 'ALL' ? 'All Roles' : filterRole}
          </Text>
          <ChevronDown size={14} color={colors.onSurfaceVariant} />
        </ContextualAnchor>
        <View style={{ flex: 1 }} />
        <IconButton
          icon={<Search size={16} color={colors.mutedForeground} />}
          accessibilityLabel="Search members"
          onPress={() => setSearchOpen(true)}
        />
      </View>

      {/* Search overlay */}
      <SearchOverlay
        visible={searchOpen}
        onClose={closeSearch}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name or email…"
        prompt="Search members by name or email"
        resultCount={filteredMembers.length}
      >
        {filteredMembers.slice(0, 30).map((m: any) => (
          <View key={m.id} style={[styles.resultRow, { borderBottomColor: colors.cardBorder }]}>
            <Avatar name={m.name} email={m.email} size="xs" />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[typography.bodySmBold, { color: colors.foreground }]}>{m.name ?? 'Unnamed'}</Text>
              <Text numberOfLines={1} style={[typography.bodySm, { color: colors.mutedForeground, marginTop: 2 }]}>{m.email ?? '—'}</Text>
            </View>
            <Badge kind="role" value={m.role ?? 'USER'} />
          </View>
        ))}
      </SearchOverlay>

      {isLoading ? (
        <View style={[styles.listContent, { paddingHorizontal: pagePadding, paddingTop: spacing.md, gap: spacing.xs }]}>
          {[1,2,3,4,5].map((i) => (
            <Card key={i} padding={spacing.cardPadding}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Skeleton width={36} height={36} borderRadius={18} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Skeleton width="60%" height={12} borderRadius={4} />
                  <Skeleton width="40%" height={10} borderRadius={4} />
                </View>
                <Skeleton width={50} height={18} borderRadius={6} />
              </View>
            </Card>
          ))}
        </View>
      ) : (
      <FlatList
        data={pageMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: pagePadding, paddingBottom: 120, paddingTop: spacing.md }]}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={[styles.empty, { gap: spacing.md }]}>
              <UserCheck size={40} color={colors.mutedForeground + '40'} />
              <Text style={[typography.sectionHeading, { color: colors.mutedForeground }]}>No Members Found</Text>
              <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center' }]}>
                {searchQuery || filterRole !== 'ALL'
                  ? 'Try adjusting your search or filters.'
                  : 'No members available.'}
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View
          style={[
            styles.pagination,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.cardBorder,
              paddingHorizontal: pagePadding,
              paddingVertical: spacing.md,
            },
          ]}
        >
          <Button
            title="Prev"
            variant="outline"
            size="sm"
            disabled={safePage <= 0}
            onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
          />
          <Text style={[typography.labelBadge, { color: colors.mutedForeground }]}>
            Page {safePage + 1} of {totalPages}
          </Text>
          <Button
            title="Next"
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          />
        </View>
      )}

      {/* Role-change ContextualPopover */}
      <ContextualPopover
        visible={!!roleAnchor && !!selectedMember}
        onClose={() => setRoleAnchor(null)}
        anchorRect={roleAnchor}
        width={240}
      >
        <View style={{ padding: spacing.sm }}>
          <Text style={[typography.labelBadge, { color: colors.mutedForeground, marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]}>
            Change Role
          </Text>
          {['USER', 'TESTER', 'ADMIN'].map((role) => {
            const isCurrentRole = selectedMember?.role === role;
            const isSelfAdminBlock =
              role !== 'ADMIN' &&
              selectedMember?.id === user?.id &&
              user?.role === 'ADMIN';

            return (
              <TouchableOpacity
                key={role}
                accessibilityRole="button"
                accessibilityLabel={`Set role to ${role}`}
                style={[
                  styles.popoverItem,
                  isCurrentRole && { backgroundColor: colors.surfaceContainerLow },
                ]}
                disabled={isCurrentRole || isSelfAdminBlock}
                onPress={() => handleRoleChange(role)}
              >
                <UserCheck size={16} color={isCurrentRole ? colors.primary : colors.foreground} />
                <Text style={[typography.bodySmBold, { color: isCurrentRole ? colors.primary : colors.foreground, marginLeft: spacing.sm }]}>
                  {role}
                </Text>
                {isCurrentRole && (
                  <View style={[styles.currentBadge, { backgroundColor: colors.primary, marginLeft: 'auto', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 }]}>
                    <Text style={[typography.nanoCaps, { color: colors.onPrimary }]}>CURRENT</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ContextualPopover>

      {/* Filter role ContextualPopover */}
      <ContextualPopover
        visible={!!filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorRect={filterAnchor}
        width={200}
      >
        <View style={{ padding: spacing.sm }}>
          <Text style={[typography.labelBadge, { color: colors.mutedForeground, marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]}>
            Filter Roles
          </Text>
          {ROLE_OPTIONS.map((opt) => {
            const selected = filterRole === opt;
            return (
              <TouchableOpacity
                key={opt}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${opt}`}
                style={[styles.popoverItem, selected && { backgroundColor: colors.surfaceContainerLow }]}
                onPress={() => {
                  setFilterRole(opt);
                  setCurrentPage(0);
                  setFilterAnchor(null);
                }}
              >
                <Shield size={16} color={selected ? colors.primary : colors.foreground} />
                <Text style={[typography.bodySmBold, { color: selected ? colors.primary : colors.foreground, marginLeft: spacing.sm }]}>
                  {opt === 'ALL' ? 'All Roles' : opt}
                </Text>
                {selected && (
                  <View style={[styles.currentBadge, { backgroundColor: colors.primary, marginLeft: 'auto', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 }]}>
                    <Text style={[typography.nanoCaps, { color: colors.onPrimary }]}>ACTIVE</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ContextualPopover>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  chipRow: { flexDirection: 'row' },
  chip: {},
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, gap: 6 },
  listContent: { flexGrow: 1 },
  memberCard: {},
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberInfo: { flex: 1 },
  memberRight: { flexDirection: 'row', alignItems: 'center' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetContent: { maxHeight: SCREEN_HEIGHT * 0.6 },
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
  },
  sheetBody: { paddingHorizontal: 20 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  roleOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  popoverItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8 },
  currentBadge: { paddingVertical: 2 },
  cancelButton: {
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
