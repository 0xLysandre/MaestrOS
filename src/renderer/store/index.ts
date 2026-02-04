import { create } from 'zustand';
import toast from 'react-hot-toast';
import type {
  Task,
  ScheduledTask,
  CalendarEvent,
  UserStats,
  Achievement,
  Settings,
  CreateTaskDTO,
  UpdateTaskDTO,
  TimeSlot,
  SyncStatus,
} from '../types';
import { DEFAULT_SETTINGS } from '@shared/constants';

interface AppState {
  // Data
  tasks: Task[];
  scheduledTasks: ScheduledTask[];
  calendarEvents: CalendarEvent[];
  stats: UserStats;
  achievements: Achievement[];
  settings: Settings;

  // UI State
  isLoading: boolean;
  isSyncing: boolean;
  isGoogleConnected: boolean;
  theme: 'light' | 'dark' | 'system';

  // Actions
  initializeApp: () => Promise<void>;

  // Tasks
  fetchTasks: () => Promise<void>;
  createTask: (dto: CreateTaskDTO) => Promise<Task | null>;
  updateTask: (dto: UpdateTaskDTO) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  completeTask: (id: string, newMasteryLevel: number) => Promise<Task | null>;

  // Scheduled Tasks
  fetchScheduledTasks: (startDate: string, endDate: string) => Promise<void>;
  scheduleTask: (taskId: string, start: string, end: string) => Promise<ScheduledTask | null>;
  updateScheduledTask: (id: string, start: string, end: string) => Promise<ScheduledTask | null>;
  deleteScheduledTask: (id: string) => Promise<boolean>;
  completeScheduledTask: (id: string) => Promise<ScheduledTask | null>;

  // Calendar
  fetchCalendarEvents: (startDate: string, endDate: string) => Promise<void>;
  syncCalendar: () => Promise<void>;

  // Scheduling
  findAvailableSlots: (duration: number, startDate: string, endDate: string) => Promise<TimeSlot[]>;

  // Google Auth
  connectGoogle: () => Promise<void>;
  disconnectGoogle: () => Promise<void>;
  checkGoogleAuth: () => Promise<void>;

  // Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  // Stats & Achievements
  fetchStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;

  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  tasks: [],
  scheduledTasks: [],
  calendarEvents: [],
  stats: {
    currentStreak: 0,
    longestStreak: 0,
    totalTasksCompleted: 0,
  },
  achievements: [],
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isSyncing: false,
  isGoogleConnected: false,
  theme: 'system',

