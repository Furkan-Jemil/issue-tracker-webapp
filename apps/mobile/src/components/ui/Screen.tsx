import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControlProps, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bell, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useAppContext } from '../../context/AppContext';
import Avatar from './Avatar';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Show a header bar. Defaults to true when a title is given. */
  header?: boolean;
  /** Show a back arrow (stack screens like detail/create). */
  onBack?: () => void;
  /** Custom element on the right of the header (replaces bell+avatar). */
  headerRight?: React.ReactNode;
  /** Wrap children in a ScrollView (default true). */
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  children: React.ReactNode;
  /** Extra bottom padding beyond the floating-bar clearance. */
  contentStyle?: object;
  /** Initial scroll offset (e.g. for Pull-to-Search). */
  contentOffset?: { x: number; y: number };
}

/** Bottom clearance so content scrolls clear of the phone floating tab bar. */
export const FLOATING_BAR_CLEARANCE = 96;

export default function Screen({
  title, subtitle, header, onBack, headerRight, scroll = true, refreshControl, children, contentStyle, contentOffset,
}: ScreenProps) {
  const { colors, isTablet } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, notifications } = useAppContext();
  const unread = notifications.filter((n) => !(n as { read?: boolean }).read).length;
  const showHeader = header ?? title != null;

  const bottomPad = (isTablet ? 24 : FLOATING_BAR_CLEARANCE) + insets.bottom;

  const body = scroll ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 52 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingBottom: bottomPad }, contentStyle]}
        contentOffset={contentOffset}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    <View style={[{ flex: 1, paddingBottom: bottomPad }, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {showHeader && (
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity onPress={onBack} hitSlop={8} style={{ marginRight: 8 }} accessibilityRole="button" accessibilityLabel="Go back">
                <ArrowLeft size={20} color={colors.foreground} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{title}</Text>
              {subtitle ? (
                <Text numberOfLines={1} style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
              ) : null}
            </View>
          </View>
          {headerRight ?? (
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Tabs', { screen: 'Notifications' })}
                style={[styles.iconBtn, { backgroundColor: colors.muted }]}
                accessibilityRole="button"
                accessibilityLabel={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
              >
                <Bell size={16} color={colors.mutedForeground} />
                {unread > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={[styles.badgeText, { color: colors.onError }]}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Settings' })} accessibilityRole="button" accessibilityLabel="Settings">
                <Avatar size="sm" name={user?.name} email={user?.email} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 19 },
  subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 13, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: 3 },
  badge: { position: 'absolute', top: 4, right: 0, minWidth: 16, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontFamily: 'Outfit_700Bold', fontSize: 10 },
});
