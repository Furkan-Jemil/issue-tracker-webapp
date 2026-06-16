/**
 * Shared route definitions and API endpoints.
 * This keeps web links and mobile API calls aligned, avoiding hardcoded string drift.
 */
export const WEB_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  LOGOUT: "/logout",
  DASHBOARD: "/dashboard",
  TASKS: {
    LIST: "/tasks",
    NEW: "/tasks/new",
    SEARCH: "/tasks/search",
    FILTER: "/tasks/filter",
    DETAIL: (id: string) => `/tasks/${id}`,
  },
  MEMBERS: {
    LIST: "/members",
    DETAIL: (id: string) => `/members/${id}`,
  },
  ADMIN: {
    SETTINGS: "/admin/settings",
    AUDIT_LOG: "/admin/audit-log",
  },
};

export const API_ROUTES = {
  HEALTH: "/api/health",
  AUTH: {
    LOGIN_MOBILE: "/api/auth/login-mobile",
    NEXTAUTH: "/api/auth/[...nextauth]",
  },
  ISSUES: {
    MOBILE: "/api/issues-mobile",
  },
  COMMENTS: "/api/comments",
  NOTIFICATIONS: {
    LIST: "/api/notifications",
    UNREAD: "/api/notifications/unread",
    DETAIL: (id: string) => `/api/notifications/${id}`,
  },
};
