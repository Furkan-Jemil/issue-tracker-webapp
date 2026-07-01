import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Link, Paperclip } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { useResponsive } from '../responsive/useResponsive';
import Grid from '../responsive/Grid';
import { Screen, Card, Input, Textarea, Select, Button } from '../components/ui';
import type { SelectOption } from '../components/ui';

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'BUG', label: 'Bug' },
  { value: 'IMPROVEMENT', label: 'Improvement' },
];
const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];
const SEVERITY_OPTIONS: SelectOption[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'MINOR', label: 'Minor' },
];

export default function CreateTaskScreen() {
  const { colors, spacing, typography, pagePadding } = useTheme();
  const { isTablet } = useResponsive();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { members, createIssue } = useAppContext();

  const editing = (route.params as any)?.issue;
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [type, setType] = useState(editing?.type ?? 'BUG');
  const [priority, setPriority] = useState(editing?.priority ?? 'MEDIUM');
  const [severity, setSeverity] = useState(editing?.severity ?? 'MINOR');
  const [assignee, setAssignee] = useState(editing?.assignee ?? '');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const assigneeOptions: SelectOption[] = [
    { value: '', label: 'Unassigned' },
    ...members.map((m) => ({ value: String(m.name ?? ''), label: String(m.name ?? 'Unknown') })),
  ];

  const goBack = () => navigation.goBack();

  return (
    <Screen
      title={editing ? 'Edit Issue' : 'Create Issue'}
      subtitle={editing ? `Editing ${editing.title}` : 'Report a new bug or improvement'}
      onBack={goBack}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 640,
          alignSelf: 'center',
          paddingHorizontal: pagePadding,
          paddingVertical: spacing.xl,
          gap: spacing.xl,
        }}
      >
        <Input
          label="Issue Title"
          required
          placeholder="Brief, descriptive title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />

        <Textarea
          label="Description"
          rows={5}
          placeholder="Detailed description — steps to reproduce, expected vs actual behavior."
          value={description}
          onChangeText={setDescription}
          error={errors.description}
        />

        <Grid columns={isTablet ? 4 : 2} gap={spacing.md}>
          <Select label="Type" value={type} options={TYPE_OPTIONS} onChange={setType} />
          <Select label="Priority" value={priority} options={PRIORITY_OPTIONS} onChange={setPriority} />
          <Select label="Severity" value={severity} options={SEVERITY_OPTIONS} onChange={setSeverity} />
          <Select label="Assignee" value={assignee} options={assigneeOptions} onChange={setAssignee} />
        </Grid>

        <Input
          label="Reference URL"
          placeholder="https://…"
          leftIcon={<Link size={14} color={colors.mutedForeground} />}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <View style={{ gap: spacing.xs }}>
          <Text style={[typography.labelBadge, { color: colors.foreground }]}>Screenshots & Files</Text>
          <Card padding={0}>
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add file attachments"
              style={[styles.upload, { borderColor: colors.outline, paddingHorizontal: spacing.lg, gap: spacing.xs }]}
            >
              <Paperclip size={22} color={colors.mutedForeground} />
              <Text style={[typography.bodySmBold, { color: colors.foreground }]}>
                Tap to add files
              </Text>
              <Text style={[typography.micro, { color: colors.mutedForeground }]}>
                PNG, JPG, PDF, TXT up to 10 MB
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={[styles.footer, { gap: spacing.md }]}>
            <Button title="Cancel" variant="outline" onPress={goBack} style={{ flex: 1 }} />
            <Button title={editing ? 'Save' : 'Create Task'} variant="default" onPress={async () => {
              if (!validate()) return;
              if (editing) {
                goBack();
              } else {
                await createIssue({ title, description, type, priority, severity, assignee: assignee || '' });
                goBack();
              }
            }} style={{ flex: 1 }} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {},
  upload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 28,
    alignItems: 'center',
  },
  uploadTitle: { marginTop: 2 },
  uploadSub: {},
  footer: { flexDirection: 'row', paddingTop: 4 },
});
