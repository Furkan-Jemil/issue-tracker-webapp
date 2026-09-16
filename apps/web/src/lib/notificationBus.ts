/**
 * notificationBus — server-side in-process event emitter
 *
 * Purpose:
 *   Provides a lightweight pub/sub channel that connects server-side
 *   notification write paths (createNotification, mark-read mutations) to the
 *   SSE stream route (/api/notifications/stream).
 *
 * Why not Prisma LISTEN/NOTIFY?
 *   Prisma 7 does not expose raw PostgreSQL LISTEN/NOTIFY. Using pg directly
 *   for LISTEN would require a persistent connection per-process and is
 *   incompatible with Vercel's serverless model.
 *
 * Why an in-process EventEmitter?
 *   On Vercel, each serverless function invocation shares its Node.js module
 *   cache within the same process. The SSE stream and the notification write
 *   happen in the same long-lived process, so the emitter reliably connects
 *   them. When multiple Vercel instances run, each instance serves its own
 *   connected SSE clients — the 30s poll fallback in the bell catches any
 *   cross-instance lag.
 *
 * Usage (server-side only — never import this in "use client" files):
 *   import { notificationBus } from "@/lib/notificationBus";
 *
 *   // Write path: fire after inserting a notification row
 *   notificationBus.emit(userId);
 *
 *   // Read path: subscribe in the SSE route
 *   const unsub = notificationBus.subscribe(userId, () => sendCount());
 *   return () => unsub();
 */

import { EventEmitter } from "events";

// Singleton — module-level so it persists for the lifetime of the process.
const emitter = new EventEmitter();

// Raise the default listener limit to avoid false MaxListenersExceeded
// warnings when many users are simultaneously connected.
emitter.setMaxListeners(500);

/**
 * Emit a notification event for a specific user.
 * Called by the notification write path after inserting a DB row.
 */
function emit(userId: string): void {
  emitter.emit(`notification:${userId}`);
}

/**
 * Subscribe to notification events for a specific user.
 * Returns an unsubscribe function — always call it on cleanup.
 */
function subscribe(userId: string, handler: () => void): () => void {
  const event = `notification:${userId}`;
  emitter.on(event, handler);
  return () => emitter.off(event, handler);
}

export const notificationBus = { emit, subscribe } as const;
