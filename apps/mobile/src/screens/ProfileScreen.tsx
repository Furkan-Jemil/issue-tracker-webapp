import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { LogOut, Edit3, Save, Clock, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, Button, SecLabel, Avatar } from '../components/ui';

export default function ProfileScreen() {
  const { colors, spacing, typography, pagePadding } = useTheme();
  const { user, logout, updateProfile, auditLogs } = useAppContext();
  const navigation = useNavigation<any>();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');

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

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    try {
      await updateProfile({ name: editName.trim() });
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Full name', value: user?.name ?? '—' },
    { label: 'Email', value: user?.email ?? '—' },
    { label: 'Role', value: user?.role ?? '—' },
  ];

  const userLogs = auditLogs.filter((l: any) => l.actor === user?.name).slice(0, 5);

  return (
    <Screen title="Profile" subtitle="Your account details" onBack={() => navigation.goBack()}>
      <View
        style={{
          paddingHorizontal: pagePadding,
          paddingVertical: spacing.xl,
          gap: spacing.lg,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Avatar + name hero */}
        <Card padding={20}>
          <View style={[styles.hero, { gap: spacing.lg }]}>
            <Avatar name={user?.name} email={user?.email} size="lg" />
            <View style={{ flex: 1 }}>
              <Text style={[typography.sectionHeading, { color: colors.foreground }]}>{user?.name ?? 'User'}</Text>
              <Text style={[typography.micro, { color: colors.mutedForeground, marginTop: 2 }]}>{user?.email ?? ''}</Text>
            </View>
          </View>
        </Card>

        {/* Info rows */}
        <SecLabel>Account details</SecLabel>
        <Card padding={0}>
          {rows.map((r, i) => {
            if (r.label === 'Full name') {
              return (
                <View key={r.label} style={[styles.row, { borderBottomColor: colors.cardBorder, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[typography.bodySm, { color: colors.mutedForeground }]}>{r.label}</Text>
                  {isEditing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                      <TextInput
                        value={editName}
                        onChangeText={setEditName}
                        style={[typography.bodySmBold, { color: colors.foreground, textAlign: 'right', flex: 1, marginLeft: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.primary, padding: 0 }]}
                        placeholderTextColor={colors.mutedForeground}
                        autoFocus
                        onBlur={() => setIsEditing(false)}
                      />
                      <TouchableOpacity onPress={handleSave} style={{ marginLeft: 12, backgroundColor: colors.primary, borderRadius: 4, padding: 4 }} hitSlop={8}>
                        <Check size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                      <Text style={[typography.bodySmBold, { color: colors.foreground }]}>{r.value}</Text>
                      <TouchableOpacity onPress={() => setIsEditing(true)} style={{ marginLeft: 12 }} hitSlop={8}>
                        <Edit3 size={14} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }
            return (
              <View key={r.label} style={[styles.row, { borderBottomColor: colors.cardBorder, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }, i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <Text style={[typography.bodySm, { color: colors.mutedForeground }]}>{r.label}</Text>
                <Text style={[typography.bodySmBold, { color: colors.foreground }]}>{r.value}</Text>
              </View>
            );
          })}
        </Card>

        {/* Activity Log */}
        {userLogs.length > 0 && (
          <>
            <SecLabel>Recent Activity</SecLabel>
            <Card padding={spacing.cardPadding}>
              {userLogs.map((log: any, i: number) => (
                <View key={log.id} style={[styles.activityRow, i < userLogs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder, paddingBottom: spacing.sm, marginBottom: spacing.sm }]}>
                  <Clock size={12} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[typography.cardDesc, { color: colors.foreground }]}>{log.description}</Text>
                    <Text style={[typography.micro, { color: colors.mutedForeground, marginTop: 2 }]}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

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
  hero: { flexDirection: 'row', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start' },
});
