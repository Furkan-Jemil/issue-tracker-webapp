import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { z } from 'zod';
import { ThemeProvider } from '../theme/useTheme';
import { setUnauthorizedHandler } from '../utils/apiFetch';
import { saveToken, loadToken, deleteToken } from '../utils/secureStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const UserSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable().optional().transform((v) => v || ''),
    role: z.string(),
  })
  .passthrough();

const BaseEntitySchema = z.object({ id: z.string() }).passthrough();

type User = z.infer<typeof UserSchema>;
type Issue = z.infer<typeof BaseEntitySchema>;
type Member = z.infer<typeof BaseEntitySchema>;
type Notification = z.infer<typeof BaseEntitySchema>;
type AuditLog = z.infer<typeof BaseEntitySchema>;

// ---------------------------------------------------------------------------
// Context interface
// ---------------------------------------------------------------------------
interface AppContextValue {
  issues: Issue[];
  members: Member[];
  assignableUsers: Member[];
  user: User | null;
  token: string | null;
  notifications: Notification[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  /** True once the first post-login data load has completed (used to decide the landing screen). */
  initialized: boolean;
  /** Null = no error; string = last fetch error message */
  fetchError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  fetchIssues: () => Promise<void>;
  changeUserRole: (userId: string, role: string) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  updateProfile: (data: { name?: string }) => Promise<void>;
  updateIssue: (id: string, data: Record<string, any>) => Promise<void>;
  addComment: (
    issueId: string,
    body: string,
  ) => Promise<{ id: string; author: string; body: string; created_at: string }>;
  createIssue: (data: Record<string, any>) => Promise<any>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<Member[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isMounted = useRef(true);
  // Mirrors `initialized` for use inside fetch callbacks. Lets us distinguish a
  // genuine mid-session 401 (→ logout) from a 401 during the first post-login
  // load (→ show an error, but DON'T bounce the user back to the login screen).
  const initializedRef = useRef(false);

  // Handle a 401 from a data endpoint. Only force logout once the app is past
  // its initial load; during the first load, surface an error instead so a
  // single failing endpoint can't "blink" a validly-logged-in user out.
  const handleUnauthorized = useCallback(async (label: string) => {
    if (initializedRef.current) {
      await logout();
    } else if (isMounted.current) {
      setFetchError(`${label} was unauthorized. Pull to refresh or sign in again.`);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (isMounted.current) logout();
    });
    return () => { isMounted.current = false; };
  }, []);

  // Clear stale mock-format cache on first launch
  useEffect(() => {
    AsyncStorage.multiRemove([
      '@cached_members',
      '@cached_notifications',
      '@cached_issues',
      'dashboard_range',
      'dashboard_status',
      'dashboard_priority',
      'dashboard_severity',
    ]).catch(() => {});
  }, []);

  // Load token on startup — validate it against the real server
  useEffect(() => {
    loadToken().then(async (saved) => {
      if (!saved || !isMounted.current) return;
      try {
        const res = await fetch(`${API_BASE}/api/auth/get-session`, {
          headers: { Authorization: `Bearer ${saved}` },
        });
        const body = await res.json();
        if (body?.user) {
          setToken(saved);
          setUser({ ...body.user, name: body.user.name || '' });
        } else {
          await deleteToken();
        }
      } catch {
        await deleteToken();
      }
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Auth — real backend only, no bypass, no mock fallback
  // ---------------------------------------------------------------------------
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as any)?.error || `Login failed (${res.status})`);
      }
      const data = z.object({ token: z.string(), user: UserSchema }).parse(await res.json());
      if (isMounted.current) {
        setToken(data.token);
        setUser(data.user);
      }
      await saveToken(data.token);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, role?: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error((errBody as any)?.error || `Registration failed (${res.status})`);
        }
        // Auto-login after registration
        const loginRes = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!loginRes.ok) return;
        const loginData = z.object({ token: z.string(), user: UserSchema }).parse(await loginRes.json());
        if (isMounted.current) {
          setToken(loginData.token);
          setUser(loginData.user);
        }
        await saveToken(loginData.token);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    // Clear server-side session
    if (token) {
      try {
        await fetch(`${API_BASE}/api/auth/sign-out`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* ignore server-side cleanup errors */ }
    }
    await deleteToken();
    if (isMounted.current) {
      setToken(null);
      setUser(null);
      setIssues([]);
      setMembers([]);
      setAssignableUsers([]);
      setNotifications([]);
      setAuditLogs([]);
      setFetchError(null);
      setInitialized(false);
      initializedRef.current = false;
    }
  }, [token]);

  // ---------------------------------------------------------------------------
  // Data shape transformers (API → mobile expected shape)
  // ---------------------------------------------------------------------------
  const transformIssue = useCallback((apiIssue: any) => {
    if (!apiIssue || typeof apiIssue !== 'object') return apiIssue;
    return {
      ...apiIssue,
      created_at: apiIssue.createdAt ?? apiIssue.created_at,
      reporter: apiIssue.creator?.name ?? apiIssue.reporter ?? '',
      assignee: apiIssue.assignee?.name ?? apiIssue.assignee ?? null,
      screenshots: Array.isArray(apiIssue.screenshots) ? apiIssue.screenshots : [],
      attachments: Array.isArray(apiIssue.attachments) ? apiIssue.attachments : [],
      comments: (apiIssue.comments ?? []).map((c: any) => ({
        ...c,
        id: c.id,
        author: c.user?.name ?? c.author ?? '',
        body: c.content ?? c.body ?? '',
        created_at: c.createdAt ?? c.created_at ?? '',
      })),
    };
  }, []);

  const transformIssues = useCallback((list: any[]) =>
    (Array.isArray(list) ? list : []).map(transformIssue),
  [transformIssue]);

  // ---------------------------------------------------------------------------
  // Data fetching — each function surfaces errors via fetchError state
  // ---------------------------------------------------------------------------
  const fetchIssues = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('@cached_issues');
      if (cached && isMounted.current) {
        setIssues(JSON.parse(cached));
      }
    } catch { /* ignore cache read error */ }

    try {
      const token = await loadToken();
      const res = await fetch(`${API_BASE}/api/issues-mobile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) { await handleUnauthorized('Issues'); return; }
      if (!res.ok) throw new Error(`Failed to fetch issues (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.issues ?? data?.data ?? []);
      const transformed = transformIssues(list);
      const validated = z.array(BaseEntitySchema).parse(transformed);

      await AsyncStorage.setItem('@cached_issues', JSON.stringify(validated));

      if (isMounted.current) {
        setIssues(validated);
        setFetchError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setFetchError(err instanceof Error ? err.message : 'Failed to fetch issues');
      }
    }
  }, [transformIssues, handleUnauthorized]);

  const fetchMembers = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('@cached_members');
      if (cached && isMounted.current) {
        const parsed = JSON.parse(cached);
        setMembers(parsed);
        setAssignableUsers(parsed);
      }
    } catch { /* ignore */ }

    try {
      const token = await loadToken();
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) { await handleUnauthorized('Members'); return; }
      if (!res.ok) throw new Error(`Failed to fetch members (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.users ?? data?.data ?? []);
      const validated = z.array(BaseEntitySchema).parse(list);

      await AsyncStorage.setItem('@cached_members', JSON.stringify(validated));

      if (isMounted.current) {
        setMembers(validated);
        setAssignableUsers(validated);
      }
    } catch (err) {
      if (isMounted.current) {
        setFetchError(err instanceof Error ? err.message : 'Failed to fetch members');
      }
    }
  }, [handleUnauthorized]);

  const fetchNotifications = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('@cached_notifications');
      if (cached && isMounted.current) {
        setNotifications(JSON.parse(cached));
      }
    } catch { /* ignore */ }

    try {
      const token = await loadToken();
      const res = await fetch(`${API_BASE}/api/notifications?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) { await handleUnauthorized('Notifications'); return; }
      if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.notifications ?? data?.data ?? []);
      const transformed = list.map((n: any) => ({
        id: n.id,
        type: 'info',
        title: n.issue?.title ?? n.title ?? 'Notification',
        message: n.message ?? '',
        code: '',
        read: n.isRead ?? n.read ?? false,
        created_at: n.createdAt ?? n.created_at ?? '',
        targetType: n.issueId ? 'issue' : 'none',
        targetId: n.issueId ?? null,
        issueId: n.issueId,
        issueTitle: n.issue?.title ?? '',
      }));
      const validated = z.array(BaseEntitySchema).parse(transformed);

      await AsyncStorage.setItem('@cached_notifications', JSON.stringify(validated));

      if (isMounted.current) setNotifications(validated);
    } catch {
      // Non-critical — notifications silently fail
    }
   }, [handleUnauthorized]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const token = await loadToken();
      const res = await fetch(`${API_BASE}/api/audit-log`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) { await handleUnauthorized('Audit log'); return; }
      if (!res.ok) throw new Error(`Failed to fetch audit logs (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.logs ?? data?.data ?? []);
      const transformed = list.map((l: any) => ({
        ...l,
        eventType: l.eventType ?? l.type ?? '',
        description: l.description ?? l.message ?? '',
        createdAt: l.createdAt ?? l.created_at ?? '',
        userId: l.actorId ?? l.userId ?? l.createdBy,
        user: l.actor ?? l.user ?? null,
        createdBy: l.actorId ?? l.createdBy,
      }));
      if (isMounted.current) setAuditLogs(transformed);
    } catch {
      // Non-critical — audit log silently fails if endpoint unavailable
    }
  }, [handleUnauthorized]);

  const refreshData = useCallback(async () => {
    if (isMounted.current) setIsLoading(true);
    try {
      await Promise.all([fetchIssues(), fetchMembers(), fetchNotifications(), fetchAuditLogs()]);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setInitialized(true);
        initializedRef.current = true;
      }
    }
  }, [fetchIssues, fetchMembers, fetchNotifications, fetchAuditLogs]);

  // Auto-fetch when token is available
  useEffect(() => {
    if (token) void refreshData();
  }, [token]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const changeUserRole = useCallback(
    async (userId: string, role: string) => {
      let previousMembers = members;
      if (isMounted.current) {
        setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role } : m)));
      }
      try {
        const token = await loadToken();
         const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ role }),
        });
        if (res.status === 401) { await logout(); throw new Error('Session expired'); }
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Role update failed (${res.status})`);
        }
        await fetchMembers();
      } catch (err) {
       if (isMounted.current) setMembers(previousMembers);
       throw err;
     }
   }, [fetchMembers, members, logout],
);

  const markNotificationsRead = useCallback(async () => {
    try {
      const token = await loadToken();
      await fetch(`${API_BASE}/api/notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
       if (isMounted.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      }
    } catch { /* silently fail */ }
  }, [logout]);

  const deleteIssue = useCallback(async (id: string) => {
    let previousIssues = issues;
    if (isMounted.current) setIssues((prev) => prev.filter((i) => i.id !== id));
    try {
       const token = await loadToken();
       const res = await fetch(`${API_BASE}/api/issues-mobile/${id}`, {
         method: 'DELETE',
         headers: token ? { Authorization: `Bearer ${token}` } : {},
       });
       if (res.status === 401) { await logout(); throw new Error('Unauthorized'); }
       if (!res.ok) throw new Error(`Delete failed (${res.status})`);
     } catch (err) {
       if (isMounted.current) setIssues(previousIssues);
       throw err;
     }
   }, [issues, logout]);

  const updateIssue = useCallback(async (id: string, data: Record<string, any>) => {
    let previousIssues = issues;
    if (isMounted.current) {
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } as any : i)));
    }
    try {
      // Map assignee name to assigneeId (UUID) using member list
      const body: Record<string, any> = { ...data };
      if ('assignee' in body) {
        const name = body.assignee;
        if (name && typeof name === 'string') {
          const member = members.find((m: any) => m.name === name);
          body.assigneeId = member?.id ?? null;
        } else {
          body.assigneeId = null;
        }
        delete body.assignee;
      }

      const token = await loadToken();
      const res = await fetch(`${API_BASE}/api/issues-mobile/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { await logout(); throw new Error('Unauthorized'); }
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const result = await res.json();
      if (result && isMounted.current) {
        const transformed = transformIssue(result);
        setIssues((prev) => prev.map((i) => (i.id === id ? transformed : i)));
      }
     } catch (err) {
       if (isMounted.current) setIssues(previousIssues);
       throw err;
     }
   }, [issues, members, transformIssue, logout]);

   const updateProfile = useCallback(async (data: { name?: string }) => {
     const token = await loadToken();
     const res = await fetch(`${API_BASE}/api/users/profile`, {
       method: 'PATCH',
       headers: {
         'Content-Type': 'application/json',
         ...(token ? { Authorization: `Bearer ${token}` } : {}),
       },
       body: JSON.stringify(data),
     });
     if (res.status === 401) { await logout(); throw new Error('Unauthorized'); }
     if (!res.ok) throw new Error(`Profile update failed (${res.status})`);
     const result = await res.json();
     // Handle both wrapped {user: {...}} and direct user object responses
     const userData = result?.user || result;
     if (userData && isMounted.current) setUser({ ...userData, name: userData.name || '' });
   }, [logout]);

  const addComment = useCallback(async (issueId: string, content: string) => {
    const token = await loadToken();
    const res = await fetch(`${API_BASE}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
       body: JSON.stringify({ issueId, content }),
      });
      if (res.status === 401) { await logout(); throw new Error('Unauthorized'); }
      if (!res.ok) throw new Error(`Failed to add comment (${res.status})`);
    const result = await res.json();
    // Transform to mobile expected shape
    return {
       id: result.id,
       author: result.user?.name ?? 'Unknown',
       body: result.content ?? '',
       created_at: result.createdAt ?? '',
     };
   }, [logout]);

  const createIssue = useCallback(async (data: Record<string, any>) => {
    const token = await loadToken();
    const res = await fetch(`${API_BASE}/api/issues-mobile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
       body: JSON.stringify(data),
      });
      if (res.status === 401) { await logout(); throw new Error('Unauthorized'); }
      if (!res.ok) throw new Error(`Failed to create issue (${res.status})`);
    const result = await res.json();
    const transformed = transformIssue(result);
    // Add to state immediately so the new issue shows without a manual refresh.
    if (transformed?.id && isMounted.current) {
      setIssues((prev) => {
        const next = [transformed, ...prev.filter((i) => i.id !== transformed.id)];
        AsyncStorage.setItem('@cached_issues', JSON.stringify(next)).catch(() => {});
        return next;
      });
     }
     return transformed;
   }, [transformIssue, logout]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const value: AppContextValue = {
    issues,
    members,
    assignableUsers,
    user,
    token,
    notifications,
    auditLogs,
    isLoading,
    initialized,
    fetchError,
    login,
    register,
    logout,
    refreshData,
    fetchIssues,
    changeUserRole,
    markNotificationsRead,
    deleteIssue,
    updateProfile,
    updateIssue,
    addComment,
    createIssue,
  };

  return (
    <ThemeProvider>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </ThemeProvider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}
