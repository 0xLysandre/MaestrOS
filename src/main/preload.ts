import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import type {
  Task,
  ScheduledTask,
  CalendarEvent,
  Settings,
  UserStats,
  Achievement,
  CreateTaskDTO,
  UpdateTaskDTO,
  FindSlotsRequest,
  ScheduleTaskRequest,
  TimeSlot,
  IPCResponse,
  SyncStatus,
} from '../shared/types';

// Type-safe IPC invoke wrapper
async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args);
}

// Expose API to renderer
const electronAPI = {
  // Calendar
  calendar: {
    sync: (): Promise<IPCResponse<CalendarEvent[]>> =>
      invoke(IPC_CHANNELS.CALENDAR_SYNC),
    getEvents: (
      startDate: string,
      endDate: string
    ): Promise<IPCResponse<CalendarEvent[]>> =>
      invoke(IPC_CHANNELS.CALENDAR_GET_EVENTS, startDate, endDate),
    onEventsUpdated: (callback: (events: CalendarEvent[]) => void) => {
      const listener = (_: unknown, events: CalendarEvent[]) => callback(events);
      ipcRenderer.on(IPC_CHANNELS.CALENDAR_EVENTS_UPDATED, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.CALENDAR_EVENTS_UPDATED, listener);
    },
  },

  // Tasks
  tasks: {
    create: (task: CreateTaskDTO): Promise<IPCResponse<Task>> =>
      invoke(IPC_CHANNELS.TASKS_CREATE, task),
    update: (task: UpdateTaskDTO): Promise<IPCResponse<Task>> =>
      invoke(IPC_CHANNELS.TASKS_UPDATE, task),
    delete: (id: string): Promise<IPCResponse<void>> =>
      invoke(IPC_CHANNELS.TASKS_DELETE, id),
    complete: (
      id: string,
      newMasteryLevel: number
    ): Promise<IPCResponse<Task>> =>
      invoke(IPC_CHANNELS.TASKS_COMPLETE, id, newMasteryLevel),
    getAll: (): Promise<IPCResponse<Task[]>> =>
      invoke(IPC_CHANNELS.TASKS_GET_ALL),
    getById: (id: string): Promise<IPCResponse<Task>> =>
      invoke(IPC_CHANNELS.TASKS_GET_BY_ID, id),
    onUpdated: (callback: (tasks: Task[]) => void) => {
      const listener = (_: unknown, tasks: Task[]) => callback(tasks);
      ipcRenderer.on(IPC_CHANNELS.TASKS_UPDATED, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.TASKS_UPDATED, listener);
    },
  },

  // Scheduled Tasks
  scheduled: {
    create: (request: ScheduleTaskRequest): Promise<IPCResponse<ScheduledTask>> =>
      invoke(IPC_CHANNELS.SCHEDULED_CREATE, request),
    update: (
      id: string,
      data: Partial<ScheduledTask>
    ): Promise<IPCResponse<ScheduledTask>> =>
      invoke(IPC_CHANNELS.SCHEDULED_UPDATE, id, data),
    delete: (id: string): Promise<IPCResponse<void>> =>
      invoke(IPC_CHANNELS.SCHEDULED_DELETE, id),
    getAll: (
      startDate: string,
      endDate: string
    ): Promise<IPCResponse<ScheduledTask[]>> =>
      invoke(IPC_CHANNELS.SCHEDULED_GET_ALL, startDate, endDate),
    complete: (id: string): Promise<IPCResponse<ScheduledTask>> =>
      invoke(IPC_CHANNELS.SCHEDULED_COMPLETE, id),
  },

  // Scheduling
  schedule: {
    findSlots: (request: FindSlotsRequest): Promise<IPCResponse<TimeSlot[]>> =>
      invoke(IPC_CHANNELS.SCHEDULE_FIND_SLOTS, request),
    placeTask: (request: ScheduleTaskRequest): Promise<IPCResponse<ScheduledTask>> =>
      invoke(IPC_CHANNELS.SCHEDULE_PLACE_TASK, request),
  },

  // Google Auth
  google: {
    authenticate: (): Promise<IPCResponse<void>> =>
      invoke(IPC_CHANNELS.GOOGLE_AUTHENTICATE),
    disconnect: (): Promise<IPCResponse<void>> =>
      invoke(IPC_CHANNELS.GOOGLE_DISCONNECT),
    checkAuth: (): Promise<IPCResponse<boolean>> =>
      invoke(IPC_CHANNELS.GOOGLE_CHECK_AUTH),
  },

  // Settings
  settings: {
    get: (): Promise<IPCResponse<Settings>> => invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: Partial<Settings>): Promise<IPCResponse<Settings>> =>
      invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  },

  // User Stats
  stats: {
    get: (): Promise<IPCResponse<UserStats>> => invoke(IPC_CHANNELS.STATS_GET),
    onUpdated: (callback: (stats: UserStats) => void) => {
      const listener = (_: unknown, stats: UserStats) => callback(stats);
      ipcRenderer.on(IPC_CHANNELS.STATS_UPDATED, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.STATS_UPDATED, listener);
    },
  },

  // Achievements
  achievements: {
    get: (): Promise<IPCResponse<Achievement[]>> =>
      invoke(IPC_CHANNELS.ACHIEVEMENTS_GET),
    onUnlocked: (callback: (achievement: Achievement) => void) => {
      const listener = (_: unknown, achievement: Achievement) =>
        callback(achievement);
      ipcRenderer.on(IPC_CHANNELS.ACHIEVEMENT_UNLOCKED, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.ACHIEVEMENT_UNLOCKED, listener);
    },
  },

  // Sync Status
  sync: {
    onStatusChange: (callback: (status: SyncStatus) => void) => {
      const listener = (_: unknown, status: SyncStatus) => callback(status);
      ipcRenderer.on(IPC_CHANNELS.SYNC_STATUS, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.SYNC_STATUS, listener);
    },
  },

  // Theme
  theme: {
    onChange: (callback: (isDark: boolean) => void) => {
      const listener = (_: unknown, isDark: boolean) => callback(isDark);
      ipcRenderer.on(IPC_CHANNELS.THEME_CHANGED, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.THEME_CHANGED, listener);
    },
  },

  // Updates
  updates: {
    check: (): Promise<IPCResponse<void>> =>
      invoke(IPC_CHANNELS.UPDATE_CHECK),
    download: (): Promise<IPCResponse<void>> =>
      invoke(IPC_CHANNELS.UPDATE_DOWNLOAD),
    install: (): Promise<IPCResponse<void>> =>
      invoke(IPC_CHANNELS.UPDATE_INSTALL),
    getState: (): Promise<IPCResponse<{ available: boolean; downloaded: boolean; info: { version: string; releaseNotes?: string } | null }>> =>
      invoke(IPC_CHANNELS.UPDATE_GET_STATE),
    onStatus: (callback: (status: { status: string; info?: unknown }) => void) => {
      const listener = (_: unknown, status: { status: string; info?: unknown }) => callback(status);
      ipcRenderer.on(IPC_CHANNELS.UPDATE_STATUS, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_STATUS, listener);
    },
  },

  // Notifications
  notifications: {
    onPlaySound: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on(IPC_CHANNELS.NOTIFICATION_PLAY_SOUND, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.NOTIFICATION_PLAY_SOUND, listener);
    },
    onNavigateToTasks: (callback: (taskId: string) => void) => {
      const listener = (_: unknown, taskId: string) => callback(taskId);
      ipcRenderer.on(IPC_CHANNELS.NAVIGATE_TO_TASKS, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.NAVIGATE_TO_TASKS, listener);
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for renderer
export type ElectronAPI = typeof electronAPI;
