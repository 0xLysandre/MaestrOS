// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  masteryLevel: MasteryLevel;
  customDeadline?: string; // ISO date string
  nextReviewDate: string; // ISO date string
  intervalDays: number;
  reviewCount: number; // Number of consecutive successful reviews
  createdAt: string; // ISO date string
  lastReviewedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
  pdfLink?: string;
  notes?: string;
  estimatedDuration: number; // minutes
  tags?: string[];
  isArchived: boolean;
}

export type MasteryLevel = 1 | 2 | 3 | 4 | 5;

export interface ScheduledTask {
  id: string;
  taskId: string;
  scheduledStart: string; // ISO date string
  scheduledEnd: string; // ISO date string
  completed: boolean;
  completedAt?: string; // ISO date string
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  googleEventId?: string;
  title: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  location?: string;
  description?: string;
  lastSynced: string; // ISO date string
  isGoogleEvent: boolean;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
  score?: number;
}

// User Stats & Gamification
export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string; // ISO date string
  totalTasksCompleted: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string; // ISO date string
  requirementType: 'tasks_completed' | 'streak' | 'mastery' | 'special';
  requirementValue: number;
  icon: string;
}

// Settings
export interface UrgencyLevelConfig {
  level: MasteryLevel;
  name: string;
  daysInterval: number;
  color: string;
}

export interface Settings {
  workingHoursStart: number; // Hour (0-23)
  workingHoursEnd: number; // Hour (0-23)
  bufferMinutes: number;
  theme: 'light' | 'dark' | 'system';
  urgencyLevels: UrgencyLevelConfig[];
  notificationsEnabled: boolean;
  autoSyncInterval: number; // minutes
}

// Google Auth
export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

// IPC Types
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Task Creation/Update DTOs
export interface CreateTaskDTO {
  title: string;
  description?: string;
  masteryLevel: MasteryLevel;
  customDeadline?: string;
  estimatedDuration: number;
  pdfLink?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  id: string;
}

// Scheduling DTOs
export interface FindSlotsRequest {
  taskDuration: number;
  startDate: string;
  endDate: string;
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
}

export interface ScheduleTaskRequest {
  taskId: string;
  startTime: string;
  endTime: string;
}

// Sync Status
export interface SyncStatus {
  issyncing: boolean;
  lastSyncTime?: string;
  error?: string;
}
