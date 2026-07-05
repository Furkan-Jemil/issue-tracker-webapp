import { AlertCircle, Clock, CheckCircle2, XCircle, Bug, Sparkles, Wrench, ListChecks, Shield, FlaskConical, User } from 'lucide-react-native';
import type { ThemeColors } from '../../theme/useTheme';

export type BadgeKind = 'status' | 'priority' | 'severity' | 'type' | 'role';

export interface BadgeStyle {
  bg: string;
  fg: string;
  label: string;
  Icon?: React.ElementType;
}

const titleCase = (v: string) => v.charAt(0) + v.slice(1).toLowerCase();

/**
 * Maps the app's UPPERCASE data enums (OPEN, HIGH, BUG…) to Figma badge
 * colors. All colors come from the active theme so dark mode just works.
 */
export function getBadge(kind: BadgeKind, raw: string, c: ThemeColors): BadgeStyle {
  const value = (raw ?? '').toUpperCase();

  switch (kind) {
    case 'status':
      switch (value) {
        case 'OPEN': return { bg: c.statusOpenBg, fg: c.statusOpenText, label: 'Open', Icon: AlertCircle };
        case 'IN_PROGRESS': return { bg: c.statusInProgressBg, fg: c.statusInProgressText, label: 'In Progress', Icon: Clock };
        case 'RESOLVED': return { bg: c.statusResolvedBg, fg: c.statusResolvedText, label: 'Resolved', Icon: CheckCircle2 };
        case 'CLOSED': return { bg: c.statusClosedBg, fg: c.statusClosedText, label: 'Closed', Icon: XCircle };
        default: return { bg: c.statusClosedBg, fg: c.statusClosedText, label: titleCase(value), Icon: AlertCircle };
      }
    case 'priority':
      switch (value) {
        case 'HIGH': return { bg: c.priorityHighBg, fg: c.priorityHighText, label: 'High' };
        case 'MEDIUM': return { bg: c.priorityMediumBg, fg: c.priorityMediumText, label: 'Medium' };
        case 'LOW': return { bg: c.priorityLowBg, fg: c.priorityLowText, label: 'Low' };
        default: return { bg: c.priorityLowBg, fg: c.priorityLowText, label: titleCase(value) };
      }
    case 'severity':
      switch (value) {
        case 'CRITICAL': return { bg: c.statusOpenBg, fg: c.statusOpenText, label: 'Critical' };
        case 'MAJOR': return { bg: c.priorityHighBg, fg: c.priorityHighText, label: 'Major' };
        case 'MINOR': return { bg: c.priorityLowBg, fg: c.priorityLowText, label: 'Minor' };
        default: return { bg: c.priorityLowBg, fg: c.priorityLowText, label: titleCase(value) };
      }
    case 'type':
      switch (value) {
        case 'BUG': return { bg: '#fee2e2', fg: '#dc2626', label: 'Bug', Icon: Bug };
        case 'IMPROVEMENT': return { bg: c.statusInProgressBg, fg: c.statusInProgressText, label: 'Improvement', Icon: Sparkles };
        case 'FEATURE': return { bg: c.statusResolvedBg, fg: c.statusResolvedText, label: 'Feature', Icon: Sparkles };
        case 'TASK': return { bg: c.priorityLowBg, fg: c.priorityLowText, label: 'Task', Icon: ListChecks };
        default: return { bg: c.statusInProgressBg, fg: c.statusInProgressText, label: titleCase(value), Icon: Wrench };
      }
    case 'role':
      switch (value) {
        case 'ADMIN': return { bg: c.green + '26', fg: c.greenFg, label: 'Admin', Icon: Shield };
        case 'TESTER': return { bg: c.priorityHighBg, fg: c.priorityHighText, label: 'Tester', Icon: FlaskConical };
        case 'USER': return { bg: c.statusInProgressBg, fg: c.statusInProgressText, label: 'User', Icon: User };
        default: return { bg: c.priorityLowBg, fg: c.priorityLowText, label: titleCase(value), Icon: User };
      }
    default:
      return { bg: c.muted, fg: c.mutedForeground, label: titleCase(value) };
  }
}
