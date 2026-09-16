import prisma from "@/lib/prisma";
import { notificationBus } from "@/lib/notificationBus";

/**
 * createNotification
 *
 * Inserts a notification row and immediately signals the in-process SSE bus
 * so any connected EventSource for this user receives the count update within
 * milliseconds rather than waiting for the next poll cycle.
 */
export async function createNotification({
  userId,
  issueId,
  message,
}: {
  userId: string;
  issueId: string;
  message: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      issueId,
      message,
      isRead: false,
    },
  });

  // Fire-and-forget bus signal — non-fatal if the process has no SSE
  // subscribers for this user (e.g. user is not currently browsing the app).
  try {
    notificationBus.emit(userId);
  } catch {
    // Never let bus errors surface to callers.
  }

  return notification;
}
