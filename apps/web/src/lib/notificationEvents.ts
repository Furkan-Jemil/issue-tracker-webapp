/**
 * notificationEvents
 *
 * A zero-dependency, browser-native event bus for notification state changes.
 *
 * Why custom events instead of a state manager?
 * - No shared React tree between the notification bell (in PageHeader, rendered
 *   on every page) and the notifications page (a separate route subtree).
 * - `window` CustomEvents cross React tree boundaries and survive page
 *   navigations within the SPA shell without any global store.
 * - Works across browser tabs (via BroadcastChannel, optional enhancement).
 *
 * Usage:
 *   // Dispatch after any read mutation:
 *   notificationEvents.emit("changed");
 *
 *   // Subscribe in a component or hook:
 *   const unsub = notificationEvents.on("changed", () => refetch());
 *   return () => unsub();
 *
 * Event name: "notifications:changed"
 * Payload: none — consumers always re-fetch rather than receiving a diff,
 * which keeps the bus simple and avoids stale-count bugs.
 */

const EVENT_NAME = "notifications:changed" as const;

function emit(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function on(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export const notificationEvents = { emit, on } as const;
