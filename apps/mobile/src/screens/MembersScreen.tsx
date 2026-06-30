import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { UserCheck, Shield, X } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Badge, Avatar, Button, SearchBar, AnimatedEntry } from '../components/ui';
import { getInitials } from '../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ROLE_OPTIONS = ['ALL', 'ADMIN', 'TESTER', 'USER'] as const;
const PAGE_SIZE = 10;

export default function MembersScreen() {
  const { colors, typography, spacing, radius, pagePadding, isTablet } = useTheme();
  const { members, user, changeUserRole, isLoading } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showRoleSheet, setShowRoleSheet] = useState(false);

  const filteredMembers = useMemo(() => {
    let list = [...members];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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
  }, [members, searchQuery, filterRole]);

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
        // silently fail
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
        onPress={() => handleMemberPress(item)}
        activeOpacity={isAdmin ? 0.7 : 1}
        disabled={!isAdmin}
      >
        <View style={styles.memberRow}>
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
    <Screen title="Members" subtitle={isAdmin ? 'Tap a member to change role' : undefined}>
      {/* Search + chips */}
      <View style={{ paddingHorizontal: pagePadding, paddingTop: 12, gap: 8 }}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search members…" />
        <View style={[styles.chipRow, { gap: spacing.xs }]}>
          {ROLE_OPTIONS.map((opt) =>
            renderChip(opt, filterRole === opt, () => {
              setFilterRole(opt);
              setCurrentPage(0);
            }),
          )}
        </View>
      </View>

      {/* Member list */}
      <FlatList
        data={pageMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: pagePadding, paddingBottom: 120 }]}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <UserCheck size={40} color={colors.mutedForeground + '40'} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No Members Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                {searchQuery || filterRole !== 'ALL'
                  ? 'Try adjusting your search or filters.'
                  : 'No members available.'}
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <View
          style={[
            styles.pagination,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.cardBorder,
              paddingHorizontal: pagePadding,
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
          <Text style={[styles.pageInfo, { color: colors.mutedForeground }]}>
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
            <View style={styles.sheetHeader}>
              <Text style={[typography.sectionHeading, { color: colors.foreground }]}>
                {selectedMember?.name ?? 'Change Role'}
              </Text>
              <TouchableOpacity onPress={() => setShowRoleSheet(false)}>
                <X size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
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
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor: isCurrentRole ? colors.primary + '10' : colors.surfaceContainerLow,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: isCurrentRole ? colors.primary : colors.outlineVariant,
                        marginBottom: spacing.xs,
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
                            marginLeft: 12,
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
                          { backgroundColor: colors.primary, borderRadius: radius.full },
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginBottom: 4 },
  listContent: { flexGrow: 1, paddingTop: 12 },
  memberCard: {},
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberRight: { flexDirection: 'row', alignItems: 'center' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pageInfo: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
  emptySubtitle: { fontFamily: 'Outfit_400Regular', fontSize: 13, textAlign: 'center' },
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
    paddingTop: 16,
  },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roleOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 2 },
  cancelButton: {
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
