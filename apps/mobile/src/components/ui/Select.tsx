import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutRectangle } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import ContextualPopover, { ContextualAnchor } from './ContextualPopover';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

/** Native-friendly select: a pressable field that opens a bottom-sheet picker. */
export default function Select({ label, value, options, onChange, placeholder = 'Select…', height = 36 }: SelectProps) {
  const { colors, radius, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<LayoutRectangle | null>(null);
  const current = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>}
      <ContextualAnchor
        activeOpacity={0.7}
        onPressAnchor={(rect) => { setAnchorRect(rect); setOpen(true); }}
        style={[
          styles.field,
          { backgroundColor: colors.card, borderColor: colors.outline, borderRadius: radius.lg, height },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.value, { color: current ? colors.foreground : colors.mutedForeground }]}
        >
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown size={14} color={colors.mutedForeground} />
      </ContextualAnchor>

      <ContextualPopover
        visible={open}
        onClose={() => setOpen(false)}
        anchorRect={anchorRect}
        width={anchorRect ? anchorRect.width : 200}
        offset={4}
      >
        <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <TouchableOpacity
                key={o.value}
                activeOpacity={0.7}
                onPress={() => { onChange(o.value); setOpen(false); }}
                style={[styles.row, { borderBottomColor: colors.cardBorder }]}
              >
                <Text style={[styles.rowText, { color: active ? colors.greenFg : colors.foreground }]}>
                  {o.label}
                </Text>
                {active && <Check size={15} color={colors.green} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ContextualPopover>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  value: { flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 16, marginRight: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { fontFamily: 'Outfit_500Medium', fontSize: 15 },
});
