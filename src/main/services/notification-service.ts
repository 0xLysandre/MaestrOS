import { Notification } from 'electron';
import path from 'path';
import { app } from 'electron';
import { taskQueries, settingsQueries } from '../database/queries';
import { getMainWindow } from '../main';
import { IPC_CHANNELS } from '../../shared/constants';

// Notification check interval (every 5 minutes)
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Track notified tasks to avoid duplicates
const notifiedTasks = new Set<string>();

// Sound file path
function getSoundPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', 'notification.wav');
  }
  return path.join(__dirname, '..', '..', '..', 'assets', 'notification.wav');
}

/**
 * Play notification sound via renderer process
 */
function playNotificationSound(): void {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send(IPC_CHANNELS.NOTIFICATION_PLAY_SOUND);
  }
}

/**
 * Show a native notification for a task
 */
function showTaskNotification(task: {
  id: string;
  title: string;
  isOverdue: boolean;
  minutesUntilDue?: number;
}): void {
  const settings = settingsQueries.get('notificationsEnabled', true);
  if (!settings) return;

  let body: string;
  if (task.isOverdue) {
    body = 'This task is overdue! Review it now.';
  } else if (task.minutesUntilDue !== undefined) {
    if (task.minutesUntilDue <= 60) {
      body = `Due in ${task.minutesUntilDue} minutes`;
    } else {
      const hours = Math.floor(task.minutesUntilDue / 60);
      body = `Due in ${hours} hour${hours > 1 ? 's' : ''}`;
    }
  } else {
    body = 'Time to review this task';
  }

  const notification = new Notification({
    title: `📚 ${task.title}`,
    body,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'assets', 'icon.png')
      : path.join(__dirname, '..', '..', '..', 'assets', 'icon.png'),
    urgency: task.isOverdue ? 'critical' : 'normal',
    silent: false,
  });

  notification.on('click', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      // Navigate to tasks view
      mainWindow.webContents.send(IPC_CHANNELS.NAVIGATE_TO_TASKS, task.id);
    }
  });

  notification.show();

  // Play custom sound
  playNotificationSound();
}

/**
 * Check for tasks that need notification
 */
function checkForDueTasks(): void {
  try {
    const tasks = taskQueries.getDueToday();
    const now = new Date();

    for (const task of tasks) {
      // Skip if already notified in this session
      const notificationKey = `${task.id}-${new Date().toDateString()}`;
      if (notifiedTasks.has(notificationKey)) continue;

      const nextReview = new Date(task.nextReviewDate);
      const diffMs = nextReview.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // Notify for:
      // 1. Overdue tasks (negative diff)
      // 2. Tasks due within the next hour
      // 3. Tasks due within 15 minutes
      const isOverdue = diffMinutes < 0;
      const isDueSoon = diffMinutes >= 0 && diffMinutes <= 60;

      if (isOverdue || isDueSoon) {
        showTaskNotification({
          id: task.id,
          title: task.title,
          isOverdue,
          minutesUntilDue: isOverdue ? undefined : diffMinutes,
        });

        notifiedTasks.add(notificationKey);
      }
    }

    // Clean up old notification keys (older than today)
    const today = new Date().toDateString();
    for (const key of notifiedTasks) {
      if (!key.endsWith(today)) {
        notifiedTasks.delete(key);
      }
    }
  } catch (error) {
    console.error('Error checking for due tasks:', error);
  }
}

let checkInterval: NodeJS.Timeout | null = null;

/**
 * Start the notification service
 */
export function startNotificationService(): void {
  // Check immediately on start
  setTimeout(checkForDueTasks, 10000); // Wait 10s for app to fully load

  // Then check periodically
  checkInterval = setInterval(checkForDueTasks, CHECK_INTERVAL_MS);

  console.log('Notification service started');
}

/**
 * Stop the notification service
 */
export function stopNotificationService(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  console.log('Notification service stopped');
}

/**
 * Manually trigger a notification check
 */
export function triggerNotificationCheck(): void {
  checkForDueTasks();
}

/**
 * Clear notification history (for testing)
 */
export function clearNotificationHistory(): void {
  notifiedTasks.clear();
}
