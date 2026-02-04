import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from 'date-fns';

/**
 * Format a date for display in a human-readable way
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) {
    return 'Today';
  }
  if (isTomorrow(d)) {
    return 'Tomorrow';
  }
  if (isYesterday(d)) {
    return 'Yesterday';
  }

  // Within the next 7 days, show day name
  const daysAway = differenceInDays(d, new Date());
  if (daysAway > 0 && daysAway <= 7) {
    return format(d, 'EEEE');
  }

  // Otherwise show full date
  return format(d, 'MMM d, yyyy');
}

/**
 * Format a time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
}

/**
 * Format a date and time together
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDisplayDate(d)} at ${formatTime(d)}`;
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Check if a date is overdue (in the past)
 */
export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isPast(d) && !isToday(d);
}

/**
 * Check if a date is due soon (within the next 3 days)
 */
export function isDueSoon(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const daysAway = differenceInDays(d, new Date());
  return daysAway >= 0 && daysAway <= 3;
}

/**
 * Get the start and end of the current week
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

/**
 * Get the start and end of a specific week
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * Get an array of dates for the current week
 */
export function getWeekDays(startDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

/**
 * Calculate the urgency score based on due date
 */
export function calculateDateUrgency(dueDate: Date | string): number {
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const hoursUntilDue = differenceInHours(d, now);

  if (hoursUntilDue < 0) {
    // Overdue - max urgency
    return 100;
  }
  if (hoursUntilDue <= 24) {
    // Due within 24 hours
    return 90 - Math.floor(hoursUntilDue / 24 * 10);
  }
  if (hoursUntilDue <= 72) {
    // Due within 3 days
    return 70 - Math.floor((hoursUntilDue - 24) / 48 * 20);
  }
  if (hoursUntilDue <= 168) {
    // Due within a week
    return 50 - Math.floor((hoursUntilDue - 72) / 96 * 20);
  }

  // More than a week away
  return Math.max(0, 30 - Math.floor(hoursUntilDue / 168 * 10));
}

/**
 * Parse an ISO date string safely
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get today's date as ISO string (date only, no time)
 */
export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return startOfDay(d1).getTime() === startOfDay(d2).getTime();
}
