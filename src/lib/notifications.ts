import prisma from "@/lib/prisma";

export async function createNotification({
  userId,
  issueId,
  message,
}: {
  userId: string;
  issueId: string;
  message: string;
}) {
  return prisma.notification.create({
    data: {
      userId,
      issueId,
      message,
      isRead: false,
    },
  });
}
