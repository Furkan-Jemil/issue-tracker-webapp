import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import Input from '../components/Input';
import Button from '../components/Button';

export default function LoginScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { login } = useAppContext();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      (navigation as any).reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* ── Brand hero ── */}
          <View style={[styles.hero, { paddingHorizontal: spacing.pageMargin }]}>
            <View style={[styles.logoBox, { backgroundColor: colors.primaryContainer, borderRadius: radius.xl }]}>
              <Shield size={28} color={colors.onPrimaryContainer} />
            </View>
            <Text style={[typography.display, { color: colors.primary, marginTop: spacing.md }]}>
              IssueTracker
            </Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: spacing.xs, textAlign: 'center' }]}>
              Ship quality with a clear issue workflow
            </Text>
          </View>

          {/* ── Login card ── */}
          <View style={[styles.card, { paddingHorizontal: spacing.pageMargin, marginTop: spacing.sectionGap }]}>
            <View
              style={[
                styles.cardInner,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderRadius: radius.xl,
                  padding: spacing.xl,
                  borderColor: colors.outlineVariant + '30',
                  shadowColor: '#0b1c30',
                },
              ]}
            >
              <View style={{ gap: spacing.md }}>
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <Button
                  title={loading ? 'Signing in...' : 'Sign In'}
                  onPress={handleLogin}
                  variant="tonal"
                  size="lg"
                  loading={loading}
                  style={{ marginTop: spacing.xs }}
                />
              </View>

              <TouchableOpacity
                onPress={() => (navigation as any).navigate('Register')}
                disabled={loading}
                style={[styles.footerLink, { marginTop: spacing.lg }]}
              >
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
                  New here?{' '}
                </Text>
                <Text style={[typography.bodySmBold, { color: colors.primary }]}>
                  Create an account
                </Text>
                <ArrowRight size={14} color={colors.primary} style={{ marginLeft: spacing.xs }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Footer ── */}
          <Text style={[typography.micro, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl }]}>
            2026 Ethio Telecom
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center' },
  logoBox: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { width: '100%' },
  cardInner: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  footerLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
