import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Moon, Sun, Bell, Shield, ChevronRight, LogOut, Edit3 } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Badge, Avatar, Button } from '../components/ui';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme, pagePadding } = useTheme();
  const navigation = useNavigation<any>();
  const { user, logout } = useAppContext();

  const signOut = async () => {
    await logout();
    let nav: any = navigation;
    while (nav.getParent && nav.getParent()) nav = nav.getParent();
    nav.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const rows = [
    { Icon: Bell, label: 'Notifications', sub: 'Email and in-app alerts' },
    { Icon: Shield, label: 'Security & Privacy', sub: '2FA, sessions, access control' },
  ];

  return (
    <Screen title="Settings" subtitle="Account, appearance, and preferences">
      <View style={{ paddingHorizontal: pagePadding, paddingVertical: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {/* Profile card */}
        <Card padding={20}>
          <View style={styles.profile}>
            <Avatar name={user?.name} email={user?.email} size="lg" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{user?.name ?? 'User'}</Text>
              <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email ?? ''}</Text>
              <Badge kind="role" value={user?.role ?? 'USER'} style={{ marginTop: 6 }} />
            </View>
            <Button title="Edit" variant="outline" size="sm" icon={<Edit3 size={12} color={colors.foreground} />} onPress={() => navigation.navigate('Profile')} />
          </View>
        </Card>

        {/* Preferences */}
        <Card padding={0}>
          <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.rowLeft}>
              {isDark ? <Moon size={16} color={colors.mutedForeground} /> : <Sun size={16} color={colors.mutedForeground} />}
              <View>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Appearance</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleTheme} activeOpacity={0.8} style={[styles.toggle, { backgroundColor: isDark ? colors.green : colors.outline }]}>
              <View style={[styles.knob, { alignSelf: isDark ? 'flex-end' : 'flex-start' }]} />
            </TouchableOpacity>
          </View>
          {rows.map((r, i) => (
            <TouchableOpacity key={r.label} activeOpacity={0.7} style={[styles.row, i < rows.length - 1 && { borderBottomColor: colors.cardBorder, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={styles.rowLeft}>
                <r.Icon size={16} color={colors.mutedForeground} />
                <View>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>{r.label}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{r.sub}</Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </Card>

        <Button title="Sign Out" variant="destructive" fullWidth icon={<LogOut size={14} color="#fff" />} onPress={signOut} />
        <Text style={[styles.version, { color: colors.mutedForeground }]}>Version 2.4.1 · Ethio Telecom IssueTracker</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  name: { fontFamily: 'Outfit_700Bold', fontSize: 16 },
  email: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: 'Outfit_500Medium', fontSize: 14 },
  rowSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 1 },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  version: { fontFamily: 'Outfit_400Regular', fontSize: 12, textAlign: 'center', marginTop: 4 },
});
