import { ipcMain } from 'electron';
import { IPC_CHANNELS, DEFAULT_SETTINGS } from '../shared/constants';
import {
  taskQueries,
  scheduledTaskQueries,
  calendarEventQueries,
  statsQueries,
  achievementQueries,
  settingsQueries,
} from './database/queries';
import {
  authenticate,
  disconnect,
  isAuthenticated,
  syncCalendar,
  getEventsFromDb,
  startAutoSync,
} from './services/google-calendar';
import { findAvailableSlots, hasConflict } from './services/task-scheduler';
import { calculateNextReview } from './services/spaced-repetition';
import { getMainWindow } from './main';
import type {
  CreateTaskDTO,
  UpdateTaskDTO,
  FindSlotsRequest,
  ScheduleTaskRequest,
  Settings,
  IPCResponse,
  MasteryLevel,
} from '../shared/types';

function success<T>(data: T): IPCResponse<T> {
  return { success: true, data };
}

function error(message: string): IPCResponse {
  return { success: false, error: message };
}

export function setupIpcHandlers(): void {
  // Initialize achievements
  achievementQueries.initialize();

  // ========== Calendar Handlers ==========

  ipcMain.handle(IPC_CHANNELS.CALENDAR_SYNC, async () => {
    try {
      const events = await syncCalendar();
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send(IPC_CHANNELS.CALENDAR_EVENTS_UPDATED, events);
      }
      return success(events);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Sync failed');
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.CALENDAR_GET_EVENTS,
    async (_, startDate: string, endDate: string) => {
      try {
        const events = getEventsFromDb(startDate, endDate);
        return success(events);
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Failed to get events');
      }
    }
  );

  // ========== Task Handlers ==========

  ipcMain.handle(IPC_CHANNELS.TASKS_CREATE, async (_, dto: CreateTaskDTO) => {
    try {
      const task = taskQueries.create(dto);
      broadcastTasksUpdated();
      return success(task);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to create task');
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASKS_UPDATE, async (_, dto: UpdateTaskDTO) => {
    try {
      const task = taskQueries.update(dto);
      if (!task) return error('Task not found');
      broadcastTasksUpdated();
      return success(task);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to update task');
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASKS_DELETE, async (_, id: string) => {
    try {
      const deleted = taskQueries.delete(id);
      if (!deleted) return error('Task not found');
      broadcastTasksUpdated();
      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to delete task');
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.TASKS_COMPLETE,
    async (_, id: string, newMasteryLevel: number) => {
      try {
        const task = taskQueries.getById(id);
        if (!task) return error('Task not found');

        // Calculate next review using spaced repetition
        const result = calculateNextReview(
          task.masteryLevel,
          newMasteryLevel >= task.masteryLevel,
          task.intervalDays,
          task.customDeadline
        );

        // Update task with new mastery level and next review date
        const updatedTask = taskQueries.complete(id, result.newMasteryLevel);

        // Update stats and check achievements
        const stats = statsQueries.incrementTasksCompleted();
        const newAchievements = achievementQueries.checkAndUnlock(stats);

        // Broadcast updates
        broadcastTasksUpdated();
        broadcastStatsUpdated();

        // Notify about new achievements
        const mainWindow = getMainWindow();
        for (const achievement of newAchievements) {
          mainWindow?.webContents.send(IPC_CHANNELS.ACHIEVEMENT_UNLOCKED, achievement);
        }

        return success(updatedTask);
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Failed to complete task');
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.TASKS_GET_ALL, async () => {
    try {
      const tasks = taskQueries.getAll();
      return success(tasks);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to get tasks');
    }
  });

  ipcMain.handle(IPC_CHANNELS.TASKS_GET_BY_ID, async (_, id: string) => {
    try {
      const task = taskQueries.getById(id);
      if (!task) return error('Task not found');
      return success(task);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to get task');
    }
  });

  // ========== Scheduled Task Handlers ==========

  ipcMain.handle(
    IPC_CHANNELS.SCHEDULED_CREATE,
    async (_, request: ScheduleTaskRequest) => {
      try {
        const scheduled = scheduledTaskQueries.create(
          request.taskId,
          request.startTime,
          request.endTime
        );
        return success(scheduled);
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Failed to schedule task');
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SCHEDULED_UPDATE,
    async (_, id: string, data: Record<string, unknown>) => {
      try {
        const scheduled = scheduledTaskQueries.update(id, data);
        if (!scheduled) return error('Scheduled task not found');
        return success(scheduled);
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Failed to update scheduled task');
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.SCHEDULED_DELETE, async (_, id: string) => {
    try {
      const deleted = scheduledTaskQueries.delete(id);
      if (!deleted) return error('Scheduled task not found');
      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to delete scheduled task');
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.SCHEDULED_GET_ALL,
    async (_, startDate: string, endDate: string) => {
      try {
        const scheduled = scheduledTaskQueries.getByDateRange(startDate, endDate);
        return success(scheduled);
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Failed to get scheduled tasks');
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.SCHEDULED_COMPLETE, async (_, id: string) => {
    try {
      const scheduled = scheduledTaskQueries.complete(id);
      if (!scheduled) return error('Scheduled task not found');
      return success(scheduled);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to complete scheduled task');
    }
  });

  // ========== Scheduling Handlers ==========

  ipcMain.handle(
    IPC_CHANNELS.SCHEDULE_FIND_SLOTS,
    async (_, request: FindSlotsRequest) => {
      try {
        const settings = getSettings();
        const slots = findAvailableSlots(
          new Date(request.startDate),
          new Date(request.endDate),
          request.taskDuration,
          {
            workingHoursStart: settings.workingHoursStart,
            workingHoursEnd: settings.workingHoursEnd,
            bufferMinutes: settings.bufferMinutes,
            preferredTimeOfDay: request.preferredTimeOfDay,
          }
        );
        return success(slots.slice(0, 10)); // Return top 10 slots
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Failed to find slots');
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SCHEDULE_PLACE_TASK,
    async (_, request: ScheduleTaskRequest) => {
      try {
        // Check for conflicts
        const start = new Date(request.startTime);
        const end = new Date(request.endTime);

        if (hasConflict(start, end)) {
          return error('Time slot conflicts with existing event');
        }

        const scheduled = scheduledTaskQueries.create(
          request.taskId,
          request.startTime,
          request.endTime
        );
        return success(scheduled);
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Failed to place task');
      }
    }
  );

  // ========== Google Auth Handlers ==========

  ipcMain.handle(IPC_CHANNELS.GOOGLE_AUTHENTICATE, async () => {
    try {
      await authenticate();
      // Start auto-sync after successful auth
      const settings = getSettings();
      startAutoSync(settings.autoSyncInterval);
      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Authentication failed');
    }
  });

  ipcMain.handle(IPC_CHANNELS.GOOGLE_DISCONNECT, async () => {
    try {
      disconnect();
      return success(undefined);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Disconnect failed');
    }
  });

  ipcMain.handle(IPC_CHANNELS.GOOGLE_CHECK_AUTH, async () => {
    try {
      const authed = await isAuthenticated();
      return success(authed);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Auth check failed');
    }
  });

  // ========== Settings Handlers ==========

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    try {
      const settings = getSettings();
      return success(settings);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to get settings');
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SET,
    async (_, newSettings: Partial<Settings>) => {
      try {
        const current = getSettings();
        const updated = { ...current, ...newSettings };

        for (const [key, value] of Object.entries(updated)) {
          settingsQueries.set(key, value);
        }

        // Update auto-sync interval if changed
        if (newSettings.autoSyncInterval !== undefined) {
          startAutoSync(newSettings.autoSyncInterval);
        }

        return success(updated);
      } catch (err) {
        return error(err instanceof Error ? err.message : 'Failed to save settings');
      }
    }
  );

  // ========== Stats Handlers ==========

  ipcMain.handle(IPC_CHANNELS.STATS_GET, async () => {
    try {
      const stats = statsQueries.get();
      return success(stats);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to get stats');
    }
  });

  // ========== Achievement Handlers ==========

  ipcMain.handle(IPC_CHANNELS.ACHIEVEMENTS_GET, async () => {
    try {
      const achievements = achievementQueries.getAll();
      return success(achievements);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Failed to get achievements');
    }
  });
}

// Helper functions

function getSettings(): Settings {
  return {
    workingHoursStart: settingsQueries.get('workingHoursStart', DEFAULT_SETTINGS.workingHoursStart),
    workingHoursEnd: settingsQueries.get('workingHoursEnd', DEFAULT_SETTINGS.workingHoursEnd),
    bufferMinutes: settingsQueries.get('bufferMinutes', DEFAULT_SETTINGS.bufferMinutes),
    theme: settingsQueries.get('theme', DEFAULT_SETTINGS.theme),
    urgencyLevels: settingsQueries.get('urgencyLevels', DEFAULT_SETTINGS.urgencyLevels),
    notificationsEnabled: settingsQueries.get('notificationsEnabled', DEFAULT_SETTINGS.notificationsEnabled),
    autoSyncInterval: settingsQueries.get('autoSyncInterval', DEFAULT_SETTINGS.autoSyncInterval),
  };
}

function broadcastTasksUpdated(): void {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    const tasks = taskQueries.getAll();
    mainWindow.webContents.send(IPC_CHANNELS.TASKS_UPDATED, tasks);
  }
}

function broadcastStatsUpdated(): void {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    const stats = statsQueries.get();
    mainWindow.webContents.send(IPC_CHANNELS.STATS_UPDATED, stats);
  }
}
