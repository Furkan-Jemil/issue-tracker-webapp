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
        <View style={[styles.bar, { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.lg }]}>
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
        <View style={[styles.panel, { backgroundColor: colors.card, borderRadius: radius.xl, marginHorizontal: spacing.lg, marginTop: spacing.sm }]}>
          {!meetsMin ? (
            <View style={[styles.hintContainer, { padding: spacing.lg }]}>
              {trimmed.length === 0 ? (
                <>
                  <Text style={[typography.labelBadge, { color: colors.mutedForeground, marginBottom: spacing.sm }]}>
                    QUICK FILTERS
                  </Text>
                  <View style={[styles.pillRow, { gap: spacing.sm, marginBottom: spacing.xl }]}>
                    {['BUG', 'CRITICAL', 'HIGH', 'OPEN', 'IN_PROGRESS'].map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        activeOpacity={0.7}
                        onPress={() => onChangeText(tag)}
                        accessibilityRole="button"
                        accessibilityLabel={`Quick search ${tag}`}
                        style={[
                          styles.pill,
                          { backgroundColor: colors.background, borderColor: colors.cardBorder, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8 },
                        ]}
                      >
                        <Text style={[typography.bodySmBold, { color: colors.foreground, fontSize: 12 }]}>
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.tipBox, { backgroundColor: colors.background + '80', borderColor: colors.cardBorder, borderRadius: radius.lg, padding: spacing.md }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Search size={18} color={colors.primary} />
                      <Text style={[typography.bodySmBold, { color: colors.foreground }]}>Pro Search Tips</Text>
                    </View>
                    <Text style={[typography.bodySm, { color: colors.mutedForeground, lineHeight: 18 }]}>
                      • Search by exact issue ID (e.g. #104){'\n'}
                      • Type keyword from issue title or description{'\n'}
                      • Tap a quick filter above to jump straight to priority tasks
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.centerHint}>
                  <Search size={32} color={colors.mutedForeground + '55'} />
                  <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm }]}>
                    Keep typing — {minChars}+ characters to search
                  </Text>
                </View>
              )}
            </View>
          ) : resultCount === 0 ? (
            <View style={styles.centerHint}>
              <Search size={32} color={colors.mutedForeground + '55'} />
              <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm }]}>
                No matches found for “{trimmed}”
              </Text>
              <TouchableOpacity
                style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder }}
                onPress={() => onChangeText('')}
              >
                <Text style={[typography.bodySmBold, { color: colors.foreground, fontSize: 13 }]}>Clear search</Text>
              </TouchableOpacity>
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
  dim: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  input: { flex: 1, height: '100%', paddingVertical: 0, fontFamily: 'Outfit_500Medium', fontSize: 16 },
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
  hintContainer: { flex: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { borderWidth: 1 },
  tipBox: { borderWidth: 1 },
  centerHint: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
});
