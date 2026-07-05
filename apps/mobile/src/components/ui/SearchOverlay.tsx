import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  /** Minimum characters before results are shown. Default 2. */
  minChars?: number;
  /** Number of results currently matched (for the empty-results state). */
  resultCount?: number;
  /** Prompt shown before the user types anything, e.g. "Search issues by title or ID". */
  prompt?: string;
  /** Rendered result rows (shown once value length >= minChars). */
  children?: React.ReactNode;
}

/**
 * Full-screen search experience: dims the page behind, auto-focuses the input,
 * shows an empty prompt before typing, and only reveals results at minChars+.
 * Reuses the app's Modal dim pattern (see FilterPopover). No blur dependency.
 */
export default function SearchOverlay({
  visible,
  onClose,
  value,
  onChangeText,
  placeholder = 'Search…',
  minChars = 2,
  resultCount,
  prompt = 'Type to start searching',
  children,
}: SearchOverlayProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  // Auto-focus reliably on both platforms once the modal is on screen.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => inputRef.current?.focus(), Platform.OS === 'android' ? 120 : 60);
    return () => clearTimeout(t);
  }, [visible]);

  const trimmed = value.trim();
  const meetsMin = trimmed.length >= minChars;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.dim, { paddingTop: insets.top + spacing.sm }]}>
        {/* Tap outside the panel to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close search" />

        {/* Search input bar */}
        <View style={[styles.bar, { backgroundColor: colors.card + 'CC', borderRadius: radius.lg, marginHorizontal: spacing.lg }]}>
          <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close search">
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            autoCorrect={false}
            returnKeyType="search"
          />
          {value.length > 0 && (
            <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Body: empty prompt → keep-typing hint → results */}
        <View style={[styles.panel, { backgroundColor: colors.card + 'CC', borderRadius: radius.xl, marginHorizontal: spacing.lg, marginTop: spacing.sm }]}>
          {!meetsMin ? (
            <View style={styles.hint}>
              <Search size={30} color={colors.mutedForeground + '55'} />
              <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm }]}>
                {trimmed.length === 0 ? prompt : `Keep typing — ${minChars}+ characters to search`}
              </Text>
            </View>
          ) : resultCount === 0 ? (
            <View style={styles.hint}>
              <Search size={30} color={colors.mutedForeground + '55'} />
              <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm }]}>
                No matches for “{trimmed}”
              </Text>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.sm }}>
              {children}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  input: { flex: 1, height: '100%', paddingVertical: 0, fontFamily: 'Outfit_400Regular', fontSize: 15 },
  panel: {
    flex: 1,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 4 },
      default: {},
    }),
  },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
});
