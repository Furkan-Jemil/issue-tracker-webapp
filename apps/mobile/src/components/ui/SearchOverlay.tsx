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
import { ArrowLeft, Search, X, Sparkles } from 'lucide-react-native';
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
  /** Quick filter tags to display. Defaults to ['BUG', 'IMPROVEMENT']. */
  quickFilters?: string[];
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
  quickFilters = ['BUG', 'IMPROVEMENT'],
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
        <View style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.outlineVariant, borderWidth: 1, borderRadius: 16, marginHorizontal: spacing.lg }]}>
          <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close search">
            <ArrowLeft size={22} color={colors.foreground} />
          </TouchableOpacity>
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
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Body: empty prompt → keep-typing hint → results */}
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.outlineVariant, borderWidth: 1, borderRadius: 20, marginHorizontal: spacing.lg, marginTop: spacing.sm }]}>
          {!meetsMin ? (
            <View style={[styles.hintContainer, { padding: spacing.xl }]}>
              {trimmed.length === 0 ? (
                <>
                  <Text style={[typography.labelBadge, { color: colors.mutedForeground, marginBottom: spacing.md, letterSpacing: 0.8 }]}>
                    QUICK FILTERS
                  </Text>
                  <View style={[styles.pillRow, { gap: spacing.md, marginBottom: 28 }]}>
                    {quickFilters.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        activeOpacity={0.7}
                        onPress={() => onChangeText(tag.startsWith('#') ? tag : '#' + tag)}
                        accessibilityRole="button"
                        accessibilityLabel={`Quick search ${tag}`}
                        style={[
                          styles.pill,
                          { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '40', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
                        ]}
                      >
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                        <Text style={[typography.bodySmBold, { color: colors.onPrimaryContainer || colors.primary, fontSize: 13, letterSpacing: 0.3 }]}>
                          {tag.startsWith('#') ? tag : '#' + tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.tipBox, { backgroundColor: colors.muted, borderColor: colors.outlineVariant, borderRadius: 16, padding: 20 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={18} color={colors.primary} />
                      </View>
                      <Text style={[typography.bodySmBold, { color: colors.foreground, fontSize: 16 }]}>Pro Search Tips</Text>
                    </View>
                    <Text style={[typography.bodySm, { color: colors.mutedForeground, fontSize: 14, lineHeight: 22 }]}>
                      • Search by exact issue ID (e.g. #104){'\n'}
                      • Type keywords like status, priority, or severity{'\n'}
                      • Tap #BUG or #IMPROVEMENT above to filter instantly
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.centerHint}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
                    <Search size={32} color={colors.primary} />
                  </View>
                  <Text style={[typography.bodySmBold, { color: colors.foreground, fontSize: 16, marginTop: 16 }]}>
                    Keep typing...
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center', marginTop: 4, fontSize: 14 }]}>
                    Enter at least {minChars} characters to search across all fields
                  </Text>
                </View>
              )}
            </View>
          ) : resultCount === 0 ? (
            <View style={styles.centerHint}>
              <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
                <Search size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[typography.bodySmBold, { color: colors.foreground, fontSize: 18, marginTop: 16 }]}>
                No matches found
              </Text>
              <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center', marginTop: 6, fontSize: 14, maxWidth: 260 }]}>
                We couldn't find any results for “{trimmed}”. Try searching by status, priority, or ID.
              </Text>
              <TouchableOpacity
                style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.primaryContainer, borderWidth: 1, borderColor: colors.primary + '30' }}
                onPress={() => onChangeText('')}
              >
                <Text style={[typography.bodySmBold, { color: colors.onPrimaryContainer || colors.primary, fontSize: 14 }]}>Clear search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md }}>
              {children}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 18,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  input: { flex: 1, height: '100%', paddingVertical: 0, fontFamily: 'Outfit_600SemiBold', fontSize: 16 },
  panel: {
    flex: 1,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  hintContainer: { flex: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { borderWidth: 1 },
  tipBox: { borderWidth: 1 },
  centerHint: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
