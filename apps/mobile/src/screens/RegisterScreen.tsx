import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Shield, User, AtSign, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Card, Input, Button, Select } from '../components/ui';

const ROLE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'TESTER', label: 'Tester' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function RegisterScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { register } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name) { setError('Full name is required.'); return; }
    if (!email) { setError('Email is required.'); return; }
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, role);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      setError('Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.green }]}>
              <Shield size={22} color="#fff" />
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>Create an account</Text>
            <Text style={[styles.tag, { color: colors.mutedForeground }]}>Join Ethio Telecom IssueTracker</Text>
          </View>

          <Card padding={24} style={{ width: '100%', maxWidth: 420 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Create an account</Text>

            {error ? (
              <View style={[styles.error, { backgroundColor: colors.statusOpenBg }]}>
                <AlertCircle size={13} color={colors.statusOpenText} />
                <Text style={[styles.errorText, { color: colors.statusOpenText }]}>{error}</Text>
              </View>
            ) : null}

            <View style={{ gap: 16 }}>
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Abebe Girma"
                leftIcon={<User size={13} color={colors.mutedForeground} />}
              />
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@ethiotelecom.et"
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<AtSign size={13} color={colors.mutedForeground} />}
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a strong password"
                secureTextEntry
              />
              <Select
                label="Role"
                value={role}
                options={ROLE_OPTIONS}
                onChange={setRole}
              />
              <Button
                title={loading ? 'Creating account…' : 'Register'}
                onPress={submit}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>

            <View style={styles.footerRow}>
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>Already have an account? </Text>
              <Text onPress={() => navigation.navigate('Login')} style={[styles.link, { color: colors.greenFg }]}>Sign in</Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  brand: { alignItems: 'center', marginBottom: 8 },
  logo: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontFamily: 'Outfit_700Bold', fontSize: 24 },
  tag: { fontFamily: 'Outfit_400Regular', fontSize: 14, marginTop: 4 },
  cardTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, marginBottom: 20 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
  errorText: { fontFamily: 'Outfit_400Regular', fontSize: 12, flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  muted: { fontFamily: 'Outfit_400Regular', fontSize: 14 },
  link: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
});
