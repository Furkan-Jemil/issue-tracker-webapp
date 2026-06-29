import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, UserCheck, Shield, X } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import StatusPill from '../components/StatusPill';
import TopAppBar from '../components/TopAppBar';
import AnimatedEntry from '../components/AnimatedEntry';
import EmptyState from '../components/EmptyState';
import { getInitials } from '../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ROLE_OPTIONS = ['ALL', 'ADMIN', 'TESTER', 'USER'] as const;
const PAGE_SIZE = 10;

export default function MembersScreen() {
  const { colors, typography, spacing, radius, pagePadding } = useTheme();
  const { members, user, changeUserRole, isLoading, refreshData } = useAppContext();
  const navigation = useNavigation();

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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE)), [filteredMembers]);
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
      <AnimatedEntry index={index} delay={30}>
        <TouchableOpacity
        style={[
          styles.memberCard,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderRadius: radius.xl,
            padding: spacing.cardPadding,
            shadowColor: '#0b1c30',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 2,
            borderColor: colors.outlineVariant + '30',
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
        onPress={() => handleMemberPress(item)}
        activeOpacity={isAdmin ? 0.7 : 1}
        disabled={!isAdmin}
      >
        <View style={styles.memberRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary + '20', borderRadius: radius.full },
            ]}
          >
            <Text style={[typography.bodySmBold, { color: colors.primary }]}>
              {initials}
            </Text>
          </View>
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
            <StatusPill value={item.role ?? 'USER'} type="role" />
            {isAdmin && (
              <TouchableOpacity
                style={[styles.moreButton, { marginLeft: spacing.xs }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <UserCheck size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        </TouchableOpacity>
      </AnimatedEntry>
    );
  };

  const bgHex = (() => {
    const a = Math.max(0.55, 1 - scrollY / 120);
    return Math.round(a * 255).toString(16).padStart(2, '0');
  })();

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <TopAppBar title="Members" subtitle={isAdmin ? 'Tap to change role' : undefined} onBackPress={() => navigation.goBack()} />

      <View style={[styles.searchRow, { paddingHorizontal: pagePadding, marginTop: spacing.elementGap }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md, borderColor: colors.outlineVariant }]}>
          <Search size={16} color={colors.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }, typography.bodySm]}
            placeholder="Search members..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <X size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.chipRow, { paddingHorizontal: pagePadding, marginTop: spacing.xs, gap: spacing.xs }]}>
        {ROLE_OPTIONS.map((opt) => renderChip(opt, filterRole === opt, () => { setFilterRole(opt); setCurrentPage(0); }))}
      </View>

      <FlatList
        data={pageMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: pagePadding, paddingBottom: 120 }]}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<UserCheck size={40} color={colors.onSurfaceVariant} />}
              title="No Members Found"
              subtitle={searchQuery || filterRole !== 'ALL' ? 'Try adjusting your search or filters.' : 'No members available.'}
            />
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
      />

      {totalPages > 1 && (
        <View style={[styles.pagination, { backgroundColor: colors.surfaceContainerLowest, borderTopColor: colors.outlineVariant, paddingHorizontal: pagePadding }]}>
          <TouchableOpacity
            style={[styles.pageButton, { opacity: safePage <= 0 ? 0.4 : 1 }]}
            onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={safePage <= 0}
          >
            <Text style={[typography.bodySmBold, { color: colors.primary }]}>Prev</Text>
          </TouchableOpacity>
          <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
            Page {safePage + 1} of {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.pageButton, { opacity: safePage >= totalPages - 1 ? 0.4 : 1 }]}
            onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
          >
            <Text style={[typography.bodySmBold, { color: colors.primary }]}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showRoleSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowRoleSheet(false)}>
          <Pressable
            style={[styles.sheetContent, { backgroundColor: colors.surfaceContainerLowest, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}
            onPress={() => {}}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.sectionHeading, { color: colors.onSurface }]}>
                {selectedMember?.name ?? 'Change Role'}
              </Text>
              <TouchableOpacity onPress={() => setShowRoleSheet(false)}>
                <X size={22} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginBottom: spacing.elementGap }]}>
                Select a new role for this member
              </Text>
              {['USER', 'TESTER', 'ADMIN'].map((role) => {
                const isCurrentRole = selectedMember?.role === role;
                const isSelfAdminBlock = role !== 'ADMIN' && selectedMember?.id === user?.id && user?.role === 'ADMIN';
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
                        <Shield size={20} color={isCurrentRole ? colors.primary : colors.onSurfaceVariant} />
                      ) : (
                        <UserCheck size={20} color={isCurrentRole ? colors.primary : colors.onSurfaceVariant} />
                      )}
                      <Text
                        style={[
                          typography.bodySmBold,
                          { color: isCurrentRole ? colors.primary : colors.onSurface, marginLeft: 12 },
                        ]}
                      >
                        {role}
                      </Text>
                    </View>
                    {isCurrentRole && (
                      <View style={[styles.currentBadge, { backgroundColor: colors.primary, borderRadius: radius.full }]}>
                        <Text style={[typography.nanoCaps, { color: colors.onPrimary }]}>Current</Text>
                      </View>
                    )}
                    {isSelfAdminBlock && (
                      <Text style={[typography.micro, { color: colors.error }]}>Cannot demote self</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md, margin: pagePadding }]}
              onPress={() => setShowRoleSheet(false)}
              activeOpacity={0.8}
            >
              <Text style={[typography.sectionHeading, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  clearSearch: {
    padding: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginBottom: 4,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 12,
  },
  memberCard: {},
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    padding: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    maxHeight: SCREEN_HEIGHT * 0.6,
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
    paddingTop: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cancelButton: {
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
