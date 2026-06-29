export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TESTER' | 'USER';
}

export interface MockIssue {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'BUG' | 'IMPROVEMENT' | 'FEATURE' | 'TASK';
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  created_at: string;
  reporter: string;
  assignee?: string;
  comments: { id: string; author: string; body: string; created_at: string }[];
}

export interface MockMember {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TESTER' | 'USER';
  status: 'ONLINE' | 'OFFLINE';
  joined: string;
}

export interface MockNotification {
  id: string;
  type: 'critical' | 'mention' | 'member' | 'info';
  title: string;
  message: string;
  code: string;
  read: boolean;
  created_at: string;
}

export interface MockAuditLog {
  id: string;
  eventType: 'CREATED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'PRIORITY_CHANGED' | 'ASSIGNEE_CHANGED' | 'SEVERITY_CHANGED' | 'TYPE_CHANGED';
  type: 'CREATED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'PRIORITY_CHANGED' | 'ASSIGNEE_CHANGED' | 'SEVERITY_CHANGED' | 'TYPE_CHANGED';
  actor: string;
  description: string;
  before?: string;
  after?: string;
  createdAt: string;
  created_at: string;
  timestamp: string;
}

const now = Date.now();
const day = 86400000;

// ── Members ──
export const mockMembers: MockMember[] = [
  { id: 'u-admin-1', email: 'admin@ethiotelecom.et', name: 'Alex Rivera', role: 'ADMIN', status: 'ONLINE', joined: 'Jan 2022' },
  { id: 'u-tester-1', email: 'sarah.kim@ethiotelecom.et', name: 'Sarah Kim', role: 'TESTER', status: 'ONLINE', joined: 'Mar 2023' },
  { id: 'u-tester-2', email: 'dawit.eshetu@ethiotelecom.et', name: 'Dawit Eshetu', role: 'TESTER', status: 'OFFLINE', joined: 'Jun 2023' },
  { id: 'u-user-1', email: 'henok.alemu@ethiotelecom.et', name: 'Henok Alemu', role: 'USER', status: 'ONLINE', joined: 'Sep 2023' },
  { id: 'u-user-2', email: 'meron.tadesse@ethiotelecom.et', name: 'Meron Tadesse', role: 'USER', status: 'OFFLINE', joined: 'Nov 2023' },
  { id: 'u-user-3', email: 'biruk.kebede@ethiotelecom.et', name: 'Biruk Kebede', role: 'USER', status: 'ONLINE', joined: 'Feb 2024' },
  { id: 'u-user-4', email: 'selam.tesfaye@ethiotelecom.et', name: 'Selam Tesfaye', role: 'USER', status: 'OFFLINE', joined: 'Apr 2024' },
  { id: 'u-tester-3', email: 'leul.gebre@ethiotelecom.et', name: 'Leul Gebre', role: 'TESTER', status: 'ONLINE', joined: 'Jul 2024' },
  { id: 'u-user-5', email: 'mekdes.hailu@ethiotelecom.et', name: 'Mekdes Hailu', role: 'USER', status: 'ONLINE', joined: 'Sep 2024' },
  { id: 'u-user-6', email: 'yoni.assefa@ethiotelecom.et', name: 'Yonatan Assefa', role: 'USER', status: 'OFFLINE', joined: 'Nov 2024' },
];

// ── Users for login testing ──
export const mockUsers: MockUser[] = [
  { id: 'u-admin-1', email: 'admin@ethiotelecom.et', name: 'Alex Rivera', role: 'ADMIN' },
  { id: 'u-tester-1', email: 'tester@ethiotelecom.et', name: 'Sarah Kim', role: 'TESTER' },
  { id: 'u-user-1', email: 'user@ethiotelecom.et', name: 'Henok Alemu', role: 'USER' },
];

// Primary user (logged in by default)
export const mockUser: MockUser = mockUsers[0];

