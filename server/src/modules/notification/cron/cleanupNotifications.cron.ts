import { prisma } from '../../../config/prisma';

const READ_NOTIFICATION_RETENTION_HOURS = 24;
const CLEANUP_BATCH_LIMIT = 500;

export async function cleanupNotificationsCron(): Promise<void> {
  const cutoff = new Date(Date.now() - READ_NOTIFICATION_RETENTION_HOURS * 60 * 60 * 1000);

  // Delete in small batches so old read notifications are cleared without causing a large production spike.
  const staleNotifications = await prisma.notification.findMany({
    where: {
      isRead: true,
      readAt: {
        not: null,
        lte: cutoff,
      },
    },
    orderBy: {
      readAt: 'asc',
    },
    take: CLEANUP_BATCH_LIMIT,
    select: {
      id: true,
    },
  });

  if (staleNotifications.length === 0) {
    console.info('[notification-cleanup] No expired read notifications found');
    return;
  }

  const result = await prisma.notification.deleteMany({
    where: {
      id: {
        in: staleNotifications.map((notification) => notification.id),
      },
      isRead: true,
      readAt: {
        not: null,
        lte: cutoff,
      },
    },
  });

  console.info(
    `[notification-cleanup] Deleted ${result.count} read notifications older than ${READ_NOTIFICATION_RETENTION_HOURS} hours`,
  );
}
