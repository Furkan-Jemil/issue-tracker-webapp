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
} from 'react-native';
import { UserCheck, Shield, X, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Badge, Avatar, Button, SearchBar, AnimatedEntry, Skeleton } from '../components/ui';
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
  const [filterRole, setFilterRole] = usePersistedState('members_role', 'ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showRoleSheet, setShowRoleSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

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

  const handleMemberPress = useCallback((member: any) => {
    setSelectedMember(member);
    setShowRoleSheet(true);
  }, []);

  const handleRoleChange = useCallback(
    async (role: string) => {
      if (!selectedMember) return;
      setShowRoleSheet(false);
      try {
        await changeUserRole(selectedMember.id, role);
      } catch {
        Alert.alert('Error', 'Failed to update role. Please try again.');
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
        <TouchableOpacity
          style={[
          styles.memberCard,
          {
            backgroundColor: colors.card,
            borderRadius: radius.xl,
            padding: spacing.cardPadding,
            borderColor: colors.cardBorder,
            borderWidth: StyleSheet.hairlineWidth,
            shadowColor: '#0b1c30',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 2,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name ?? 'Unnamed'}`}
        onPress={() => handleMemberPress(item)}
        activeOpacity={isAdmin ? 0.7 : 1}
        disabled={!isAdmin}
      >
        <View style={styles.memberRow}>
          <Avatar name={item.name} email={item.email} size="sm" />
          <View style={[styles.memberInfo, { marginLeft: spacing.md }]}>
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
          <View style={styles.memberRight}>
            <Badge kind="role" value={item.role ?? 'USER'} />
            {isAdmin && (
              <View style={{ marginLeft: spacing.xs }}>
                <UserCheck size={16} color={colors.onSurfaceVariant} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedEntry>
    );
  };

  return (
    <Screen title="Members" subtitle={isAdmin ? 'Tap a member to change role' : undefined} scroll={false}>
      {/* Search + role filter — horizontal */}
      <View style={[styles.searchRow, { paddingHorizontal: pagePadding, paddingTop: spacing.md, gap: spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search members…" />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.full, borderColor: colors.outlineVariant }]}
          accessibilityRole="button"
          accessibilityLabel={`Filter by role, currently ${filterRole === 'ALL' ? 'All Roles' : filterRole}`}
          onPress={() => setShowFilterSheet(true)}
          activeOpacity={0.7}
        >
          <Text style={[typography.bodySmBold, { color: filterRole === 'ALL' ? colors.onSurfaceVariant : colors.primary }]}>
            {filterRole === 'ALL' ? 'All Roles' : filterRole}
          </Text>
          <ChevronDown size={14} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

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
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
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

      {/* Role-change bottom sheet */}
      <Modal
        visible={showRoleSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowRoleSheet(false)}>
          <Pressable
            style={[
              styles.sheetContent,
              {
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
              },
            ]}
            onPress={() => {}}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.cardBorder }]} />
            <View style={[styles.sheetHeader, { paddingTop: spacing.lg }]}>
              <Text style={[typography.sectionHeading, { color: colors.foreground }]}>
                {selectedMember?.name ?? 'Change Role'}
              </Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowRoleSheet(false)}>
                <X size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={[styles.sheetBody, { paddingBottom: spacing.lg, paddingTop: spacing.sm }]}>
              <Text style={[typography.bodySm, { color: colors.mutedForeground, marginBottom: spacing.elementGap }]}>
                Select a new role for this member
              </Text>
              {['USER', 'TESTER', 'ADMIN'].map((role) => {
                const isCurrentRole = selectedMember?.role === role;
                const isSelfAdminBlock =
                  role !== 'ADMIN' &&
                  selectedMember?.id === user?.id &&
                  user?.role === 'ADMIN';
                const isDisabled = isCurrentRole || isSelfAdminBlock;

                return (
                  <TouchableOpacity
                    key={role}
                    accessibilityRole="button"
                    accessibilityLabel={`Change to ${role}`}
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor: isCurrentRole ? colors.primary + '10' : colors.surfaceContainerLow,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: isCurrentRole ? colors.primary : colors.outlineVariant,
                        marginBottom: spacing.xs,
                        paddingHorizontal: spacing.cardPadding,
                        opacity: isDisabled ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => handleRoleChange(role)}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                  >
                    <View style={styles.roleOptionLeft}>
                      {role === 'ADMIN' ? (
                        <Shield
                          size={20}
                          color={isCurrentRole ? colors.primary : colors.onSurfaceVariant}
                        />
                      ) : (
                        <UserCheck
                          size={20}
                          color={isCurrentRole ? colors.primary : colors.onSurfaceVariant}
                        />
                      )}
                      <Text
                        style={[
                          typography.bodySmBold,
                          {
                            color: isCurrentRole ? colors.primary : colors.foreground,
                            marginLeft: spacing.md,
                          },
                        ]}
                      >
                        {role}
                      </Text>
                    </View>
                    {isCurrentRole && (
                      <View
                        style={[
                          styles.currentBadge,
                          { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.sm },
                        ]}
                      >
                        <Text style={[typography.nanoCaps, { color: colors.onPrimary }]}>
                          Current
                        </Text>
                      </View>
                    )}
                    {isSelfAdminBlock && (
                      <Text style={[typography.micro, { color: colors.error }]}>
                        Cannot demote self
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.muted,
                  borderRadius: radius.md,
                  margin: pagePadding,
                },
              ]}
              onPress={() => setShowRoleSheet(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  typography.sectionHeading,
                  { color: colors.mutedForeground, textAlign: 'center' },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filter role selection sheet */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowFilterSheet(false)}>
          <Pressable style={[styles.sheetContent, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.muted }]} />
            <View style={[styles.sheetHeader, { paddingVertical: spacing.md }]}>
              <Text style={[typography.sectionHeading, { color: colors.foreground }]}>Filter by Role</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowFilterSheet(false)} hitSlop={8}>
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              {ROLE_OPTIONS.map((opt) => {
                const selected = filterRole === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${opt}`}
                    style={[styles.roleOption, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder }]}
                    onPress={() => {
                      setFilterRole(opt);
                      setCurrentPage(0);
                      setShowFilterSheet(false);
                    }}
                  >
                    <View style={styles.roleOptionLeft}>
                      <Shield size={18} color={selected ? colors.primary : colors.onSurfaceVariant} />
                      <Text style={[typography.bodySmBold, { color: selected ? colors.primary : colors.foreground, marginLeft: spacing.md }]}>
                        {opt === 'ALL' ? 'All Roles' : opt}
                      </Text>
                    </View>
                    {selected && (
                      <View style={[styles.currentBadge, { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.sm }]}>
                        <Text style={[typography.nanoCaps, { color: colors.onPrimary }]}>Active</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center' },
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
  currentBadge: { paddingVertical: 2 },
  cancelButton: {
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
