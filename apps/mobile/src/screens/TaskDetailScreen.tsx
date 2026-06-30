import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Edit3, Trash2, Send } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import {
  Screen,
  Card,
  Badge,
  Avatar,
  Button,
  Select,
  Textarea,
  SecLabel,
} from '../components/ui';
import TwoPane from '../responsive/TwoPane';
import { relativeTime, getInitials } from '../utils/formatters';

interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  severity: string;
  type: string;
  reporter: string;
  assignee?: string;
  created_at: string;
  category?: string;
  comments: Comment[];
}

interface Member {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];
const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];
const SEVERITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'MINOR', label: 'Minor' },
];

export default function TaskDetailScreen() {
  const { colors, isTablet, pagePadding } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { issueId } = route.params as { issueId: string };

  const { issues, members } = useAppContext();
  const issueList = issues as unknown as Issue[];
  const memberList = members as unknown as Member[];
  const issue = issueList.find((i) => i.id === issueId) ?? issueList[0];

  const assigneeOptions = memberList.map((m) => ({ value: m.name, label: m.name }));

  const [status, setStatus] = useState(issue.status);
  const [priority, setPriority] = useState(issue.priority);
  const [severity, setSeverity] = useState(issue.severity);
  const [assignee, setAssignee] = useState(issue.assignee ?? '');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(issue.comments ?? []);

  const postComment = () => {
    const body = comment.trim();
    if (!body) return;
    setComments((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, author: 'You', body, created_at: new Date().toISOString() },
    ]);
    setComment('');
  };

  const headerBlock = (
    <View style={styles.headerBlock}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.idRow}>
          <Text style={[styles.monoId, { color: colors.mutedForeground }]}>{issue.id}</Text>
          <Badge kind="type" value={issue.type} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{issue.title}</Text>
        <View style={styles.badgeRow}>
          <Badge kind="status" value={status} />
          <Badge kind="priority" value={priority} />
          <Badge kind="severity" value={severity} />
        </View>
      </View>
      {isTablet && (
        <View style={styles.headerActions}>
          <Button
            title="Edit"
            variant="outline"
            size="sm"
            icon={<Edit3 size={12} color={colors.foreground} />}
          />
          <Button
            title="Delete"
            variant="destructive"
            size="sm"
            icon={<Trash2 size={12} color="#fff" />}
          />
        </View>
      )}
    </View>
  );

  const main = (
    <View style={{ gap: 20 }}>
      {/* Description */}
      <View style={{ gap: 8 }}>
        <SecLabel>Description</SecLabel>
        <Card padding={16}>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>{issue.description}</Text>
        </Card>
      </View>

      {/* Comments */}
      <View style={{ gap: 8 }}>
        <SecLabel>Comments ({comments.length})</SecLabel>
        <View style={{ gap: 12 }}>
          {comments.map((c) => (
            <Card key={c.id} padding={16}>
              <View style={styles.commentRow}>
                <Avatar initials={getInitials(c.author)} size="sm" />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.commentMeta}>
                    <Text style={[styles.author, { color: colors.foreground }]}>{c.author}</Text>
                    <Text style={[styles.time, { color: colors.mutedForeground }]}>
                      {relativeTime(c.created_at)}
                    </Text>
                  </View>
                  <Text style={[styles.bodyText, { color: colors.foreground }]}>{c.body}</Text>
                </View>
              </View>
            </Card>
          ))}

          {/* Composer */}
          <Card padding={12}>
            <View style={styles.commentRow}>
              <Avatar initials="YOU" size="sm" />
              <View style={{ flex: 1, gap: 8 }}>
                <Textarea
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Add a comment…"
                  rows={2}
                />
                <View style={{ alignSelf: 'flex-end' }}>
                  <Button
                    title="Post comment"
                    variant="default"
                    size="sm"
                    icon={<Send size={12} color="#fff" />}
                    onPress={postComment}
                  />
                </View>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </View>
  );

  const side = (
    <View style={[{ gap: 16 }, isTablet ? null : { marginTop: 20 }]}>
      <Card padding={16}>
        <View style={{ gap: 16 }}>
          <SecLabel>Issue Details</SecLabel>
          <Select label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <Select
            label="Priority"
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={setPriority}
          />
          <Select
            label="Severity"
            value={severity}
            options={SEVERITY_OPTIONS}
            onChange={setSeverity}
          />
          <Select
            label="Assignee"
            value={assignee}
            options={assigneeOptions}
            onChange={setAssignee}
            placeholder="Unassigned"
          />

          <View style={[styles.divider, { borderTopColor: colors.cardBorder }]}>
            <MetaRow label="Reporter" value={issue.reporter} colors={colors} />
            <MetaRow label="Created" value={relativeTime(issue.created_at)} colors={colors} />
            {issue.category ? (
              <MetaRow label="Category" value={issue.category} colors={colors} />
            ) : null}
          </View>

          <Button
            title="Delete Issue"
            variant="destructive"
            fullWidth
            icon={<Trash2 size={13} color="#fff" />}
          />
        </View>
      </Card>
    </View>
  );

  return (
    <Screen
      title={issue.id}
      subtitle="Full task context and activity"
      onBack={() => navigation.goBack()}
    >
      <View style={{ paddingHorizontal: pagePadding, paddingVertical: 20, gap: 20 }}>
        {headerBlock}
        <TwoPane main={main} side={side} sideWidth={300} />
      </View>
    </Screen>
  );
}

function MetaRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  monoId: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 18, lineHeight: 24 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bodyText: { fontFamily: 'Outfit_400Regular', fontSize: 14, lineHeight: 22 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  time: { fontFamily: 'Outfit_400Regular', fontSize: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12 },
  metaValue: { fontFamily: 'Outfit_500Medium', fontSize: 12 },
});
