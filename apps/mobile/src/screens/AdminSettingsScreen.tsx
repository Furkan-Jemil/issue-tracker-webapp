import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Download, LogOut, Sun, Moon, Trash2 } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Button } from '../components/ui';

export default function AdminSettingsScreen() {
  const { colors, typography, spacing, radius, isDark, toggleTheme, pagePadding } = useTheme();
  const { user, logout } = useAppContext();

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will clear all locally cached data. You will need to refresh to reload data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@cache_issues');
              await AsyncStorage.removeItem('@cache_members');
              Alert.alert('Done', 'Cache cleared successfully.');
            } catch {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ],
    );
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  }, [logout]);

  const rows: { label: string; value: string }[] = [
    { label: 'Version', value: '2.4.1' },
    { label: 'Build', value: __DEV__ ? 'Development' : 'Production' },
    { label: 'Logged in as', value: user?.email ?? '—' },
    { label: 'Role', value: user?.role ?? '—' },
  ];

  return (
    <Screen title="Admin Settings" subtitle="System info and app preferences" onBack={undefined}>
      <View style={{ paddingHorizontal: pagePadding, paddingVertical: spacing.xl, gap: spacing.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {/* App Info */}
        <Card padding={0}>
          {rows.map((r, i) => (
            <View
              key={r.label}
              style={[
                styles.row,
                { borderBottomColor: colors.cardBorder, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
                i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Text style={[typography.bodySmBold, { color: colors.mutedForeground }]}>{r.label}</Text>
              <Text style={[typography.bodySmBold, { color: colors.foreground }]}>{r.value}</Text>
            </View>
          ))}
        </Card>

        {/* Theme toggle */}
        <Card padding={0}>
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.7}
            style={[styles.row, { borderBottomWidth: 0, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }]}
          >
            <View style={[styles.rowLeft, { gap: spacing.md }]}>
              {isDark ? (
                <Moon size={16} color={colors.mutedForeground} />
              ) : (
                <Sun size={16} color={colors.mutedForeground} />
              )}
              <View style={{ marginLeft: 12 }}>
                <Text style={[typography.bodySmBold, { color: colors.foreground }]}>Appearance</Text>
                <Text style={[typography.micro, { color: colors.mutedForeground }]}>
                  {isDark ? 'Dark mode' : 'Light mode'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              activeOpacity={0.8}
              style={[styles.toggle, { backgroundColor: isDark ? colors.green : colors.outline }]}
            >
              <View style={[styles.knob, { alignSelf: isDark ? 'flex-end' : 'flex-start' }]} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Card>

        {/* Actions */}
        <Button
          title="Clear Cache"
          variant="outline"
          fullWidth
          icon={<Trash2 size={14} color={colors.foreground} />}
          onPress={handleClearCache}
        />
        <Button
          title="Sign Out"
          variant="destructive"
          fullWidth
          icon={<LogOut size={14} color="#fff" />}
          onPress={handleLogout}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
