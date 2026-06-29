import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '../theme/useTheme';
import { apiUrl } from '../utils/api';
import { mockApiFetch, mockUser, mockIssues, mockMembers, mockNotifications, mockAuditLogs } from '../utils/mockData';

const TOKEN_KEY = '@auth_token';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Issue {
  id: string;
  [key: string]: unknown;
}

interface Member {
  id: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  [key: string]: unknown;
}

interface AuditLog {
  id: string;
  [key: string]: unknown;
}

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
  // Try mock first
  try {
    return await mockApiFetch(url, options);
  } catch {
    // fall through to real API
  }
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
  const [issues, setIssues] = useState<Issue[]>(mockIssues as unknown as Issue[]);
  const [members, setMembers] = useState<Member[]>(mockMembers as unknown as Member[]);
  const [assignableUsers, setAssignableUsers] = useState<Member[]>(mockMembers as unknown as Member[]);
  const [user, setUser] = useState<User | null>(mockUser as unknown as User);
  const [token, setToken] = useState<string | null>('mock-token');
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications as unknown as Notification[]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs as unknown as AuditLog[]);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = (await apiFetch('/api/auth/login-mobile', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: {} as Record<string, string>,
      })) as { token: string; user: User };
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
      const data = (await apiFetch('/api/auth/register-mobile', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
        headers: {} as Record<string, string>,
      })) as { token: string; user: User };
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
      const data = (await apiFetch('/api/issues-mobile')) as { issues?: Issue[]; data?: Issue[] };
      const list = data.issues ?? data.data ?? [];
      setIssues(list);
    } catch {
      // silently fail
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/admin/users')) as { users?: Member[]; data?: Member[] };
      const list = data.users ?? data.data ?? [];
      setMembers(list);
      setAssignableUsers(list);
    } catch {
      // silently fail
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = (await apiFetch('/api/notifications?limit=100')) as { notifications?: Notification[]; data?: Notification[] };
      const list = data.notifications ?? data.data ?? [];
      setNotifications(list);
    } catch {
      // silently fail
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
      headers: {} as Record<string, string>,
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
    if (token && token.startsWith('mock')) return; // mock data already loaded
    if (token) refreshData();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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
