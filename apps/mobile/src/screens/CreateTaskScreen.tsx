import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const { colors, pagePadding } = useTheme();
  const { isTablet } = useResponsive();
  const navigation = useNavigation<any>();
  const { members } = useAppContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('BUG');
  const [priority, setPriority] = useState('MEDIUM');
  const [severity, setSeverity] = useState('MINOR');
  const [assignee, setAssignee] = useState('');
  const [url, setUrl] = useState('');

  const assigneeOptions: SelectOption[] = [
    { value: '', label: 'Unassigned' },
    ...members.map((m) => ({ value: String(m.name ?? ''), label: String(m.name ?? 'Unknown') })),
  ];

  const goBack = () => navigation.goBack();

  return (
    <Screen
      title="Create Issue"
      subtitle="Report a new bug or improvement"
      onBack={goBack}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 640,
          alignSelf: 'center',
          paddingHorizontal: pagePadding,
          paddingVertical: 20,
          gap: 20,
        }}
      >
        <Input
          label="Issue Title"
          required
          placeholder="Brief, descriptive title"
          value={title}
          onChangeText={setTitle}
        />

        <Textarea
          label="Description"
          rows={5}
          placeholder="Detailed description — steps to reproduce, expected vs actual behavior."
          value={description}
          onChangeText={setDescription}
        />

        <Grid columns={isTablet ? 4 : 2} gap={12}>
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

        <View style={{ gap: 6 }}>
          <Text style={[styles.label, { color: colors.foreground }]}>Screenshots & Files</Text>
          <Card padding={0}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.upload, { borderColor: colors.outline }]}
            >
              <Paperclip size={22} color={colors.mutedForeground} />
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
                Tap to add files
              </Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
                PNG, JPG, PDF, TXT up to 10 MB
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.footer}>
          <Button title="Cancel" variant="outline" onPress={goBack} style={{ flex: 1 }} />
          <Button title="Create Task" variant="default" onPress={goBack} style={{ flex: 1 }} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  upload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  uploadTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, marginTop: 2 },
  uploadSub: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 4 },
});
