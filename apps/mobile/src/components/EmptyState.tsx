import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Inbox,
  WifiOff,
  AlertCircle,
  ShieldOff,
  RefreshCw,
} from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';

type Variant = 'empty' | 'error' | 'offline' | 'forbidden';

interface EmptyStateProps {
  variant?: Variant;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  action?: { label: string; onPress: () => void };
}

type DefaultMeta = {
  icon: (color: string) => ReactNode;
  title: string;
  subtitle: string;
};

function makeDefaults(): Record<Variant, DefaultMeta> {
  return {
    empty: {
      icon: (c) => <Inbox size={48} color={c} strokeWidth={1.5} />,
      title: 'Nothing here yet',
      subtitle: 'Items will appear here once they are created.',
    },
    error: {
      icon: (c) => <AlertCircle size={48} color={c} strokeWidth={1.5} />,
      title: 'Something went wrong',
      subtitle: 'We could not load the data. Tap below to try again.',
    },
    offline: {
      icon: (c) => <WifiOff size={48} color={c} strokeWidth={1.5} />,
      title: 'You are offline',
      subtitle: 'Check your internet connection and try again.',
    },
    forbidden: {
      icon: (c) => <ShieldOff size={48} color={c} strokeWidth={1.5} />,
      title: 'Access denied',
      subtitle: 'You do not have permission to view this content.',
    },
  };
}

export default function EmptyState({
  variant = 'empty',
  icon,
  title,
  subtitle,
  onRetry,
  action,
}: EmptyStateProps) {
  const { colors, typography, spacing } = useTheme();
  const defaults = makeDefaults();
  const def = defaults[variant];

  const iconColor =
    variant === 'error'
      ? colors.error
      : colors.mutedForeground;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: colors.muted }]}>
        {icon ?? def.icon(iconColor)}
      </View>
      <Text
        style={[
          typography.sectionHeading,
          { color: colors.foreground, textAlign: 'center' },
        ]}
      >
        {title ?? def.title}
      </Text>
      {(subtitle ?? def.subtitle) ? (
        <Text
          style={[
            typography.bodySm,
            {
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: 6,
              maxWidth: 260,
            },
          ]}
        >
          {subtitle ?? def.subtitle}
        </Text>
      ) : null}

      {onRetry ? (
        <TouchableOpacity
          style={[
            styles.retryBtn,
            { backgroundColor: colors.primary, marginTop: spacing.lg },
          ]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <RefreshCw size={14} color="#fff" strokeWidth={2.5} />
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      ) : null}

      {action ? (
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { borderColor: colors.border, marginTop: spacing.md },
          ]}
          onPress={action.onPress}
          accessibilityRole="button"
        >
          <Text style={[typography.bodySm, { color: colors.foreground }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
});
