import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Button, SecLabel, Avatar } from '../components/ui';

export default function ProfileScreen() {
  const { colors, pagePadding } = useTheme();
  const { user, logout } = useAppContext();
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            let nav: any = navigation;
            while (nav.getParent && nav.getParent()) nav = nav.getParent();
            nav.reset({ index: 0, routes: [{ name: 'Auth' }] });
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Full name', value: user?.name ?? '—' },
    { label: 'Email', value: user?.email ?? '—' },
    { label: 'Role', value: user?.role ?? '—' },
  ];

  return (
    <Screen title="Profile" subtitle="Your account details" onBack={() => navigation.goBack()}>
      <View
        style={{
          paddingHorizontal: pagePadding,
          paddingVertical: 20,
          gap: 16,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Avatar + name hero */}
        <Card padding={20}>
          <View style={styles.hero}>
            <Avatar name={user?.name} email={user?.email} size="lg" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{user?.name ?? 'User'}</Text>
              <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email ?? ''}</Text>
            </View>
          </View>
        </Card>

        {/* Info rows */}
        <SecLabel>Account details</SecLabel>
        <Card padding={0}>
          {rows.map((r, i) => (
            <View
              key={r.label}
              style={[
                styles.row,
                { borderBottomColor: colors.cardBorder },
                i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>{r.value}</Text>
            </View>
          ))}
        </Card>

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
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  name: { fontFamily: 'Outfit_700Bold', fontSize: 16 },
  email: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowLabel: { fontFamily: 'Outfit_400Regular', fontSize: 13 },
  rowValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
});
