import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

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
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
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
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            {label && <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{label}</Text>}
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    activeOpacity={0.7}
                    onPress={() => { onChange(o.value); setOpen(false); }}
                    style={styles.row}
                  >
                    <Text style={[styles.rowText, { color: active ? colors.greenFg : colors.foreground }]}>
                      {o.label}
                    </Text>
                    {active && <Check size={15} color={colors.green} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  value: { flex: 1, fontFamily: 'Outfit_400Regular', fontSize: 14, marginRight: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
  sheetTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  rowText: { fontFamily: 'Outfit_500Medium', fontSize: 14 },
});
