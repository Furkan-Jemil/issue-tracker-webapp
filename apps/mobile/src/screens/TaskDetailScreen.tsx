import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardRow } from '../components/Card';
import TopAppBar from '../components/TopAppBar';
import StatusPill from '../components/StatusPill';
import AnimatedEntry from '../components/AnimatedEntry';
import EmptyState from '../components/EmptyState';

export default function TaskDetailScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { issues } = useAppContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { issueId } = (route.params || {}) as any;

  const issue = useMemo(() => issues.find((i) => i.id === issueId), [issues, issueId]);

  if (!issue) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <TopAppBar title="Issue Detail" onBackPress={() => navigation.goBack()} />
        <EmptyState
          icon={<Calendar size={40} color={colors.onSurfaceVariant} />}
          title="Issue Not Found"
          subtitle="The issue you're looking for doesn't exist or has been removed."
        />
      </SafeAreaView>
    );
  }

  const issueData = issue as any;
  const details = [
    { label: 'Type', value: issueData.type, type: 'type' as const },
    { label: 'Priority', value: issueData.priority, type: 'priority' as const },
    { label: 'Severity', value: issueData.severity, type: 'severity' as const },
    { label: 'Status', value: issueData.status, type: 'status' as const },
  ];
  const createdDate = issueData.created_at
    ? new Date(issueData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <TopAppBar title="Issue Detail" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.pageMargin }]}>
        <AnimatedEntry index={0}>
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.pageTitle, { color: colors.onSurface }]}>
              {issueData.title ?? 'Untitled Issue'}
            </Text>
            <Text style={[typography.monoId, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
              {issueData.id}
            </Text>
            {createdDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                <Calendar size={14} color={colors.onSurfaceVariant} />
                <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginLeft: spacing.xs }]}>
                  Created {createdDate}
                </Text>
              </View>
            )}
          </View>
        </AnimatedEntry>

        <AnimatedEntry index={1}>
          <Card style={{ marginTop: spacing.lg }}>
            <CardHeader title="Description" />
            <Text style={[typography.bodySm, { color: colors.onSurface, lineHeight: 20 }]}>
              {issueData.description || 'No description provided.'}
            </Text>
          </Card>
        </AnimatedEntry>

        <AnimatedEntry index={2}>
          <Card style={{ marginTop: spacing.sm }}>
            <CardHeader title="Details" />
            <View style={{ gap: 0 }}>
              {details.map((detail) => (
                <View key={detail.label} style={[styles.detailRow, { borderBottomColor: colors.outlineVariant }]}>
                  <Text style={[typography.nanoCaps, { color: colors.onSurfaceVariant }]}>{detail.label}</Text>
                  <StatusPill value={detail.value} type={detail.type} />
                </View>
              ))}
            </View>
          </Card>
        </AnimatedEntry>

        <AnimatedEntry index={3}>
          <Card style={{ marginTop: spacing.sm, marginBottom: 100 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <MessageCircle size={18} color={colors.primary} />
              <Text style={[typography.sectionHeading, { color: colors.onSurface, marginLeft: spacing.xs }]}>Comments</Text>
            </View>
            {issueData.comments && issueData.comments.length > 0 ? (
              issueData.comments.map((comment: any, idx: number) => (
                <View key={comment.id ?? idx} style={[styles.commentItem, idx < issueData.comments.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant, paddingBottom: spacing.md, marginBottom: spacing.md }]}>
                  <Text style={[typography.bodySmBold, { color: colors.onSurface }]}>{comment.author ?? 'Unknown'}</Text>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: spacing.xs, lineHeight: 18 }]}>
                    {comment.body ?? ''}
                  </Text>
                  {comment.created_at && (
                    <Text style={[typography.micro, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>No comments yet.</Text>
            )}
          </Card>
        </AnimatedEntry>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentItem: {},
});
