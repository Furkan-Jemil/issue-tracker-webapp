import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Send } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { safeFetch } from '../utils/api';
import { Card } from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import Input from '../components/Input';
import Button from '../components/Button';
import AnimatedEntry from '../components/AnimatedEntry';

const TYPE_OPTIONS = ['BUG', 'IMPROVEMENT'] as const;
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'] as const;
const SEVERITY_OPTIONS = ['MINOR', 'MAJOR', 'CRITICAL'] as const;

export default function CreateTaskScreen() {
  const { colors, typography, spacing } = useTheme();
  const { refreshData } = useAppContext();
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('BUG');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [severity, setSeverity] = useState<string>('MINOR');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the issue.');
      return;
    }
    setLoading(true);
    try {
      await safeFetch('/api/issues', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), description: description.trim(), type, priority, severity }),
      });
      Alert.alert('Success', 'Issue created successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      refreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const renderChip = (label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      style={[styles.chip, { backgroundColor: selected ? colors.primaryContainer : colors.surfaceContainerLow, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: selected ? colors.primaryContainer : colors.input }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[typography.labelBadge, { color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TopAppBar title="Create Issue" onBackPress={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.pageMargin }]} keyboardShouldPersistTaps="handled">
          <AnimatedEntry index={0}>
            <Card style={{ marginTop: spacing.lg }}>
              <View style={{ gap: spacing.md }}>
                <Input label="Title *" placeholder="Brief description of the issue" value={title} onChangeText={setTitle} editable={!loading} autoCapitalize="sentences" />

                <View>
                  <Text style={[typography.bodySmBold, { color: colors.onSurface, marginBottom: spacing.xs }]}>Description</Text>
                  <View style={[styles.well, { backgroundColor: colors.surfaceContainerLow, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
                    <TextInput
                      placeholder="Detailed description..."
                      placeholderTextColor={colors.onSurfaceVariant}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      textAlignVertical="top"
                      editable={!loading}
                      style={[typography.bodySm, { color: colors.onSurface, minHeight: 100, padding: 0, margin: 0 }]}
                    />
                  </View>
                </View>

                <View>
                  <Text style={[typography.bodySmBold, { color: colors.onSurface, marginBottom: spacing.sm }]}>Type</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {TYPE_OPTIONS.map((opt) => renderChip(opt, type === opt, () => setType(opt)))}
                  </View>
                </View>

                <View>
                  <Text style={[typography.bodySmBold, { color: colors.onSurface, marginBottom: spacing.sm }]}>Priority</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {PRIORITY_OPTIONS.map((opt) => renderChip(opt, priority === opt, () => setPriority(opt)))}
                  </View>
                </View>

                <View>
                  <Text style={[typography.bodySmBold, { color: colors.onSurface, marginBottom: spacing.sm }]}>Severity</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {SEVERITY_OPTIONS.map((opt) => renderChip(opt, severity === opt, () => setSeverity(opt)))}
                  </View>
                </View>

                <Button
                  title={loading ? 'Creating...' : 'Create Issue'}
                  onPress={handleSubmit}
                  variant="tonal"
                  size="lg"
                  loading={loading}
                  icon={<Send size={18} color={colors.onPrimaryContainer} />}
                />
              </View>
            </Card>
          </AnimatedEntry>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  chip: { marginBottom: 4 },
  well: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
});