  // Initialize app
  initializeApp: async () => {
    try {
      set({ isLoading: true });

      // Fetch all initial data in parallel
      await Promise.all([
        get().fetchSettings(),
        get().fetchTasks(),
        get().fetchStats(),
        get().fetchAchievements(),
        get().checkGoogleAuth(),
      ]);

      // Set up IPC listeners
      setupIpcListeners(set, get);

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ isLoading: false });
      toast.error('Failed to initialize app');
    }
  },

  // Tasks
  fetchTasks: async () => {
    try {
      const response = await window.electronAPI.tasks.getAll();
      if (response.success && response.data) {
        set({ tasks: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  },

  createTask: async (dto) => {
    try {
      const response = await window.electronAPI.tasks.create(dto);
      if (response.success && response.data) {
        toast.success('Task created');
        return response.data;
      } else {
        toast.error(response.error || 'Failed to create task');
        return null;
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
      return null;
    }
  },

  updateTask: async (dto) => {
    try {
      const response = await window.electronAPI.tasks.update(dto);
      if (response.success && response.data) {
        toast.success('Task updated');
        return response.data;
      } else {
        toast.error(response.error || 'Failed to update task');
        return null;
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
      return null;
    }
  },

  deleteTask: async (id) => {
    try {
      const response = await window.electronAPI.tasks.delete(id);
      if (response.success) {
        toast.success('Task deleted');
        return true;
      } else {
        toast.error(response.error || 'Failed to delete task');
        return false;
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
      return false;
    }
  },

  completeTask: async (id, newMasteryLevel) => {
    try {
      const response = await window.electronAPI.tasks.complete(id, newMasteryLevel);
      if (response.success && response.data) {
        toast.success('Task completed!');
        return response.data;
      } else {
        toast.error(response.error || 'Failed to complete task');
        return null;
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
      return null;
    }
  },

  // Scheduled Tasks
  fetchScheduledTasks: async (startDate, endDate) => {
    try {
      const response = await window.electronAPI.scheduled.getAll(startDate, endDate);
      if (response.success && response.data) {
        set({ scheduledTasks: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch scheduled tasks:', error);
    }
  },

  scheduleTask: async (taskId, start, end) => {
    try {
      const response = await window.electronAPI.schedule.placeTask({
        taskId,
        startTime: start,
        endTime: end,
      });
      if (response.success && response.data) {
        set((state) => ({
          scheduledTasks: [...state.scheduledTasks, response.data!],
        }));
        toast.success('Task scheduled');
        return response.data;
      } else {
        toast.error(response.error || 'Failed to schedule task');
        return null;
      }
    } catch (error) {
      console.error('Failed to schedule task:', error);
      toast.error('Failed to schedule task');
      return null;
    }
  },

  updateScheduledTask: async (id, start, end) => {
    try {
      const response = await window.electronAPI.scheduled.update(id, {
        scheduledStart: start,
        scheduledEnd: end,
      });
      if (response.success && response.data) {
        set((state) => ({
          scheduledTasks: state.scheduledTasks.map((t) =>
            t.id === id ? response.data! : t
          ),
        }));
        return response.data;
      } else {
        toast.error(response.error || 'Failed to update scheduled task');
        return null;
      }
    } catch (error) {
      console.error('Failed to update scheduled task:', error);
      return null;
    }
  },

  deleteScheduledTask: async (id) => {
    try {
      const response = await window.electronAPI.scheduled.delete(id);
      if (response.success) {
        set((state) => ({
          scheduledTasks: state.scheduledTasks.filter((t) => t.id !== id),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete scheduled task:', error);
      return false;
    }
  },

  completeScheduledTask: async (id) => {
    try {
      const response = await window.electronAPI.scheduled.complete(id);
      if (response.success && response.data) {
        set((state) => ({
          scheduledTasks: state.scheduledTasks.map((t) =>
            t.id === id ? response.data! : t
          ),
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to complete scheduled task:', error);
      return null;
    }
  },

  // Calendar
  fetchCalendarEvents: async (startDate, endDate) => {
    try {
      const response = await window.electronAPI.calendar.getEvents(startDate, endDate);
      if (response.success && response.data) {
        set({ calendarEvents: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    }
  },

  syncCalendar: async () => {
    const { isGoogleConnected } = get();
    if (!isGoogleConnected) {
      toast.error('Please connect Google Calendar first');
      return;
    }

    try {
      set({ isSyncing: true });
      const response = await window.electronAPI.calendar.sync();
      if (response.success && response.data) {
        set({ calendarEvents: response.data });
        toast.success('Calendar synced');
      } else {
        toast.error(response.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      toast.error('Sync failed');
    } finally {
      set({ isSyncing: false });
    }
  },

  // Scheduling
  findAvailableSlots: async (duration, startDate, endDate) => {
    try {
      const response = await window.electronAPI.schedule.findSlots({
        taskDuration: duration,
        startDate,
        endDate,
      });
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to find slots:', error);
      return [];
    }
  },

  // Google Auth
  connectGoogle: async () => {
    try {
      const response = await window.electronAPI.google.authenticate();
      if (response.success) {
        set({ isGoogleConnected: true });
        toast.success('Google Calendar connected');
        get().syncCalendar();
      } else {
        toast.error(response.error || 'Connection failed');
      }
    } catch (error) {
      console.error('Failed to connect Google:', error);
      toast.error('Connection failed');
    }
  },

  disconnectGoogle: async () => {
    try {
      const response = await window.electronAPI.google.disconnect();
      if (response.success) {
        set({ isGoogleConnected: false, calendarEvents: [] });
        toast.success('Google Calendar disconnected');
      } else {
        toast.error(response.error || 'Disconnect failed');
      }
    } catch (error) {
      console.error('Failed to disconnect Google:', error);
      toast.error('Disconnect failed');
    }
  },

  checkGoogleAuth: async () => {
    try {
      const response = await window.electronAPI.google.checkAuth();
      if (response.success) {
        set({ isGoogleConnected: response.data ?? false });
      }
    } catch (error) {
      console.error('Failed to check Google auth:', error);
    }
  },

  // Settings
  fetchSettings: async () => {
    try {
      const response = await window.electronAPI.settings.get();
      if (response.success && response.data) {
        set({ settings: response.data, theme: response.data.theme });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const response = await window.electronAPI.settings.set(newSettings);
      if (response.success && response.data) {
        set({ settings: response.data });
        if (newSettings.theme) {
          set({ theme: newSettings.theme });
        }
        toast.success('Settings saved');
      } else {
        toast.error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to save settings');
    }
  },

  // Stats & Achievements
  fetchStats: async () => {
    try {
      const response = await window.electronAPI.stats.get();
      if (response.success && response.data) {
        set({ stats: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  fetchAchievements: async () => {
    try {
      const response = await window.electronAPI.achievements.get();
      if (response.success && response.data) {
        set({ achievements: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    }
  },

  // Theme
  setTheme: (theme) => {
    set({ theme });
    get().updateSettings({ theme });
  },
}));

// Set up IPC listeners for real-time updates
function setupIpcListeners(
  set: (state: Partial<AppState>) => void,
  get: () => AppState
) {
  // Tasks updated
  window.electronAPI.tasks.onUpdated((tasks) => {
    set({ tasks });
  });

  // Calendar events updated
  window.electronAPI.calendar.onEventsUpdated((events) => {
    set({ calendarEvents: events });
  });

  // Stats updated
  window.electronAPI.stats.onUpdated((stats) => {
    set({ stats });
  });

  // Achievement unlocked
  window.electronAPI.achievements.onUnlocked((achievement) => {
    toast.success(`Achievement Unlocked: ${achievement.title}`, {
      icon: achievement.icon,
      duration: 5000,
    });
    get().fetchAchievements();
  });

  // Theme changed (system)
  window.electronAPI.theme.onChange((isDark) => {
    if (get().theme === 'system') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  });
}
