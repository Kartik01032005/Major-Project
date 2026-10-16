import Notification from "../models/Notification.js";
import { emitToUser } from "../socket/socket.js";
import { INotification } from "../types/notification.js";

type NotificationType = "Emergency" | "Approval" | "Rejection" | "Inventory" | "System";

export interface NotificationJob {
  receiverId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  attempts?: number;
  availableAt?: number;
}

const jobs: NotificationJob[] = [];
const queuedKeys = new Set<string>();
const maxAttempts = 3;
let worker: NodeJS.Timeout | undefined;

const getKey = (job: Pick<NotificationJob, "receiverId" | "title" | "message" | "type">): string =>
  [job.receiverId, job.title, job.message, job.type].join(":");

async function persistAndEmit(job: NotificationJob): Promise<INotification | null> {
  try {
    const notification = await Notification.create({
      receiverId: job.receiverId,
      title: job.title,
      message: job.message,
      type: job.type,
      link: job.link,
      isRead: false,
    });

    // In-app real-time notification for active sessions
    emitToUser(job.receiverId, "notification", notification);

    // Debounce duplicate events for 2 seconds
    setTimeout(() => {
      queuedKeys.delete(getKey(job));
    }, 2000);

    return notification;
  } catch (error) {
    queuedKeys.delete(getKey(job));
    console.error("Failed to persist notification:", error);
    return null;
  }
}

async function processNextJob(): Promise<void> {
  const job = jobs.find((candidate) => (candidate.availableAt || 0) <= Date.now());
  if (!job) return;

  const index = jobs.indexOf(job);
  jobs.splice(index, 1);

  try {
    await persistAndEmit(job);
  } catch (error) {
    const currentAttempts = job.attempts || 0;
    if (currentAttempts < maxAttempts) {
      jobs.push({
        ...job,
        attempts: currentAttempts + 1,
        availableAt: Date.now() + 2 ** currentAttempts * 1000,
      });
      return;
    }

    queuedKeys.delete(getKey(job));
    console.error("Notification job failed after retries:", error);
  }
}

export function startNotificationWorker(): void {
  if (worker) return;
  worker = setInterval(() => {
    void processNextJob();
  }, 250);
  worker.unref();
}

export function stopNotificationWorker(): void {
  if (worker) {
    clearInterval(worker);
    worker = undefined;
  }
}

export function clearNotificationQueue(): void {
  jobs.length = 0;
  queuedKeys.clear();
}

/**
 * Enqueue an in-app notification with deduplication and idempotency protection.
 * In test environment, processes immediately to avoid race conditions in tests.
 */
export function enqueueNotification(
  job: Pick<NotificationJob, "receiverId" | "title" | "message" | "type" | "link">,
): void {
  const key = getKey(job);
  if (queuedKeys.has(key)) return;
  queuedKeys.add(key);

  if (process.env.NODE_ENV === "test") {
    void persistAndEmit({ ...job, attempts: 0, availableAt: Date.now() });
    return;
  }

  jobs.push({ ...job, attempts: 0, availableAt: Date.now() });
  startNotificationWorker();
}
