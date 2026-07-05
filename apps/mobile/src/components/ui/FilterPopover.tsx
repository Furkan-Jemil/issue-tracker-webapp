import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import Select from './Select';
import Button from './Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FilterPopoverProps {
  visible: boolean;
  onClose: () => void;
  statusF: string;
  priorityF: string;
  severityF: string;
  onApply: (status: string, priority: string, severity: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'MINOR', label: 'Minor' },
];

export default function FilterPopover({
  visible,
  onClose,
  statusF,
  priorityF,
  severityF,
  onApply,
}: FilterPopoverProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Temporary state for the popover
  const [tempStatus, setTempStatus] = useState(statusF);
  const [tempPriority, setTempPriority] = useState(priorityF);
  const [tempSeverity, setTempSeverity] = useState(severityF);

  // Sync temp state when opened
  useEffect(() => {
    if (visible) {
      setTempStatus(statusF || 'all');
      setTempPriority(priorityF || 'all');
      setTempSeverity(severityF || 'all');
    }
  }, [visible, statusF, priorityF, severityF]);

  const activeCount = [tempStatus, tempPriority, tempSeverity].filter((f) => f && f !== 'all').length;

  const handleApply = () => {
    onApply(tempStatus, tempPriority, tempSeverity);
    onClose();
  };

  const clearFilters = () => {
    setTempStatus('all');
    setTempPriority('all');
    setTempSeverity('all');
    onApply('all', 'all', 'all');
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close filters" />
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderRadius: radius.xl }]}>
          <View style={[styles.filterHeader, { marginBottom: spacing.md }]}>
            <Text style={[typography.cardTitle, { color: colors.foreground }]}>Filters</Text>
            {activeCount > 0 && (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear all filters" onPress={clearFilters} hitSlop={8}>
                <Text style={[typography.statLabel, { color: colors.mutedForeground }]}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={{ gap: spacing.md }}>
            <Select label="Status" value={tempStatus || 'all'} options={STATUS_OPTIONS} onChange={(v) => setTempStatus(v)} />
            <Select label="Priority" value={tempPriority || 'all'} options={PRIORITY_OPTIONS} onChange={(v) => setTempPriority(v)} />
            <Select label="Severity" value={tempSeverity || 'all'} options={SEVERITY_OPTIONS} onChange={(v) => setTempSeverity(v)} />
          </View>
          
          <View style={[styles.footer, { marginTop: spacing.xl, borderTopColor: colors.cardBorder }]}>
            <View style={{ flex: 1 }} />
            <Button title="Apply Filters" size="md" onPress={handleApply} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  modalCard: {
    width: 300,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    flexDirection: 'row',
  },
});
