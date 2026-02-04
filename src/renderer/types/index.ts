// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  masteryLevel: MasteryLevel;
  customDeadline?: string;
  nextReviewDate: string;
  intervalDays: number;
  createdAt: string;
  lastReviewedAt?: string;
  completedAt?: string;
  pdfLink?: string;
  notes?: string;
  estimatedDuration: number;
  tags?: string[];
  isArchived: boolean;
}

export type MasteryLevel = 1 | 2 | 3 | 4 | 5;

export interface ScheduledTask {
  id: string;
  taskId: string;
  scheduledStart: string;
  scheduledEnd: string;
  completed: boolean;
  completedAt?: string;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  googleEventId?: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  lastSynced: string;
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
  lastActivityDate?: string;
  totalTasksCompleted: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string;
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
  workingHoursStart: number;
  workingHoursEnd: number;
  bufferMinutes: number;
  theme: 'light' | 'dark' | 'system';
  urgencyLevels: UrgencyLevelConfig[];
  notificationsEnabled: boolean;
  autoSyncInterval: number;
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
  isSyncing: boolean;
  lastSyncTime?: string;
  error?: string;
}

// View types
export type ViewType = 'calendar' | 'tasks' | 'profile' | 'settings';

// Calendar view types
export type CalendarViewType = 'timeGridWeek' | 'timeGridDay' | 'dayGridMonth';

// Sort options for tasks
export type TaskSortOption = 'urgency' | 'date' | 'created' | 'duration';

// Filter options
export interface TaskFilter {
  masteryLevels?: number[];
  tags?: string[];
  showArchived?: boolean;
  searchQuery?: string;
}

// Modal state
export interface ModalState {
  isOpen: boolean;
  type?: 'create' | 'edit' | 'view' | 'schedule' | 'settings';
  data?: unknown;
}

// Notification type
export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'achievement';
  title: string;
  message?: string;
  duration?: number;
}
