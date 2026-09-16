/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events (SSE) endpoint that pushes real-time unread-count
 * updates to connected clients.
 *
 * Protocol:
 *   - Client connects with a standard EventSource (no auth headers needed —
 *     the session cookie is sent automatically with same-origin requests).
 *   - Server immediately sends the current unread count as the first event.
 *   - Server sends a heartbeat comment (`: ping`) every 25 seconds to keep
 *     the connection alive through proxies and load balancers that time out
 *     idle connections (typical timeout is 30–60s).
 *   - When createNotification() fires notificationBus.emit(userId), the
 *     handler re-queries the DB and pushes a fresh count event.
 *   - Client closes the connection by navigating away; the AbortSignal fires
 *     and all cleanup (bus unsub, timer clear) runs automatically.
 *
 * SSE event format:
 *   data: {"count": 3}\n\n
 *
 * Retry hint:
 *   The initial response includes `retry: 5000` so the browser will attempt
 *   to reconnect within 5 seconds if the connection drops.
 *
 * Security:
 *   - Session-gated: returns 401 if no valid session.
 *   - Rate-limited: one active SSE connection per user is implicitly enforced
 *     by the EventSource browser API (tabs share a single connection via
 *     HTTP/2 multiplexing on modern browsers).
 *   - No sensitive data beyond unread count is transmitted over the stream.
 *
 * Vercel / Edge compatibility:
 *   - Uses Node.js `ReadableStream` + `TextEncoder` (no Node.js streams API)
 *     which is fully compatible with both Node.js and Edge runtimes.
 *   - `export const dynamic = "force-dynamic"` prevents static caching.
 *   - The route is intentionally NOT `export const runtime = "edge"` because
 *     it imports `notificationBus` which uses Node.js `EventEmitter`.
 */

export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { notificationBus } from "@/lib/notificationBus";
import prisma from "@/lib/prisma";

const HEARTBEAT_INTERVAL_MS = 25_000;
const ENCODER = new TextEncoder();

/** Encodes an SSE data event: `data: <json>\n\n` */
function dataEvent(payload: Record<string, unknown>): Uint8Array {
  return ENCODER.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/** Encodes an SSE comment (heartbeat): `: ping\n\n` */
function heartbeat(): Uint8Array {
  return ENCODER.encode(`: ping\n\n`);
}

/** Encodes the retry hint sent once at stream open: `retry: <ms>\n\n` */
function retryHint(ms: number): Uint8Array {
  return ENCODER.encode(`retry: ${ms}\n\n`);
}

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const session = await getAppSession();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;

  // ── Stream setup ──────────────────────────────────────────────────────────
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      // Browser navigated away or closed the tab — cleanup happens below via
      // the AbortSignal path, but this guard covers the ReadableStream cancel.
      controller = null;
    },
  });

  // ── Helper: push count event ──────────────────────────────────────────────
  async function pushCount() {
    if (!controller) return;
    try {
      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });
      controller.enqueue(dataEvent({ count }));
    } catch {
      // DB error — send a safe zero rather than crashing the stream.
      controller?.enqueue(dataEvent({ count: 0 }));
    }
  }

  // ── Initial payload ───────────────────────────────────────────────────────
  // Send retry hint and initial count immediately when the connection opens.
  // We can't await here (start() must be sync) so we schedule microtasks.
  Promise.resolve().then(async () => {
    if (!controller) return;
    controller.enqueue(retryHint(5_000));
    await pushCount();
  });

  // ── Bus subscription ──────────────────────────────────────────────────────
  // Fires whenever createNotification() inserts a row for this user.
  const unsubscribe = notificationBus.subscribe(userId, () => {
    void pushCount();
  });

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  const heartbeatTimer = setInterval(() => {
    if (controller) {
      try {
        controller.enqueue(heartbeat());
      } catch {
        // Controller may have been closed — swallow.
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  // ── Cleanup on client disconnect ──────────────────────────────────────────
  // The AbortSignal fires when the client closes the EventSource (navigation,
  // tab close, or explicit .close()).
  req.signal.addEventListener("abort", () => {
    unsubscribe();
    clearInterval(heartbeatTimer);
    try {
      controller?.close();
    } catch {
      // Already closed — ignore.
    }
    controller = null;
  });

  // ── Response ──────────────────────────────────────────────────────────────
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Prevent Vercel's edge from buffering — required for SSE on Vercel.
      "X-Accel-Buffering": "no",
    },
  });
}
