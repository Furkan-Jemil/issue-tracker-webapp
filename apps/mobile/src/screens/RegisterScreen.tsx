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
import { UserPlus, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import Input from '../components/Input';
import Button from '../components/Button';

const ROLE_OPTIONS = ['USER', 'TESTER'] as const;

export default function RegisterScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { register } = useAppContext();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('USER');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), role);
      // register() auto-logs in; navigation will handle redirect to Main
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const renderChip = (label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      style={[{ backgroundColor: selected ? colors.primaryContainer : colors.surfaceContainerLow, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: selected ? colors.primaryContainer : colors.input, marginBottom: 4 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[typography.labelBadge, { color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* ── Brand hero ── */}
          <View style={[styles.hero, { paddingHorizontal: spacing.pageMargin }]}>
            <View style={[styles.logoBox, { backgroundColor: colors.primaryContainer, borderRadius: radius.xl }]}>
              <UserPlus size={28} color={colors.onPrimaryContainer} />
            </View>
            <Text style={[typography.display, { color: colors.primary, marginTop: spacing.md }]}>
              Create account
            </Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: spacing.xs, textAlign: 'center' }]}>
              Join to report and track issues
            </Text>
          </View>

          {/* ── Register card ── */}
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
                  label="Full Name"
                  placeholder="John Doe"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
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
                  placeholder="Create a password (min 8 chars)"
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />

                <View>
                  <Text style={[typography.bodySmBold, { color: colors.onSurface, marginBottom: spacing.sm }]}>Role</Text>
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    {ROLE_OPTIONS.map((opt) => renderChip(opt, role === opt, () => setRole(opt)))}
                  </View>
                </View>

                <Button
                  title={loading ? 'Creating account...' : 'Create Account'}
                  onPress={handleRegister}
                  variant="tonal"
                  size="lg"
                  loading={loading}
                  style={{ marginTop: spacing.xs }}
                />
              </View>

              <TouchableOpacity
                onPress={() => (navigation as any).navigate('Login')}
                disabled={loading}
                style={[styles.footerLink, { marginTop: spacing.lg }]}
              >
                <ArrowLeft size={14} color={colors.primary} style={{ marginRight: spacing.xs }} />
                <Text style={[typography.bodySmBold, { color: colors.primary }]}>
                  Back to sign in
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[typography.micro, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xl }]}>
            Secured by Ethio Telecom Ops
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
