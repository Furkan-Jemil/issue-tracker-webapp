import React from 'react';
import { View, Text, Alert, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LogOut } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Card, CardRow } from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import Button from '../components/Button';
import AnimatedEntry from '../components/AnimatedEntry';

export default function ProfileScreen() {
  const { colors, spacing } = useTheme();
  const { user, logout } = useAppContext();
  const navigation = useNavigation();

  const handleLogout = async () => {
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
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <TopAppBar title="Profile" />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.pageMargin }]}>
        <AnimatedEntry index={0}>
          <Card style={{ marginTop: spacing.sectionGap }}>
            <CardRow label="Name" value={user?.name ?? '—'} />
            <CardRow label="Email" value={user?.email ?? '—'} />
            <CardRow label="Role" value={user?.role ?? '—'} />
          </Card>
        </AnimatedEntry>

        <AnimatedEntry index={1}>
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
});
