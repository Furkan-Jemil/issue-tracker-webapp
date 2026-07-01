import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Shield, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Card, Input, Button } from '../components/ui';

export default function LoginScreen() {
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation<any>();
  const { login } = useAppContext();
  const [email, setEmail] = useState('admin@ethiotelecom.et');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) { setError('Email is required.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      setError('Unable to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.scroll, { padding: spacing.xl, gap: spacing.xl }]} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.green }]}>
              <Shield size={22} color="#fff" />
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>IssueTracker</Text>
            <Text style={[styles.tag, { color: colors.mutedForeground }]}>Ethio Telecom Internal Platform</Text>
          </View>

          <Card padding={spacing.xl} style={{ width: '100%', maxWidth: 400 }}>
            <Text style={[typography.sectionHeading, { color: colors.foreground, marginBottom: spacing.xl }]}>Sign in to your account</Text>

            {error ? (
              <View style={[styles.error, { backgroundColor: colors.statusOpenBg, gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.lg }]}>
                <AlertCircle size={13} color={colors.statusOpenText} />
                <Text style={[typography.micro, { color: colors.statusOpenText, flex: 1 }]}>{error}</Text>
              </View>
            ) : null}

            <View style={{ gap: spacing.lg }}>
              <Input
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@ethiotelecom.et"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />
              <Button title={loading ? 'Signing in…' : 'Sign In'} onPress={submit} loading={loading} fullWidth size="lg" />
            </View>

            <View style={[styles.footerRow, { marginTop: spacing.xl }]}>
              <Text style={[typography.bodySm, { color: colors.mutedForeground }]}>Don't have an account? </Text>
              <Text onPress={() => navigation.navigate('Register')} style={[typography.bodySmBold, { color: colors.greenFg }]}>Sign up</Text>
            </View>
          </Card>

          <Text style={[typography.micro, { color: colors.mutedForeground }]}>© 2026 Ethio Telecom · All rights reserved</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: 8 },
  logo: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontFamily: 'Outfit_700Bold', fontSize: 24 },
  tag: { fontFamily: 'Outfit_400Regular', fontSize: 14, marginTop: 4 },
  error: { flexDirection: 'row', alignItems: 'center', borderRadius: 10 },
  errorText: { flex: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
});
