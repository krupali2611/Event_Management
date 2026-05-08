import cron from 'node-cron';
import { NotificationType } from './constants/notificationTypes';
import { getReminderCandidates, sendEventReminderNotification } from './notification.service';

async function dispatchReminderBatch(type: typeof NotificationType.EVENT_REMINDER_24H | typeof NotificationType.EVENT_REMINDER_1H): Promise<void> {
  const bookings = await getReminderCandidates(type);

  await Promise.all(
    bookings.map((booking) =>
      sendEventReminderNotification({
        type,
        booking,
      }),
    ),
  );
}

export function startNotificationCronJobs(): void {
  cron.schedule('*/5 * * * *', () => {
    void dispatchReminderBatch(NotificationType.EVENT_REMINDER_24H).catch((error: unknown) => {
      console.error('24 hour reminder cron failed', error);
    });

    void dispatchReminderBatch(NotificationType.EVENT_REMINDER_1H).catch((error: unknown) => {
      console.error('1 hour reminder cron failed', error);
    });
  });
}
