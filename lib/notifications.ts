import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createNotification({
  userId,
  message,
}: {
  userId: string;
  message: string;
}) {
  return prisma.notification.create({
    data: {
      userId,
      message,
      isRead: false,
    },
  });
}
