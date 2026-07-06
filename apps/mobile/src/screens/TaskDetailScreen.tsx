import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
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
  Skeleton,
} from '../components/ui';
import TwoPane from '../responsive/TwoPane';
import { relativeTime, getInitials, shortId } from '../utils/formatters';
import { useToast } from '../components/Toast';

// Mirror of the canonical workflow in @workspace/shared/statusWorkflow — kept
// local to avoid bundling the shared package (and its CASL deps) into the RN app.
const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['OPEN'],
};

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
  const { colors, isTablet, pagePadding, spacing, typography } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { issueId } = route.params as { issueId: string };

  const { issues, members, isLoading, user } = useAppContext();
  const { deleteIssue, updateIssue, auditLogs, addComment } = useAppContext();
  const { showToast } = useToast();

  const issueList = issues as unknown as Issue[];
  const memberList = members as unknown as Member[];
  const issue = issueList.find((i) => i.id === issueId);

  const [status, setStatus] = useState(issue?.status ?? '');
  const [priority, setPriority] = useState(issue?.priority ?? '');
  const [severity, setSeverity] = useState(issue?.severity ?? '');
  const [assignee, setAssignee] = useState(issue?.assignee ?? '');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(issue?.comments ?? []);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const issueLogs = (auditLogs as any[]).filter(
    (l: any) => (l.issueId ?? l.issue?.id) === issue?.id
  ).sort((a: any, b: any) => new Date(b.created_at ?? b.createdAt).getTime() - new Date(a.created_at ?? a.createdAt).getTime());

  if (isLoading) {
    return (
      <Screen title="Issue Detail">
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton width="40%" height={12} borderRadius={4} />
          <Skeleton width="80%" height={22} borderRadius={6} />
          <View style={{ flexDirection: 'row', gap: spacing.iconGap }}>
            <Skeleton width={60} height={22} borderRadius={6} />
            <Skeleton width={60} height={22} borderRadius={6} />
          </View>
          <Skeleton width="100%" height={120} borderRadius={12} />
          <Skeleton width="100%" height={80} borderRadius={12} />
        </View>
      </Screen>
    );
  }

  if (!issue) {
    return (
      <Screen title="Issue Not Found" scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center' }]}>
            The issue you're looking for doesn't exist or has been deleted.
          </Text>
        </View>
      </Screen>
    );
  }

  const assigneeOptions = memberList.map((m) => ({ value: m.name, label: m.name }));


  const onFieldChange = (field: string, value: string, setter: (v: string) => void, previous: string) => {
    setter(value);
    setSaving((prev) => ({ ...prev, [field]: true }));
    updateIssue(issue.id, { [field]: value })
      .catch((err) => {
        // Revert the control and surface the reason (e.g. invalid status transition).
        setter(previous);
        showToast({ message: err instanceof Error ? err.message : `Failed to update ${field}`, type: 'error' });
      })
      .finally(() => {
        setSaving((prev) => ({ ...prev, [field]: false }));
      });
  };

  const postComment = async () => {
    const body = comment.trim();
    if (!body) return;
    try {
      const saved = await addComment(issue.id, body);
      setComments((prev) => [...prev, saved]);
      setComment('');
    } catch (err) {
      // Do NOT fake a comment on failure — surface the real error instead.
      showToast({ message: err instanceof Error ? err.message : 'Failed to post comment', type: 'error' });
    }
  };

  const onDelete = () => {
    Alert.alert('Delete Issue', `Are you sure you want to delete ${shortId(issue.id)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteIssue(issue.id);
        navigation.goBack();
      }},
    ]);
  };

  const headerBlock = (
    <View style={[styles.headerBlock, { gap: spacing.lg }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={[styles.idRow, { gap: spacing.sm, marginBottom: spacing.xs }]}>
          <Text style={[typography.monoId, { color: colors.mutedForeground }]}>{shortId(issue.id)}</Text>
          <Badge kind="type" value={issue.type} />
        </View>
        <Text style={[typography.detailTitle, { color: colors.foreground }]}>{issue.title}</Text>
        <View style={[styles.badgeRow, { gap: spacing.iconGap, marginTop: spacing.sm }]}>
          <Badge kind="status" value={status} />
          <Badge kind="priority" value={priority} />
          <Badge kind="severity" value={severity} />
        </View>
      </View>
      <View style={[styles.headerActions, { gap: spacing.sm }]}>
          <Button
            title="Edit"
            variant="outline"
            size="sm"
            icon={<Edit3 size={12} color={colors.foreground} />}
            onPress={() => navigation.navigate('CreateTask', { issue: { id: issue.id, title: issue.title, description: issue.description, type: issue.type, priority: issue.priority, severity: issue.severity, assignee: issue.assignee } })}
          />
        <Button
          title="Delete"
          variant="destructive"
          size="sm"
          icon={<Trash2 size={12} color="#fff" />}
          onPress={onDelete}
        />
      </View>
    </View>
  );

  const main = (
    <View style={{ gap: spacing.xl }}>
      {/* Description */}
      <View style={{ gap: spacing.sm }}>
        <SecLabel>Description</SecLabel>
        <Card padding={spacing.cardPadding}>
          <Text style={[typography.bodySm, { color: colors.foreground }]}>{issue.description}</Text>
        </Card>
      </View>

      {/* Activity Timeline */}
      {issueLogs.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <SecLabel>Activity ({issueLogs.length})</SecLabel>
          <Card padding={spacing.cardPadding}>
            <View style={{ gap: spacing.md }}>
              {issueLogs.map((log: any) => (
                <View key={log.id} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.mutedForeground }]} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[typography.bodySm, { color: colors.foreground, fontSize: 12 }]}>{log.description}</Text>
                    <Text style={[styles.time, { color: colors.mutedForeground }]}>{relativeTime(log.created_at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}

      {/* Comments */}
      <View style={{ gap: spacing.sm }}>
        <SecLabel>Comments ({comments.length})</SecLabel>
        <View style={{ gap: spacing.md }}>
          {comments.map((c) => (
            <Card key={c.id} padding={spacing.cardPadding}>
              <View style={[styles.commentRow, { gap: spacing.md }]}>
                <Avatar initials={getInitials(c.author)} size="sm" />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <View style={styles.commentMeta}>
                      <Text style={[typography.labelBadge, { color: colors.foreground }]}>{c.author}</Text>
                      <Text style={[styles.time, { color: colors.mutedForeground }]}>
                        {relativeTime(c.created_at)}
                      </Text>
                    </View>
                    <Text style={[typography.bodySm, { color: colors.foreground }]}>{c.body}</Text>
                </View>
              </View>
            </Card>
          ))}

          {/* Composer */}
          <Card padding={spacing.md}>
            <View style={{ gap: spacing.sm }}>
              <View style={[styles.composerRow, { gap: spacing.sm }]}>
                <Avatar initials={getInitials(user?.name, user?.email)} size="sm" />
                <View style={{ flex: 1 }}>
                  <Textarea
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Add a comment…"
                    rows={2}
                  />
                </View>
              </View>
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
          </Card>
        </View>
      </View>
    </View>
  );

  const side = (
    <View style={[{ gap: spacing.lg }, isTablet ? null : { marginTop: spacing.lg }]}>
      <Card padding={spacing.cardPadding}>
        <View style={{ gap: spacing.lg }}>
          <SecLabel>Issue Details</SecLabel>
          <Select
            label="Status"
            value={status}
            options={STATUS_OPTIONS.filter((o) => o.value === status || (STATUS_TRANSITIONS[status] ?? []).includes(o.value))}
            onChange={(v) => onFieldChange('status', v, setStatus, status)}
          />
          <Select
            label="Priority"
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={(v) => onFieldChange('priority', v, setPriority, priority)}
          />
          <Select
            label="Severity"
            value={severity}
            options={SEVERITY_OPTIONS}
            onChange={(v) => onFieldChange('severity', v, setSeverity, severity)}
          />
          <Select
            label="Assignee"
            value={assignee}
            options={assigneeOptions}
            onChange={(v) => onFieldChange('assignee', v, setAssignee, assignee)}
            placeholder="Unassigned"
          />

          <View style={[styles.divider, { borderTopColor: colors.cardBorder, paddingTop: spacing.md, gap: spacing.sm }]}>
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
            onPress={onDelete}
          />
        </View>
      </Card>
    </View>
  );

  return (
    <Screen
      title={`Issue ${shortId(issue.id)}`}
      subtitle="Full task context and activity"
      onBack={() => navigation.goBack()}
    >
      <View style={{ paddingHorizontal: pagePadding, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: spacing.xl }}>
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
      <Text style={[{ fontFamily: 'Outfit_500Medium', fontSize: 11, lineHeight: 14, color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[{ fontFamily: 'Outfit_600SemiBold', fontSize: 12, lineHeight: 16, color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: { flexDirection: 'row', alignItems: 'flex-start' },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  composerRow: { flexDirection: 'row', alignItems: 'center' },
  composerAvatarWrap: { alignSelf: 'center' },
  commentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontFamily: 'Outfit_400Regular', fontSize: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
});
