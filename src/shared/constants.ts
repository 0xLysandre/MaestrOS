import type { UrgencyLevelConfig, Achievement } from './types';

// Default urgency level configuration
export const DEFAULT_URGENCY_LEVELS: UrgencyLevelConfig[] = [
  {
    level: 1,
    name: 'Critical',
    daysInterval: 1,
    color: '#ef4444', // red
  },
  {
    level: 2,
    name: 'Urgent',
    daysInterval: 3,
    color: '#f97316', // orange
  },
  {
    level: 3,
    name: 'Deadline',
    daysInterval: 7,
    color: '#eab308', // yellow
  },
  {
    level: 4,
    name: 'Good',
    daysInterval: 7,
    color: '#22c55e', // green
  },
  {
    level: 5,
    name: 'Mastered',
    daysInterval: 21,
    color: '#06b6d4', // cyan
  },
];

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_task',
    title: 'Getting Started',
    description: 'Complete your first task',
    requirementType: 'tasks_completed',
    requirementValue: 1,
    icon: '🎯',
  },
  {
    id: 'tasks_10',
    title: 'Momentum Building',
    description: 'Complete 10 tasks',
    requirementType: 'tasks_completed',
    requirementValue: 10,
    icon: '🚀',
  },
  {
    id: 'tasks_50',
    title: 'Dedicated Student',
    description: 'Complete 50 tasks',
    requirementType: 'tasks_completed',
    requirementValue: 50,
    icon: '📚',
  },
  {
    id: 'tasks_100',
    title: 'Century Club',
    description: 'Complete 100 tasks',
    requirementType: 'tasks_completed',
    requirementValue: 100,
    icon: '💯',
  },
  {
    id: 'tasks_500',
    title: 'Master Learner',
    description: 'Complete 500 tasks',
    requirementType: 'tasks_completed',
    requirementValue: 500,
    icon: '🏆',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    requirementType: 'streak',
    requirementValue: 7,
    icon: '🔥',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    requirementType: 'streak',
    requirementValue: 30,
    icon: '⭐',
  },
  {
    id: 'streak_100',
    title: 'Centurion',
    description: 'Maintain a 100-day streak',
    requirementType: 'streak',
    requirementValue: 100,
    icon: '👑',
  },
  {
    id: 'first_mastery',
    title: 'First Mastery',
    description: 'Master your first topic',
    requirementType: 'mastery',
    requirementValue: 1,
    icon: '🌟',
  },
  {
    id: 'mastery_10',
    title: 'Knowledge Builder',
    description: 'Master 10 topics',
    requirementType: 'mastery',
    requirementValue: 10,
    icon: '🧠',
  },
];

// IPC Channel names
export const IPC_CHANNELS = {
  // Calendar
  CALENDAR_SYNC: 'calendar:sync',
  CALENDAR_GET_EVENTS: 'calendar:get-events',
  CALENDAR_EVENTS_UPDATED: 'calendar:events-updated',

  // Tasks
  TASKS_CREATE: 'tasks:create',
  TASKS_UPDATE: 'tasks:update',
  TASKS_DELETE: 'tasks:delete',
  TASKS_COMPLETE: 'tasks:complete',
  TASKS_GET_ALL: 'tasks:get-all',
  TASKS_GET_BY_ID: 'tasks:get-by-id',
  TASKS_UPDATED: 'tasks:updated',

  // Scheduled Tasks
  SCHEDULED_CREATE: 'scheduled:create',
  SCHEDULED_UPDATE: 'scheduled:update',
  SCHEDULED_DELETE: 'scheduled:delete',
  SCHEDULED_GET_ALL: 'scheduled:get-all',
  SCHEDULED_COMPLETE: 'scheduled:complete',

  // Scheduling
  SCHEDULE_FIND_SLOTS: 'schedule:find-slots',
  SCHEDULE_PLACE_TASK: 'schedule:place-task',

  // Google Auth
  GOOGLE_AUTHENTICATE: 'google:authenticate',
  GOOGLE_DISCONNECT: 'google:disconnect',
  GOOGLE_CHECK_AUTH: 'google:check-auth',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // User Stats
  STATS_GET: 'stats:get',
  STATS_UPDATED: 'stats:updated',

  // Achievements
  ACHIEVEMENTS_GET: 'achievements:get',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',

  // Sync Status
  SYNC_STATUS: 'sync:status',

  // Theme
  THEME_CHANGED: 'theme:changed',

  // Updates
  UPDATE_CHECK: 'update:check',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_INSTALL: 'update:install',
  UPDATE_GET_STATE: 'update:get-state',
  UPDATE_STATUS: 'update:status',

  // Notifications
  NOTIFICATION_PLAY_SOUND: 'notification:play-sound',
  NAVIGATE_TO_TASKS: 'navigate:tasks',
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  workingHoursStart: 8,
  workingHoursEnd: 22,
  bufferMinutes: 10,
  theme: 'system' as const,
  urgencyLevels: DEFAULT_URGENCY_LEVELS,
  notificationsEnabled: true,
  autoSyncInterval: 15,
};

// Spaced repetition intervals (in days)
export const SR_INTERVALS = {
  1: 1,   // Critical: 1 day
  2: 3,   // Urgent: 3 days
  3: 7,   // Deadline: custom or 7 days
  4: 7,   // Good: 7 days
  5: 21,  // Mastered: 21 days
} as const;

// Minimum task duration in minutes
export const MIN_TASK_DURATION = 15;

// Default estimated duration for new tasks (in minutes)
export const DEFAULT_TASK_DURATION = 30;
