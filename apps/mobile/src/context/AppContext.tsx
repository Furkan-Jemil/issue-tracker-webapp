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
import { apiFetch, setUnauthorizedHandler } from '../utils/apiFetch';
import { saveToken, loadToken, deleteToken } from '../utils/secureStore';

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
  updateIssue: (id: string, data: Record<string, string>) => Promise<void>;
  addComment: (
    issueId: string,
    body: string,
  ) => Promise<{ id: string; author: string; body: string; created_at: string }>;
  createIssue: (data: Record<string, string>) => Promise<any>;
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    // Register 401 handler so the API client can force logout
    setUnauthorizedHandler(() => {
      if (isMounted.current) logout();
    });
    return () => { isMounted.current = false; };
  }, []);

  // Load token on startup
  useEffect(() => {
    loadToken().then((saved) => {
      if (saved && isMounted.current) setToken(saved);
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const raw = await apiFetch('/api/auth/login-mobile', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = z.object({ token: z.string(), user: UserSchema }).parse(raw);
      await saveToken(data.token);
      if (isMounted.current) {
        setToken(data.token);
        setUser(data.user);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, role?: string) => {
      setIsLoading(true);
      try {
        const raw = await apiFetch('/api/auth/register-mobile', {
          method: 'POST',
          body: JSON.stringify({ email, password, name, role }),
        });
        const data = z.object({ token: z.string(), user: UserSchema }).parse(raw);
        await saveToken(data.token);
        if (isMounted.current) {
          setToken(data.token);
          setUser(data.user);
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
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
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Data fetching — each function surfaces errors via fetchError state
  // ---------------------------------------------------------------------------
  const fetchIssues = useCallback(async () => {
    try {
      const data: any = await apiFetch('/api/issues-mobile');
      const list = Array.isArray(data) ? data : (data?.issues ?? data?.data ?? []);
      const validated = z.array(BaseEntitySchema).parse(list);
      if (isMounted.current) {
        setIssues(validated);
        setFetchError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setFetchError(err instanceof Error ? err.message : 'Failed to fetch issues');
      }
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const data: any = await apiFetch('/api/admin/users');
      const list = Array.isArray(data) ? data : (data?.users ?? data?.data ?? []);
      const validated = z.array(BaseEntitySchema).parse(list);
      if (isMounted.current) {
        setMembers(validated);
        setAssignableUsers(validated);
      }
    } catch (err) {
      if (isMounted.current) {
        setFetchError(err instanceof Error ? err.message : 'Failed to fetch members');
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data: any = await apiFetch('/api/notifications?limit=100');
      const list = Array.isArray(data) ? data : (data?.notifications ?? data?.data ?? []);
      const validated = z.array(BaseEntitySchema).parse(list);
      if (isMounted.current) setNotifications(validated);
    } catch {
      // Non-critical — notifications silently fail
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (isMounted.current) setIsLoading(true);
    try {
      await Promise.all([fetchIssues(), fetchMembers(), fetchNotifications()]);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [fetchIssues, fetchMembers, fetchNotifications]);

  // Auto-fetch when token is available
  useEffect(() => {
    if (token) void refreshData();
  }, [token]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const changeUserRole = useCallback(
    async (userId: string, role: string) => {
      await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      await fetchMembers();
    },
    [fetchMembers],
  );

  const markNotificationsRead = useCallback(async () => {
    try {
      await apiFetch('/api/notifications/read', { method: 'POST' });
      if (isMounted.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch { /* silently fail */ }
  }, []);

  const deleteIssue = useCallback(async (id: string) => {
    await apiFetch(`/api/issues/${id}`, { method: 'DELETE' });
    if (isMounted.current) setIssues((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateIssue = useCallback(async (id: string, data: Record<string, string>) => {
    const result: any = await apiFetch(`/api/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (result?.issue && isMounted.current) {
      setIssues((prev) => prev.map((i) => (i.id === id ? result.issue : i)));
    }
  }, []);

  const updateProfile = useCallback(async (data: { name?: string }) => {
    const result: any = await apiFetch('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (result?.user && isMounted.current) setUser(result.user);
  }, []);

  const addComment = useCallback(async (issueId: string, body: string) => {
    const result: any = await apiFetch(`/api/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    return result;
  }, []);

  const createIssue = useCallback(async (data: Record<string, string>) => {
    return apiFetch('/api/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, []);

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
