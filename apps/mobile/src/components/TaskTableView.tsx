import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControlProps, LayoutRectangle } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { Badge, Avatar, ContextualAnchor } from './ui';
import { relativeTime } from '../utils/formatters';

interface TaskItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  severity: string;
  status: string;
  assignee?: string;
  created_at: string;
}

interface TaskTableViewProps {
  data: TaskItem[];
  onPress: (item: TaskItem) => void;
  onMenu: (item: TaskItem, rect: LayoutRectangle) => void;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

const TITLE_WIDTH = 150;
const COL_W = 90;

export default function TaskTableView({ data, onPress, onMenu, refreshControl }: TaskTableViewProps) {
  const { colors, typography, spacing } = useTheme();
  const leftRef = useRef<ScrollView>(null);
  const rightRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);
  const isSyncing = useRef(false);

  const onRightScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    if (!isSyncing.current) {
      setScrollY(y);
      isSyncing.current = true;
      leftRef.current?.scrollTo({ y, animated: false });
      setTimeout(() => { isSyncing.current = false; }, 16);
    }
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    leftRef.current?.scrollTo({ y: scrollY, animated: false });
  }, [scrollY, data.length]);

  const headerCell = (label: string, w: number) => (
    <View key={label} style={[styles.headerCell, { width: w, borderRightColor: colors.cardBorder, borderBottomColor: colors.cardBorder, backgroundColor: colors.muted }]}>
      <Text style={[typography.nanoCaps, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );

  const dataCell = (content: React.ReactNode, w: number, align?: 'left' | 'right') => (
    <View style={[styles.dataCell, { width: w, borderRightColor: colors.cardBorder, borderBottomColor: colors.cardBorder, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }]}>
      {content}
    </View>
  );

  const truncateTitle = (title: string) => {
    const words = title.split(/\s+/);
    if (words.length <= 2) return title;
    return words.slice(0, 2).join(' ') + '…';
  };

  const badges: Record<string, (v: string) => React.ReactNode> = {
    type: (v) => <Badge kind="type" value={v} />,
    priority: (v) => <Badge kind="priority" value={v} />,
    severity: (v) => <Badge kind="severity" value={v} />,
    status: (v) => <Badge kind="status" value={v} />,
  };

  return (
    <View style={{ flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        {/* Fixed left column (Title) */}
        <View style={{ width: TITLE_WIDTH }}>
          {headerCell('Title', TITLE_WIDTH)}
          <ScrollView ref={leftRef} scrollEnabled={false} showsVerticalScrollIndicator={false}>
            {data.map((item) => (
              <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => onPress(item)}
                style={[styles.dataCell, { width: TITLE_WIDTH, borderRightColor: colors.cardBorder, borderBottomColor: colors.cardBorder }]}>
                <Text numberOfLines={1} style={[typography.bodySmBold, { color: colors.foreground, flex: 1 }]}>{truncateTitle(item.title)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Scrollable columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View>
            {/* Header row */}
            <View style={{ flexDirection: 'row' }}>
              {headerCell('Type', COL_W)}
              {headerCell('Priority', COL_W)}
              {headerCell('Status', COL_W)}
              {headerCell('', 40)}
            </View>
            {/* Data rows */}
            <ScrollView
              ref={rightRef}
              onScroll={onRightScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
            >
              {data.map((item) => (
                <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => onPress(item)}
                  style={{ flexDirection: 'row' }}>
                  {dataCell(badges.type?.(item.type) ?? null, COL_W)}
                  {dataCell(badges.priority?.(item.priority) ?? null, COL_W)}
                  {dataCell(badges.status?.(item.status) ?? null, COL_W)}
                  {dataCell(
                    <ContextualAnchor onPressAnchor={(rect) => onMenu(item, rect)} hitSlop={6}>
                      <MoreVertical size={12} color={colors.mutedForeground} />
                    </ContextualAnchor>, 40)}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCell: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataCell: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
