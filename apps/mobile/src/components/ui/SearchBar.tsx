import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}

/** Figma search field: card bg + soft shadow, lime focus, clear button. */
export default function SearchBar({ value, onChangeText, placeholder = 'Search…' }: SearchBarProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.card, borderRadius: radius.lg },
      ]}
    >
      <Search size={14} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground }]}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
          <X size={13} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 12,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  input: { flex: 1, height: '100%', paddingVertical: 0, fontFamily: 'Outfit_400Regular', fontSize: 14 },
});
