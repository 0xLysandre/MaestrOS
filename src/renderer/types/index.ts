// Re-export shared types for convenience
export type {
  Task,
  ScheduledTask,
  CalendarEvent,
  TimeSlot,
  UserStats,
  Achievement,
  Settings,
  UrgencyLevelConfig,
  MasteryLevel,
  CreateTaskDTO,
  UpdateTaskDTO,
  FindSlotsRequest,
  ScheduleTaskRequest,
  SyncStatus,
  IPCResponse,
} from '../../shared/types';

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
