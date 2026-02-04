import type {
  TimeSlot,
  Task,
} from '../../shared/types';
import { calendarEventQueries, scheduledTaskQueries } from '../database/queries';
import { DEFAULT_SETTINGS } from '../../shared/constants';

export interface SchedulingOptions {
  workingHoursStart: number;
  workingHoursEnd: number;
  bufferMinutes: number;
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
}

/**
 * Find available time slots in the calendar
 */
export function findAvailableSlots(
  startDate: Date,
  endDate: Date,
  requiredDuration: number,
  options: SchedulingOptions = {
    workingHoursStart: DEFAULT_SETTINGS.workingHoursStart,
    workingHoursEnd: DEFAULT_SETTINGS.workingHoursEnd,
    bufferMinutes: DEFAULT_SETTINGS.bufferMinutes,
  }
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Get all events in the date range
  const calendarEvents = calendarEventQueries.getByDateRange(
    startDate.toISOString(),
    endDate.toISOString()
  );

  // Get all scheduled tasks in the date range
  const scheduledTasks = scheduledTaskQueries.getByDateRange(
    startDate.toISOString(),
    endDate.toISOString()
  );

  // Combine and sort all busy periods
  const busyPeriods: { start: Date; end: Date }[] = [
    ...calendarEvents.map((e) => ({
      start: new Date(e.startTime),
      end: new Date(e.endTime),
    })),
    ...scheduledTasks.map((t) => ({
      start: new Date(t.scheduledStart),
      end: new Date(t.scheduledEnd),
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  // Iterate through each day in the range
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const daySlots = findDaySlots(
      current,
      busyPeriods,
      requiredDuration,
      options
    );
    slots.push(...daySlots);
    current.setDate(current.getDate() + 1);
  }

  // Score and sort slots
  return scoreAndSortSlots(slots, options);
}

/**
 * Find available slots for a specific day
 */
function findDaySlots(
  date: Date,
  busyPeriods: { start: Date; end: Date }[],
  requiredDuration: number,
  options: SchedulingOptions
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Working hours for this day
  const dayStart = new Date(date);
  dayStart.setHours(options.workingHoursStart, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(options.workingHoursEnd, 0, 0, 0);

  // Skip if day is in the past
  const now = new Date();
  if (dayEnd < now) return [];

  // Adjust start time if it's today and we're past working hours start
  if (date.toDateString() === now.toDateString() && now > dayStart) {
    // Round up to next 15 minutes
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    dayStart.setTime(now.getTime());
    dayStart.setMinutes(roundedMinutes);
    dayStart.setSeconds(0);
    dayStart.setMilliseconds(0);
  }

  // Filter busy periods for this day
  const dayBusyPeriods = busyPeriods.filter(
    (p) =>
      p.start.toDateString() === date.toDateString() ||
      p.end.toDateString() === date.toDateString()
  );

  // Find gaps between busy periods
  let currentTime = new Date(dayStart);

  for (const busy of dayBusyPeriods) {
    const busyStart = new Date(
      Math.max(busy.start.getTime(), dayStart.getTime())
    );
    const busyEnd = new Date(Math.min(busy.end.getTime(), dayEnd.getTime()));

    // Check gap before this busy period
    if (currentTime < busyStart) {
      const gapStart = new Date(currentTime);
      const gapEnd = new Date(busyStart.getTime() - options.bufferMinutes * 60 * 1000);
      const durationMinutes = (gapEnd.getTime() - gapStart.getTime()) / (60 * 1000);

      if (durationMinutes >= requiredDuration) {
        slots.push({
          start: gapStart,
          end: new Date(gapStart.getTime() + requiredDuration * 60 * 1000),
          durationMinutes: requiredDuration,
        });
      }
    }

    // Move current time past this busy period
    currentTime = new Date(busyEnd.getTime() + options.bufferMinutes * 60 * 1000);
  }

  // Check gap after last busy period
  if (currentTime < dayEnd) {
    const gapStart = new Date(currentTime);
    const gapEnd = new Date(dayEnd);
    const durationMinutes = (gapEnd.getTime() - gapStart.getTime()) / (60 * 1000);

    if (durationMinutes >= requiredDuration) {
      slots.push({
        start: gapStart,
        end: new Date(gapStart.getTime() + requiredDuration * 60 * 1000),
        durationMinutes: requiredDuration,
      });
    }
  }

  return slots;
}

/**
 * Score slots based on preferences and sort by score
 */
function scoreAndSortSlots(
  slots: TimeSlot[],
  options: SchedulingOptions
): TimeSlot[] {
  return slots
    .map((slot) => ({
      ...slot,
      score: scoreSlot(slot, options),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/**
 * Score a time slot based on preferences
 */
function scoreSlot(slot: TimeSlot, options: SchedulingOptions): number {
  let score = 50; // Base score

  const hour = slot.start.getHours();

  // Time of day preference
  if (options.preferredTimeOfDay === 'morning') {
    if (hour >= 6 && hour < 12) score += 30;
    else if (hour >= 12 && hour < 17) score += 10;
    else score -= 10;
  } else if (options.preferredTimeOfDay === 'afternoon') {
    if (hour >= 12 && hour < 17) score += 30;
    else if (hour >= 6 && hour < 12) score += 10;
    else score -= 10;
  } else if (options.preferredTimeOfDay === 'evening') {
    if (hour >= 17 && hour < 22) score += 30;
    else if (hour >= 12 && hour < 17) score += 10;
    else score -= 10;
  }

  // Prefer earlier in the day for critical tasks (morning productivity)
  if (hour >= 8 && hour <= 11) {
    score += 15;
  }

  // Slight penalty for very early or late slots
  if (hour < 7 || hour > 20) {
    score -= 10;
  }

  // Prefer today/tomorrow over later dates
  const today = new Date();
  const daysAway = Math.floor(
    (slot.start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysAway === 0) score += 20;
  else if (daysAway === 1) score += 15;
  else if (daysAway <= 3) score += 10;
  else score -= daysAway * 2;

  return Math.max(0, Math.min(100, score));
}

/**
 * Auto-schedule a task into the best available slot
 */
export function autoScheduleTask(
  task: Task,
  startDate: Date,
  endDate: Date,
  options?: SchedulingOptions
): TimeSlot | null {
  const slots = findAvailableSlots(
    startDate,
    endDate,
    task.estimatedDuration,
    options
  );

  if (slots.length === 0) {
    return null;
  }

  return slots[0]; // Return best slot
}

/**
 * Check if a time slot conflicts with existing events
 */
export function hasConflict(
  start: Date,
  end: Date
): boolean {
  const events = calendarEventQueries.getByDateRange(
    start.toISOString(),
    end.toISOString()
  );

  const scheduledTasks = scheduledTaskQueries.getByDateRange(
    start.toISOString(),
    end.toISOString()
  );

  // Check calendar events
  for (const event of events) {
    const itemStart = new Date(event.startTime);
    const itemEnd = new Date(event.endTime);
    if (start < itemEnd && end > itemStart) {
      return true;
    }
  }

  // Check scheduled tasks
  for (const task of scheduledTasks) {
    const itemStart = new Date(task.scheduledStart);
    const itemEnd = new Date(task.scheduledEnd);
    if (start < itemEnd && end > itemStart) {
      return true;
    }
  }

  return false;
}

/**
 * Batch schedule multiple tasks
 */
export function batchScheduleTasks(
  tasks: Task[],
  startDate: Date,
  endDate: Date,
  options?: SchedulingOptions
): Map<string, TimeSlot | null> {
  const results = new Map<string, TimeSlot | null>();

  // Sort tasks by urgency (lower mastery level = higher priority)
  const sortedTasks = [...tasks].sort((a, b) => a.masteryLevel - b.masteryLevel);

  // Track scheduled slots to avoid conflicts
  const scheduledSlots: { start: Date; end: Date }[] = [];

  for (const task of sortedTasks) {
    const slots = findAvailableSlots(
      startDate,
      endDate,
      task.estimatedDuration,
      options
    );

    // Find first slot that doesn't conflict with already scheduled tasks
    const availableSlot = slots.find((slot) => {
      return !scheduledSlots.some(
        (scheduled) =>
          slot.start < scheduled.end && slot.end > scheduled.start
      );
    });

    if (availableSlot) {
      results.set(task.id, availableSlot);
      scheduledSlots.push({
        start: availableSlot.start,
        end: availableSlot.end,
      });
    } else {
      results.set(task.id, null);
    }
  }

  return results;
}

/**
 * Reschedule overdue tasks to today
 */
export function rescheduleOverdueTasks(
  tasks: Task[],
  options?: SchedulingOptions
): Map<string, TimeSlot | null> {
  const now = new Date();
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const overdueTasks = tasks.filter((task) => {
    const nextReview = new Date(task.nextReviewDate);
    return nextReview < now && !task.isArchived;
  });

  return batchScheduleTasks(overdueTasks, now, tomorrow, options);
}