const NAMES = ['Alex Rivera', 'Sarah Kim', 'Dawit Eshetu', 'Henok Alemu', 'Meron Tadesse', 'Biruk Kebede', 'Selam Tesfaye', 'Leul Gebre', 'Mekdes Hailu', 'Yonatan Assefa'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Issues (30 — 3 pages with PAGE_SIZE=10) ──
const STATUSES: MockIssue['status'][] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES: MockIssue['priority'][] = ['LOW', 'MEDIUM', 'HIGH'];
const TYPES: MockIssue['type'][] = ['BUG', 'IMPROVEMENT', 'FEATURE', 'TASK'];
const SEVERITIES: MockIssue['severity'][] = ['MINOR', 'MAJOR', 'CRITICAL'];

const issueTemplates = [
  { t: '4G connectivity drop in {area}', d: 'Users in {area2} reporting frequent 4G disconnects every 15-20 minutes since deployment of new firmware v2.3.1 on Node-B towers. Affected area covers roughly 2km radius.' },
  { t: 'SMS delivery failure for {service} service', d: 'Users subscribed to daily updates are not receiving SMS. Error logs show timeout at SMSC gateway. Investigating root cause with the messaging team.' },
  { t: 'Billing portal shows incorrect {metric}', d: 'Customers on the monthly plan report that the portal shows incorrect usage. Suspect meter reset issue in the billing API.' },
  { t: 'USSD menu timeout on {feature}', d: 'Balance check command times out on 20% of attempts during business hours. Affects prepaid customers on 2G fallback.' },
  { t: 'Add {feature} support to customer portal', d: 'Customers are requesting {feature} for the web portal. Implement CSS variables and theme toggle.' },
  { t: 'International roaming not connecting in {country}', d: 'Roaming partners not registering subscribers since last month. Signaling error code 41. Need to coordinate with partner carriers.' },
  { t: 'Optimize {system} performance', d: 'Queries timing out for workspaces with >10,000 records. Add composite indexes for better performance.' },
  { t: 'API rate limiting causing false {error} errors', d: 'Legitimate API clients hitting rate limit at 100 req/min instead of documented 1000. Counter not resetting correctly.' },
  { t: '{platform} app crashes on {os}', d: 'App crashes on launch for devices running latest OS. Stack trace points to initialization library conflict.' },
  { t: 'Fiber node degradation in {area}', d: 'GPON signal strength dropping below threshold during peak hours. Intermittent packet loss of 3-5% in the affected region.' },
];

const areas = ['Addis Ababa North', 'Bole district', 'Megenagna', 'Kazanchis', 'Piazza', 'Mexico Square', 'Summit', 'Ayat', 'CMC', 'Gurd Shola', 'Saris', 'Merkato'];
const services = ['premium SMS', 'mobile money', 'call forwarding', 'data top-up', 'voice mail', 'international SMS'];
const metrics = ['data usage', 'call minutes', 'SMS count', 'balance', 'invoice total'];
const features = ['dark mode', 'biometric login', 'offline mode', 'push notifications', 'multi-language', 'widget'];
const countries = ['Sudan', 'Somalia', 'South Sudan', 'Djibouti', 'Kenya', 'Yemen'];
const systems = ['database indexes', 'CDN caching', 'search queries', 'API endpoints', 'report generation'];
const errors = ['429', '500', '502', '503', '413'];
const platforms = ['React Native', 'Flutter', 'Android', 'iOS', 'Web'];
const oss = ['Android 15', 'iOS 19', 'HarmonyOS', 'Android 14', 'iOS 18'];

export const mockIssues: MockIssue[] = [];
for (let i = 1; i <= 30; i++) {
  const tmpl = issueTemplates[i % issueTemplates.length];
  const title = tmpl.t
    .replace('{area}', pick(areas))
    .replace('{area2}', pick(areas))
    .replace('{service}', pick(services))
    .replace('{metric}', pick(metrics))
    .replace('{feature}', pick(features))
    .replace('{country}', pick(countries))
    .replace('{system}', pick(systems))
    .replace('{error}', pick(errors))
    .replace('{platform}', pick(platforms))
    .replace('{os}', pick(oss));
  const desc = tmpl.d
    .replace('{area}', pick(areas))
    .replace('{area2}', pick(areas))
    .replace('{service}', pick(services))
    .replace('{metric}', pick(metrics))
    .replace('{feature}', pick(features))
    .replace('{country}', pick(countries))
    .replace('{system}', pick(systems))
    .replace('{error}', pick(errors))
    .replace('{platform}', pick(platforms))
    .replace('{os}', pick(oss));

  const reporter = pick(NAMES);
  const assignee = Math.random() > 0.3 ? pick(NAMES.filter(n => n !== reporter)) : undefined;
  const status = STATUSES[i % STATUSES.length];
  const commentCount = Math.floor(Math.random() * 3);
  const comments: MockIssue['comments'] = [];
  for (let j = 0; j < commentCount; j++) {
    comments.push({
      id: `c-${i}-${j}`,
      author: pick(NAMES),
      body: pick([
        'Investigated and identified root cause. Working on fix.',
        'Awaiting more information from the field team.',
        'Deployed hotfix to staging. Testing in progress.',
        'Root cause confirmed. ETA for fix is next sprint.',
        'Cannot reproduce locally. Need more logs from production.',
        'Fix verified on staging. Deploying to production now.',
        'Reopened — fix did not fully resolve the issue.',
        'Escalated to senior team for review.',
      ]),
      created_at: new Date(now - day * (i + j + 1)).toISOString(),
    });
  }

  mockIssues.push({
    id: `ET-${1000 + i}`,
    title,
    description: desc,
    status: status as MockIssue['status'],
    priority: pick(PRIORITIES),
    type: pick(TYPES),
    severity: pick(SEVERITIES),
    created_at: new Date(now - day * (i + 1)).toISOString(),
    reporter,
    assignee,
    comments,
  });
}

// ── Notifications (12, mix of all types, some read, some unread) ──
export const mockNotifications: MockNotification[] = [
  { id: 'n1', type: 'critical', title: 'Critical pipeline failure', message: 'ET-1001 has been escalated — 4G connectivity drop requires immediate attention', code: 'ISSUE-4029', read: false, created_at: new Date(now - day * 0.05).toISOString() },
  { id: 'n2', type: 'mention', title: 'Mention in comment', message: 'Alex Rivera mentioned you in ET-1004 — "Can you review the signal data from Node BOL-07?"', code: 'DOC-882', read: false, created_at: new Date(now - day * 0.1).toISOString() },
  { id: 'n3', type: 'member', title: 'New member joined', message: 'Selam Tesfaye has joined the Core Infrastructure team', code: 'TEAM-UPDATE', read: false, created_at: new Date(now - day * 0.3).toISOString() },
  { id: 'n4', type: 'critical', title: 'SLA breach warning', message: 'ET-1007 is approaching SLA breach — International roaming issue unresolved for 48h', code: 'SLA-1007', read: false, created_at: new Date(now - day * 0.4).toISOString() },
  { id: 'n5', type: 'info', title: 'ET-1010 resolved', message: 'API rate limiting bug has been marked as resolved by Henok Alemu', code: 'ISSUE-2991', read: true, created_at: new Date(now - day * 1).toISOString() },
  { id: 'n6', type: 'info', title: 'Sprint retro reminder', message: 'Sprint 24 retrospective is scheduled for Friday 3pm. Please add your items.', code: 'SPRINT-24', read: true, created_at: new Date(now - day * 2).toISOString() },
  { id: 'n7', type: 'mention', title: 'Comment on ET-1012', message: 'Dawit Eshetu commented on React Native crash — "Can you share the full crash log?"', code: 'ISSUE-2995', read: false, created_at: new Date(now - day * 0.6).toISOString() },
  { id: 'n8', type: 'info', title: 'Deployment complete', message: 'Hotfix v1.4.2 for billing API has been deployed to production', code: 'DEPLOY-042', read: true, created_at: new Date(now - day * 3).toISOString() },
  { id: 'n9', type: 'member', title: 'Role changed', message: 'Meron Tadesse has been promoted to Team Lead', code: 'ROLE-UPDATE', read: false, created_at: new Date(now - day * 0.7).toISOString() },
  { id: 'n10', type: 'critical', title: 'Server outage detected', message: 'Core switch ET-CORE-03 in Bole data center is unresponsive. Redundancy active.', code: 'INFRA-001', read: false, created_at: new Date(now - day * 0.02).toISOString() },
  { id: 'n11', type: 'info', title: 'Weekly report ready', message: 'Issue resolution rate this week: 87% (up from 82% last week)', code: 'REPORT-W24', read: false, created_at: new Date(now - day * 0.15).toISOString() },
  { id: 'n12', type: 'mention', title: 'PR review requested', message: 'Leul Gebre requested your review on PR #342 — "Fix fiber monitoring dashboard"', code: 'PR-342', read: true, created_at: new Date(now - day * 4).toISOString() },
];

// ── Audit Logs (18 entries across all 7 event types) ──
function audit(id: string, eventType: MockAuditLog['eventType'], actor: string, description: string, before?: string, after?: string, daysAgo = 0): MockAuditLog {
  const d = new Date(now - day * daysAgo).toISOString();
  return { id, eventType, type: eventType, actor, description, before, after, createdAt: d, created_at: d, timestamp: d };
}

export const mockAuditLogs: MockAuditLog[] = [
  audit('a1', 'STATUS_CHANGED', 'Alex Rivera', 'Changed status of ET-1001 from Open to In Progress', 'Open', 'In Progress', 0.05),
  audit('a2', 'COMMENT_ADDED', 'Sarah Kim', 'Added a comment on ET-1004 — "Cleaned fiber terminations at node BOL-07. Monitoring signal stability through the weekend."', undefined, undefined, 0.1),
  audit('a3', 'ASSIGNEE_CHANGED', 'Alex Rivera', 'Assigned ET-1007 to Dawit Eshetu', 'Unassigned', 'Dawit Eshetu', 0.2),
  audit('a4', 'CREATED', 'Selam Tesfaye', 'Created ET-1016 — "Fiber node degradation in Bole district" — ' + pick(areas), undefined, undefined, 0.3),
  audit('a5', 'SEVERITY_CHANGED', 'Sarah Kim', 'Changed severity of ET-1007 from Major to Critical', 'Major', 'Critical', 0.4),
  audit('a6', 'STATUS_CHANGED', 'Alex Rivera', 'Changed status of ET-1003 from In Review to Resolved', 'In Review', 'Resolved', 0.5),
  audit('a7', 'PRIORITY_CHANGED', 'Alex Rivera', 'Changed priority of ET-1012 from Medium to High', 'Medium', 'High', 0.6),
  audit('a8', 'CREATED', 'Meron Tadesse', 'Created ET-1022 — "API rate limiting causing false errors"', undefined, undefined, 0.8),
  audit('a9', 'COMMENT_ADDED', 'Henok Alemu', 'Added a comment on ET-1010 — "Rate limiter window key was hashing with timestamp. Fixed to use sliding window."', undefined, undefined, 1),
  audit('a10', 'TYPE_CHANGED', 'Dawit Eshetu', 'Changed type of ET-1015 from Feature to Task', 'Feature', 'Task', 1.5),
  audit('a11', 'STATUS_CHANGED', 'Meron Tadesse', 'Changed status of ET-1006 from In Progress to Resolved', 'In Progress', 'Resolved', 2),
  audit('a12', 'ASSIGNEE_CHANGED', 'Alex Rivera', 'Reassigned ET-1018 from Sarah Kim to Leul Gebre', 'Sarah Kim', 'Leul Gebre', 2.5),
  audit('a13', 'SEVERITY_CHANGED', 'Biruk Kebede', 'Changed severity of ET-1005 from Minor to Major', 'Minor', 'Major', 3),
  audit('a14', 'PRIORITY_CHANGED', 'Selam Tesfaye', 'Changed priority of ET-1009 from Low to Medium', 'Low', 'Medium', 4),
  audit('a15', 'COMMENT_ADDED', 'Leul Gebre', 'Added a comment on ET-1012 — "Reproduced on Pixel 8 emulator. Upgrading library resolves it."', undefined, undefined, 5),
  audit('a16', 'CREATED', 'Mekdes Hailu', 'Created ET-1028 — "International roaming not connecting in Kenya"', undefined, undefined, 6),
  audit('a17', 'STATUS_CHANGED', 'Yonatan Assefa', 'Changed status of ET-1014 from Open to Closed', 'Open', 'Closed', 7),
  audit('a18', 'TYPE_CHANGED', 'Alex Rivera', 'Changed type of ET-1020 from Bug to Improvement', 'Bug', 'Improvement', 8),
];

// ── Mock API handler ──
export function isMockMode(): boolean {
  return true;
}

export function mockApiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const path = url.replace(/^https?:\/\/[^\/]+/, '');

  if (path === '/api/auth/login-mobile' || path === '/api/auth/register-mobile') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const email = body.email || 'admin@ethiotelecom.et';
    const matchedUser = mockUsers.find(u => u.email === email) || mockUsers[0];
    return Promise.resolve({
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        name: body.name || matchedUser.name,
        role: body.role || matchedUser.role,
      },
    });
  }

  if (path === '/api/issues-mobile') {
    return Promise.resolve(mockIssues);
  }

  if (path === '/api/admin/users') {
    return Promise.resolve(mockMembers);
  }

  if (path.startsWith('/api/admin/users/') && path.endsWith('/role')) {
    return Promise.resolve({ success: true });
  }

  // Issues CRUD
  if (path.startsWith('/api/issues')) {
    if (options.method === 'POST') {
      const body = JSON.parse(options.body as string);
      return Promise.resolve({
        id: 'ET-' + (2000 + mockIssues.length + 1),
        ...body,
        reporter: mockUser.name,
        created_at: new Date().toISOString(),
      });
    }
    if (options.method === 'DELETE') {
      return Promise.resolve({ success: true });
    }
    if (path.endsWith('/status') && options.method === 'PATCH') {
      return Promise.resolve({ success: true });
    }
    return Promise.resolve(mockIssues);
  }

  // Notifications
  if (path.startsWith('/api/notifications') && options.method === 'DELETE') {
    return Promise.resolve({ success: true });
  }
  if (path === '/api/notifications?limit=100') {
    return Promise.resolve(mockNotifications);
  }
  if (path === '/api/notifications/read' && options.method === 'POST') {
    return Promise.resolve({ success: true });
  }
  if (path.match(/\/api\/notifications\/.+\/read/) && options.method === 'POST') {
    return Promise.resolve({ success: true });
  }
  if (path.match(/\/api\/notifications\/.+/) && options.method === 'DELETE') {
    return Promise.resolve({ success: true });
  }

  // Audit log export
  if (path === '/api/audit-log/export') {
    return Promise.resolve({ success: true });
  }

  return Promise.reject(new Error(`Mock: no handler for ${path}`));
}
