# Mobile UI Kit — reference for building screens

This app rebuilds the **Figma "Mobile & Tablet Design Guide"** in React Native.
Figma source (web/Tailwind, read-only spec): `~/Downloads/Mobile & Tablet Design Guide(1)/src/app/App.tsx`.
Palette: lime primary `#80ca28` on slate surfaces; multi-color charts. One breakpoint: **768px** (phone < 768 ≤ tablet).

## Theme — `useTheme()` from `../theme/useTheme`
Returns `{ colors, typography, spacing, radius, isTablet, isLargeTablet, width, pagePadding, isDark, toggleTheme }`.
Key `colors`: `green` `#80ca28`, `greenFg` (lime text), `background`, `card`, `cardBorder`, `foreground`, `mutedForeground`, `muted`, `outline`, `destructive`, `error`,
status/priority badge tints, charts `chart1..chart5`, `chartOpen/InProgress/Resolved/Closed`. All are theme-aware (dark mode automatic).
`radius`: sm6 md10 lg12 xl16 full999. Fonts: `Outfit_400Regular/500Medium/600SemiBold/700Bold`, `JetBrainsMono_400Regular`.

## Responsive — `useResponsive()` from `../responsive/useResponsive`
`{ width, isTablet, isLargeTablet, columns, pagePadding, contentMaxWidth }`.
- `<Grid columns={n} gap>` (`../responsive/Grid`) — wrapping N-col grid.
- `<TwoPane main side sideWidth={300} />` (`../responsive/TwoPane`) — stacks on phone, side-by-side on tablet.

## Primitives — `from '../components/ui'`
- `<Screen title subtitle onBack headerRight scroll refreshControl>` — page wrapper: safe-area, Figma TopBar (title/sub + bell + avatar), floating-bar clearance. Use for every screen. `header={false}` to hide bar.
- `<Card padding={16}>` — white rounded-16 shadow card.
- `<Button title variant="default|outline|ghost|destructive" size="sm|md|lg" icon={<X/>} loading disabled fullWidth onPress />`.
- `<Badge kind="status|priority|severity|type|role" value={UPPERCASE_ENUM} />` — resolves color+label+icon. Or `<Badge bg fg label />`.
- `<Avatar name email initials size="xs|sm|md|lg" online?={bool} />`.
- `<Input label required leftIcon height placeholder value onChangeText />`, `<Textarea label rows />`.
- `<Select label value options={[{value,label}]} onChange />` — opens bottom-sheet picker.
- `<SearchBar value onChangeText placeholder />`, `<IconButton icon active badge onPress />`, `<SecLabel>`.
- Icons: `lucide-react-native`. Charts: `../charts/StatusDonut`, `../charts/ComparisonBars`, `../charts/TrendLine`.

## Data — `useAppContext()` from `../context/AppContext`
`{ issues, members, assignableUsers, user, notifications, auditLogs, isLoading, login, register, logout, refreshData, fetchIssues, changeUserRole, markNotificationsRead }`.
**Enum casing is UPPERCASE.** Shapes:
- `Issue`: `{ id, title, description, status: OPEN|IN_PROGRESS|RESOLVED|CLOSED, priority: LOW|MEDIUM|HIGH, type: BUG|IMPROVEMENT|FEATURE|TASK, severity: MINOR|MAJOR|CRITICAL, created_at, reporter, assignee?, comments: [{id,author,body,created_at}] }`
- `Member`: `{ id, email, name, role: ADMIN|TESTER|USER, status: ONLINE|OFFLINE, joined }`
- `Notification`: `{ id, type: critical|mention|member|info, title, message, code, read, created_at }`
- `AuditLog`: `{ id, type/eventType: CREATED|STATUS_CHANGED|COMMENT_ADDED|PRIORITY_CHANGED|ASSIGNEE_CHANGED|SEVERITY_CHANGED|TYPE_CHANGED, actor, description, before?, after?, created_at }`
- `User`: `{ id, email, name, role }`
Helpers `../utils/formatters`: `getInitials(name?,email?)`, `relativeTime(dateStr)`.

## Navigation — `useNavigation()` from `@react-navigation/native`
Tabs: `Dashboard`, `TasksList`, `Notifications`, `Members`, `AuditLog`, `Settings`.
Stack (push): `TaskDetail` (params `{ issueId }`), `CreateTask`, `Profile`.
Detail/back screens pass `onBack={() => navigation.goBack()}` to `<Screen>`.

## Conventions
- Screens are `export default function XScreen()`, no props (read context + route).
- Use `useResponsive().isTablet` to switch layouts (e.g. card list on phone → table/board on tablet; grid columns).
- Horizontal page padding: `pagePadding` (16 phone / 24 tablet).
- Never hardcode hex except via `colors.*`. Match Figma spacing/typography closely.
