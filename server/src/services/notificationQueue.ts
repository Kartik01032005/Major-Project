import Notification from "../models/Notification.js";
import { emitToUser } from "../socket/socket.js";

type NotificationType = "Emergency" | "Approval" | "Rejection" | "Inventory" | "System";

interface NotificationJob {
  receiverId: string;
  title: string;
  message: string;
  type: NotificationType;
  attempts: number;
  availableAt: number;
}

const jobs: NotificationJob[] = [];
const queuedKeys = new Set<string>();
const maxAttempts = 3;
let worker: NodeJS.Timeout | undefined;

const getKey = (job: Pick<NotificationJob, "receiverId" | "title" | "message" | "type">): string =>
  [job.receiverId, job.title, job.message, job.type].join(":");

async function processNextJob(): Promise<void> {
  const job = jobs.find((candidate) => candidate.availableAt <= Date.now());
  if (!job) return;

  const index = jobs.indexOf(job);
  jobs.splice(index, 1);

  try {
    const notification = await Notification.create({
      receiverId: job.receiverId,
      title: job.title,
      message: job.message,
      type: job.type,
      isRead: false,
    });
    emitToUser(job.receiverId, "notification", notification);
    queuedKeys.delete(getKey(job));
  } catch (error) {
    if (job.attempts < maxAttempts) {
      jobs.push({
        ...job,
        attempts: job.attempts + 1,
        availableAt: Date.now() + 2 ** job.attempts * 1000,
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

export function enqueueNotification(
  job: Pick<NotificationJob, "receiverId" | "title" | "message" | "type">,
): void {
  const key = getKey(job);
  if (queuedKeys.has(key)) return;
  queuedKeys.add(key);
  jobs.push({ ...job, attempts: 0, availableAt: Date.now() });
  startNotificationWorker();
}
