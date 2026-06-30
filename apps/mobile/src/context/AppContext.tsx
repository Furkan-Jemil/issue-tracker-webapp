import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { ThemeProvider } from '../theme/useTheme';
import { apiUrl } from '../utils/api';

const TOKEN_KEY = '@auth_token';

// Zod schemas for runtime validation of API responses
const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional().transform(val => val || ""),
  role: z.string(),
}).passthrough();

const BaseEntitySchema = z.object({
  id: z.string(),
}).passthrough();

type User = z.infer<typeof UserSchema>;
type Issue = z.infer<typeof BaseEntitySchema>;
type Member = z.infer<typeof BaseEntitySchema>;
type Notification = z.infer<typeof BaseEntitySchema>;
type AuditLog = z.infer<typeof BaseEntitySchema>;

interface AppContextValue {
  issues: Issue[];
  members: Member[];
  assignableUsers: Member[];
  user: User | null;
  token: string | null;
  notifications: Notification[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  fetchIssues: () => Promise<void>;
  changeUserRole: (userId: string, role: string) => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function apiFetch(url: string, options: RequestInit = {}): Promise<unknown> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(url), { ...options, headers });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<Member[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  // Load token on startup
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then(savedToken => {
      if (savedToken) {
        setToken(savedToken);
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const rawData = await apiFetch('/api/auth/login-mobile', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {},
      });
      const data = z.object({ token: z.string(), user: UserSchema }).parse(rawData);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role?: string) => {
    setIsLoading(true);
    try {
      const rawData = await apiFetch('/api/auth/register-mobile', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
        headers: {},
      });
      const data = z.object({ token: z.string(), user: UserSchema }).parse(rawData);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIssues([]);
    setMembers([]);
    setAssignableUsers([]);
    setNotifications([]);
    setAuditLogs([]);
  }, []);

  const fetchIssues = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/issues-mobile')) as { issues?: unknown[]; data?: unknown[] };
      const list = data.issues ?? data.data ?? [];
      const validIssues = z.array(BaseEntitySchema).parse(list);
      setIssues(validIssues);
    } catch (error) {
      console.warn("Failed to fetch issues", error);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/admin/users')) as { users?: unknown[]; data?: unknown[] };
      const list = data.users ?? data.data ?? [];
      const validMembers = z.array(BaseEntitySchema).parse(list);
      setMembers(validMembers);
      setAssignableUsers(validMembers);
    } catch (error) {
      console.warn("Failed to fetch members", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/notifications?limit=100')) as { notifications?: unknown[]; data?: unknown[] };
      const list = data.notifications ?? data.data ?? [];
      const validNotifications = z.array(BaseEntitySchema).parse(list);
      setNotifications(validNotifications);
    } catch (error) {
      console.warn("Failed to fetch notifications", error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchIssues(), fetchMembers(), fetchNotifications()]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchIssues, fetchMembers, fetchNotifications]);

  const changeUserRole = useCallback(async (userId: string, role: string) => {
    await apiFetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      headers: {},
    });
    await fetchMembers();
  }, [fetchMembers]);

  const markNotificationsRead = useCallback(async () => {
    try {
      await apiFetch('/api/notifications/read', { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true })),
      );
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (token) refreshData();
  }, [token, refreshData]);

  const value: AppContextValue = {
    issues,
    members,
    assignableUsers,
    user,
    token,
    notifications,
    auditLogs,
    isLoading,
    login,
    register,
    logout,
    refreshData,
    fetchIssues,
    changeUserRole,
    markNotificationsRead,
  };

  return (
    <ThemeProvider>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </ThemeProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
