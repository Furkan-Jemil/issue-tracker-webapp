import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Download, LogOut, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardRow } from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import Button from '../components/Button';
import AnimatedEntry from '../components/AnimatedEntry';

export default function AdminSettingsScreen() {
  const { colors, typography, spacing, radius, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAppContext();
  const navigation = useNavigation();

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
            (navigation as any).reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  }, [logout, navigation]);

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <TopAppBar title="Admin Settings" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.pageMargin }]}>
        <AnimatedEntry index={0}>
          <Card style={{ marginTop: spacing.sectionGap }}>
            <CardHeader title="App Info" />
            <CardRow label="Version" value="1.0.0" />
            <CardRow label="Build Number" value="1" />
            <CardRow label="Environment" value={__DEV__ ? 'Development' : 'Production'} />
          </Card>
        </AnimatedEntry>

        <AnimatedEntry index={1}>
          <Card style={{ marginTop: spacing.elementGap }}>
            <CardHeader title="Preferences" />
            <TouchableOpacity
              style={[styles.themeRow, { backgroundColor: colors.surfaceContainerLow, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <View style={styles.themeRowLeft}>
                {isDark ? (
                  <Sun size={20} color={colors.onSurface} />
                ) : (
                  <Moon size={20} color={colors.onSurface} />
                )}
                <Text style={[typography.bodySmBold, { color: colors.onSurface, marginLeft: 12 }]}>Theme</Text>
              </View>
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
          </Card>
        </AnimatedEntry>

        <AnimatedEntry index={2}>
          <Button
            title="Clear Cache"
            onPress={handleClearCache}
            variant="ghost"
            size="lg"
            icon={<Download size={20} color={colors.onSurfaceVariant} />}
            style={{ marginTop: spacing.elementGap }}
          />
        </AnimatedEntry>

        <AnimatedEntry index={3}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            size="lg"
            icon={<LogOut size={20} color="#FFFFFF" />}
            style={{ marginTop: spacing.elementGap }}
          />
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
