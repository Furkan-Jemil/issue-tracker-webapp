import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  FilePlus,
  History,
  MessageSquare,
  UserCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Screen, Card, SecLabel, Avatar, Button } from '../components/ui';
import { relativeTime, getInitials, shortId } from '../utils/formatters';

function getEventBadge(colors: any, type: string) {
  switch (type) {
    case 'CREATED':
      return { icon: FilePlus, color: colors.primary, label: 'Created' };
    case 'STATUS_CHANGED':
      return { icon: History, color: colors.error, label: 'Status Changed' };
    case 'COMMENT_ADDED':
      return { icon: MessageSquare, color: colors.onSurfaceVariant, label: 'Comment Added' };
    case 'PRIORITY_CHANGED':
      return { icon: AlertTriangle, color: colors.chartOpen, label: 'Priority Changed' };
    case 'ASSIGNEE_CHANGED':
      return { icon: UserCheck, color: colors.chartResolved, label: 'Assignee Changed' };
    case 'SEVERITY_CHANGED':
      return { icon: AlertTriangle, color: colors.error, label: 'Severity Changed' };
    case 'TYPE_CHANGED':
      return { icon: Sparkles, color: colors.chartInProgress, label: 'Type Changed' };
    default:
      return { icon: History, color: colors.onSurfaceVariant, label: (type || 'Event').replace(/_/g, ' ') };
  }
}

export default function AuditDetailScreen() {
  const { colors, spacing, typography, radius, pagePadding } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { entry } = (route.params as { entry: any }) ?? { entry: null };
  const { members, issues } = useAppContext();

  if (!entry) {
    return (
      <Screen title="Audit Entry" scroll={false} onBack={() => navigation.goBack()}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={[typography.bodySm, { color: colors.mutedForeground, textAlign: 'center' }]}>
            This audit entry could not be found.
          </Text>
        </View>
      </Screen>
    );
  }

  const eventType = entry.eventType ?? entry.type ?? '';
  const event = getEventBadge(colors, eventType);
  const EventIcon = event.icon;

  const userId = entry.userId ?? entry.user?.id ?? entry.createdBy ?? entry.actorId;
  const member = (members as any[]).find((m) => m.id === userId);
  const actorName = member?.name ?? entry.user?.name ?? entry.actor?.name ?? 'Unknown user';
  const actorEmail = member?.email ?? entry.user?.email ?? entry.actor?.email;

  const issueId = entry.issueId ?? entry.issue?.id ?? null;
  const relatedIssue = issueId ? (issues as any[]).find((i) => i.id === issueId) : null;
  const createdAt = entry.createdAt ?? entry.created_at ?? entry.timestamp ?? '';

  const detailRows: { label: string; value: string }[] = [
    { label: 'Event', value: event.label },
    { label: 'Actor', value: actorName },
    ...(createdAt ? [{ label: 'When', value: relativeTime(createdAt) }] : []),
    ...(entry.oldValue != null ? [{ label: 'From', value: String(entry.oldValue) }] : []),
    ...(entry.newValue != null ? [{ label: 'To', value: String(entry.newValue) }] : []),
    ...(issueId ? [{ label: 'Issue', value: shortId(String(issueId)) }] : []),
  ];

  return (
    <Screen
      title="Audit Entry"
      subtitle="Change detail and context"
      onBack={() => navigation.goBack()}
    >
      <View style={{ paddingHorizontal: pagePadding, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: spacing.xl }}>
        {/* Event header */}
        <Card padding={spacing.cardPadding}>
          <View style={[styles.row, { gap: spacing.md }]}>
            <View style={[styles.iconWrap, { backgroundColor: event.color + '20', borderRadius: radius.full }]}>
              <EventIcon size={20} color={event.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[typography.micro, { color: event.color, fontWeight: '700' }]}>{event.label}</Text>
              <Text style={[typography.bodySm, { color: colors.foreground }]}>
                {entry.description ?? entry.message ?? 'No description available.'}
              </Text>
              {createdAt ? (
                <Text style={[typography.micro, { color: colors.mutedForeground }]}>{relativeTime(createdAt)}</Text>
              ) : null}
            </View>
          </View>
        </Card>

        {/* Actor */}
        <View style={{ gap: spacing.sm }}>
          <SecLabel>Performed by</SecLabel>
          <Card padding={spacing.cardPadding}>
            <View style={[styles.row, { gap: spacing.md, alignItems: 'center' }]}>
              <Avatar initials={getInitials(actorName, actorEmail)} size="sm" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[typography.labelBadge, { color: colors.foreground }]}>{actorName}</Text>
                {actorEmail ? (
                  <Text style={[typography.micro, { color: colors.mutedForeground }]} numberOfLines={1}>{actorEmail}</Text>
                ) : null}
              </View>
            </View>
          </Card>
        </View>

        {/* Details */}
        <View style={{ gap: spacing.sm }}>
          <SecLabel>Details</SecLabel>
          <Card padding={spacing.cardPadding}>
            <View style={{ gap: spacing.sm }}>
              {detailRows.map((r) => (
                <View key={r.label} style={styles.metaRow}>
                  <Text style={[typography.micro, { color: colors.mutedForeground }]}>{r.label}</Text>
                  <Text style={[typography.bodySm, { color: colors.foreground, textAlign: 'right', flexShrink: 1, marginLeft: spacing.md }]} numberOfLines={2}>
                    {r.value}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Jump to related issue */}
        {issueId ? (
          <Button
            title={relatedIssue ? `View issue ${shortId(String(issueId))}` : 'View related issue'}
            variant="outline"
            fullWidth
            icon={<ArrowRight size={14} color={colors.foreground} />}
            onPress={() => navigation.navigate('TaskDetail', { issueId })}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
