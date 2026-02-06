import { create } from 'zustand';
import toast from 'react-hot-toast';
import { addDays, addHours, subDays, startOfToday, setHours } from 'date-fns';
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
  MasteryLevel,
} from '../types';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  workingHoursStart: 8,
  workingHoursEnd: 22,
  bufferMinutes: 10,
  theme: 'system',
  urgencyLevels: [
    { level: 1, name: 'Critical', daysInterval: 1, color: '#ef4444' },
    { level: 2, name: 'Urgent', daysInterval: 3, color: '#f97316' },
    { level: 3, name: 'Deadline', daysInterval: 7, color: '#eab308' },
    { level: 4, name: 'Good', daysInterval: 7, color: '#22c55e' },
    { level: 5, name: 'Mastered', daysInterval: 21, color: '#06b6d4' },
  ],
  notificationsEnabled: true,
  autoSyncInterval: 15,
};

// Check if running inside Electron
const isElectron = typeof window !== 'undefined' &&
  typeof window.electronAPI !== 'undefined' &&
  window.electronAPI !== null;

// Simple counter for generating unique IDs in browser mode
let mockIdCounter = 100;
function generateMockId(): string {
  return `mock-${++mockIdCounter}`;
}

// Generate mock data for browser development mode
function generateMockData() {
  const today = startOfToday();
  const now = new Date();

  const mockTasks: Task[] = [
    {
      id: 'mock-1',
      title: 'Review Cardiology - Heart Failure',
      description: 'Review pathophysiology, diagnosis, and treatment of CHF',
      masteryLevel: 1 as MasteryLevel,
      nextReviewDate: now.toISOString(),
      intervalDays: 1,
      createdAt: subDays(now, 5).toISOString(),
      estimatedDuration: 45,
      tags: ['cardiology', 'exam-prep'],
      isArchived: false,
    },
    {
      id: 'mock-2',
      title: 'Pharmacology - Antibiotics',
      description: 'Mechanism of action, spectrum, and side effects',
      masteryLevel: 2 as MasteryLevel,
      nextReviewDate: addDays(now, 1).toISOString(),
      intervalDays: 3,
      createdAt: subDays(now, 10).toISOString(),
      lastReviewedAt: subDays(now, 2).toISOString(),
      estimatedDuration: 60,
      tags: ['pharmacology'],
      isArchived: false,
    },
    {
      id: 'mock-3',
      title: 'Anatomy - Brachial Plexus',
      description: 'Nerve roots, trunks, divisions, cords, and branches',
      masteryLevel: 3 as MasteryLevel,
      nextReviewDate: addDays(now, 3).toISOString(),
      intervalDays: 7,
      createdAt: subDays(now, 14).toISOString(),
      lastReviewedAt: subDays(now, 5).toISOString(),
      estimatedDuration: 30,
      tags: ['anatomy', 'upper-limb'],
      isArchived: false,
    },
    {
      id: 'mock-4',
      title: 'Biochemistry - Krebs Cycle',
      description: 'Key enzymes, substrates, and regulation',
      masteryLevel: 4 as MasteryLevel,
      nextReviewDate: addDays(now, 5).toISOString(),
      intervalDays: 7,
      createdAt: subDays(now, 21).toISOString(),
      lastReviewedAt: subDays(now, 3).toISOString(),
      estimatedDuration: 30,
      tags: ['biochemistry'],
      isArchived: false,
    },
    {
      id: 'mock-5',
      title: 'Histology - Epithelial Tissue',
      description: 'Types, locations, and functions of epithelial tissues',
      masteryLevel: 5 as MasteryLevel,
      nextReviewDate: addDays(now, 14).toISOString(),
      intervalDays: 21,
      createdAt: subDays(now, 30).toISOString(),
      lastReviewedAt: subDays(now, 7).toISOString(),
      estimatedDuration: 20,
      tags: ['histology'],
      isArchived: false,
    },
    {
      id: 'mock-6',
      title: 'Pathology - Inflammation',
      description: 'Acute vs chronic inflammation, mediators, and outcomes',
      masteryLevel: 2 as MasteryLevel,
      nextReviewDate: addDays(now, 2).toISOString(),
      intervalDays: 3,
      createdAt: subDays(now, 8).toISOString(),
      estimatedDuration: 45,
      tags: ['pathology', 'exam-prep'],
      isArchived: false,
    },
  ];

  const mockScheduledTasks: ScheduledTask[] = [
    {
      id: 'sched-1',
      taskId: 'mock-1',
      scheduledStart: setHours(today, 9).toISOString(),
      scheduledEnd: setHours(today, 10).toISOString(),
      completed: false,
    },
    {
      id: 'sched-2',
      taskId: 'mock-3',
      scheduledStart: setHours(today, 14).toISOString(),
      scheduledEnd: setHours(today, 15).toISOString(),
      completed: false,
    },
    {
      id: 'sched-3',
      taskId: 'mock-2',
      scheduledStart: setHours(addDays(today, 1), 10).toISOString(),
      scheduledEnd: setHours(addDays(today, 1), 11).toISOString(),
      completed: false,
    },
  ];

  const mockCalendarEvents: CalendarEvent[] = [
    {
      id: 'cal-1',
      googleEventId: 'google-1',
      title: 'Anatomy Lecture',
      startTime: setHours(today, 8).toISOString(),
      endTime: setHours(today, 9).toISOString(),
      location: 'Lecture Hall A',
      lastSynced: now.toISOString(),
      isGoogleEvent: true,
    },
    {
      id: 'cal-2',
      googleEventId: 'google-2',
      title: 'Clinical Skills Lab',
      startTime: setHours(today, 11).toISOString(),
      endTime: setHours(today, 13).toISOString(),
      location: 'Simulation Center',
      lastSynced: now.toISOString(),
      isGoogleEvent: true,
    },
    {
      id: 'cal-3',
      googleEventId: 'google-3',
      title: 'Pharmacology Seminar',
      startTime: setHours(addDays(today, 1), 13).toISOString(),
      endTime: setHours(addDays(today, 1), 15).toISOString(),
      location: 'Room 204',
      lastSynced: now.toISOString(),
      isGoogleEvent: true,
    },
  ];

  const mockStats: UserStats = {
    currentStreak: 5,
    longestStreak: 12,
    lastActivityDate: now.toISOString(),
    totalTasksCompleted: 47,
  };

  const mockAchievements: Achievement[] = [
    {
      id: 'first-task',
      title: 'First Steps',
      description: 'Complete your first task',
      unlockedAt: subDays(now, 25).toISOString(),
      requirementType: 'tasks_completed',
      requirementValue: 1,
      icon: '🎯',
    },
    {
      id: 'ten-tasks',
      title: 'Getting Serious',
      description: 'Complete 10 tasks',
      unlockedAt: subDays(now, 15).toISOString(),
      requirementType: 'tasks_completed',
      requirementValue: 10,
      icon: '📚',
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      unlockedAt: subDays(now, 5).toISOString(),
      requirementType: 'streak',
      requirementValue: 7,
      icon: '🔥',
    },
    {
      id: 'fifty-tasks',
      title: 'Half Century',
      description: 'Complete 50 tasks',
      requirementType: 'tasks_completed',
      requirementValue: 50,
      icon: '🏆',
    },
    {
      id: 'month-streak',
      title: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      requirementType: 'streak',
      requirementValue: 30,
      icon: '⭐',
    },
  ];

  return {
    tasks: mockTasks,
    scheduledTasks: mockScheduledTasks,
    calendarEvents: mockCalendarEvents,
    stats: mockStats,
    achievements: mockAchievements,
  };
}

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
  isElectronMode: boolean;
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
  isElectronMode: isElectron,
  theme: 'system',

  // Initialize app
  initializeApp: async () => {
    try {
      set({ isLoading: true });

      if (!isElectron) {
        console.info('Running in browser mode - loading mock data for preview');
        const mock = generateMockData();
        set({
          tasks: mock.tasks,
          scheduledTasks: mock.scheduledTasks,
          calendarEvents: mock.calendarEvents,
          stats: mock.stats,
          achievements: mock.achievements,
          isLoading: false,
        });
        return;
      }

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
    }
  },

  // Tasks
  fetchTasks: async () => {
    if (!isElectron) return;
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
    if (!isElectron) {
      // Browser mode: create task in local state
      const now = new Date().toISOString();
      const intervalDays = DEFAULT_SETTINGS.urgencyLevels.find(
        (l) => l.level === dto.masteryLevel
      )?.daysInterval ?? 1;
      const newTask: Task = {
        id: generateMockId(),
        title: dto.title,
        description: dto.description,
        masteryLevel: dto.masteryLevel,
        customDeadline: dto.customDeadline,
        nextReviewDate: dto.customDeadline ?? addDays(new Date(), intervalDays).toISOString(),
        intervalDays,
        createdAt: now,
        estimatedDuration: dto.estimatedDuration,
        pdfLink: dto.pdfLink,
        notes: dto.notes,
        tags: dto.tags,
        isArchived: false,
      };
      set((state) => ({ tasks: [...state.tasks, newTask] }));
      toast.success('Task created');
      return newTask;
    }
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
    if (!isElectron) {
      // Browser mode: update task in local state
      let updated: Task | null = null;
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === dto.id) {
            updated = { ...t, ...dto } as Task;
            return updated;
          }
          return t;
        }),
      }));
      if (updated) toast.success('Task updated');
      return updated;
    }
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
    if (!isElectron) {
      // Browser mode: delete task from local state
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      toast.success('Task deleted');
      return true;
    }
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
    if (!isElectron) {
      // Browser mode: complete task in local state
      const now = new Date().toISOString();
      const intervalDays = DEFAULT_SETTINGS.urgencyLevels.find(
        (l) => l.level === newMasteryLevel
      )?.daysInterval ?? 1;
      let completed: Task | null = null;
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === id) {
            completed = {
              ...t,
              masteryLevel: newMasteryLevel as MasteryLevel,
              lastReviewedAt: now,
              completedAt: now,
              nextReviewDate: addDays(new Date(), intervalDays).toISOString(),
              intervalDays,
            };
            return completed;
          }
          return t;
        }),
        stats: {
          ...state.stats,
          totalTasksCompleted: state.stats.totalTasksCompleted + 1,
        },
      }));
      if (completed) toast.success('Task completed!');
      return completed;
    }
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
    if (!isElectron) return;
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
    console.log('[Store] scheduleTask called:', { taskId, start, end, isElectron });
    if (!isElectron) {
      // Browser mode: schedule task in local state
      const scheduled: ScheduledTask = {
        id: generateMockId(),
        taskId,
        scheduledStart: start,
        scheduledEnd: end,
        completed: false,
      };
      set((state) => {
        console.log('[Store] Browser mode - adding scheduled task. Current count:', state.scheduledTasks.length);
        return { scheduledTasks: [...state.scheduledTasks, scheduled] };
      });
      toast.success('Task scheduled');
      console.log('[Store] Scheduled task created:', scheduled);
      return scheduled;
    }
    try {
      const response = await window.electronAPI.schedule.placeTask({
        taskId,
        startTime: start,
        endTime: end,
      });
      console.log('[Store] placeTask response:', response);
      if (response.success && response.data) {
        set((state) => {
          console.log('[Store] Electron mode - adding scheduled task. Current count:', state.scheduledTasks.length);
          return { scheduledTasks: [...state.scheduledTasks, response.data!] };
        });
        toast.success('Task scheduled');
        return response.data;
      } else {
        console.error('[Store] placeTask failed:', response.error);
        toast.error(response.error || 'Failed to schedule task');
        return null;
      }
    } catch (error) {
      console.error('[Store] Failed to schedule task:', error);
      toast.error('Failed to schedule task');
      return null;
    }
  },

  updateScheduledTask: async (id, start, end) => {
    if (!isElectron) {
      // Browser mode: update in local state
      let updated: ScheduledTask | null = null;
      set((state) => ({
        scheduledTasks: state.scheduledTasks.map((t) => {
          if (t.id === id) {
            updated = { ...t, scheduledStart: start, scheduledEnd: end };
            return updated;
          }
          return t;
        }),
      }));
      return updated;
    }
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
    if (!isElectron) {
      set((state) => ({
        scheduledTasks: state.scheduledTasks.filter((t) => t.id !== id),
      }));
      return true;
    }
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
    if (!isElectron) {
      let updated: ScheduledTask | null = null;
      set((state) => ({
        scheduledTasks: state.scheduledTasks.map((t) => {
          if (t.id === id) {
            updated = { ...t, completed: true, completedAt: new Date().toISOString() };
            return updated;
          }
          return t;
        }),
      }));
      return updated;
    }
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
    if (!isElectron) return; // Mock events already loaded
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
    if (!isElectron) {
      toast('Calendar sync requires the desktop app', { icon: 'ℹ️' });
      return;
    }
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
    if (!isElectron) {
      // Browser mode: generate some mock available slots
      const start = new Date(startDate);
      const slots: TimeSlot[] = [];
      for (let d = 0; d < 5; d++) {
        const day = addDays(start, d);
        slots.push({
          start: setHours(day, 10),
          end: addHours(setHours(day, 10), duration / 60),
          durationMinutes: duration,
          score: 90 - d * 10,
        });
        slots.push({
          start: setHours(day, 15),
          end: addHours(setHours(day, 15), duration / 60),
          durationMinutes: duration,
          score: 80 - d * 10,
        });
      }
      return slots.slice(0, 10);
    }
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
    if (!isElectron) {
      toast('Google Calendar connection requires the desktop app', { icon: 'ℹ️' });
      return;
    }
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
    if (!isElectron) return;
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
    if (!isElectron) return;
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
    if (!isElectron) return;
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
    if (!isElectron) {
      // In browser mode, just update local state
      set((state) => ({
        settings: { ...state.settings, ...newSettings },
        ...(newSettings.theme ? { theme: newSettings.theme } : {}),
      }));
      toast.success('Settings saved');
      return;
    }
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
    if (!isElectron) return;
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
    if (!isElectron) return;
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
  set: (state: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void,
  get: () => AppState
) {
  if (!isElectron) return;

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
