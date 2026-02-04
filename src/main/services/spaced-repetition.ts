import type { MasteryLevel, Task } from '../../shared/types';
import { DEFAULT_URGENCY_LEVELS, SR_INTERVALS } from '../../shared/constants';

export interface ReviewResult {
  nextReviewDate: Date;
  newIntervalDays: number;
  newMasteryLevel: MasteryLevel;
}

/**
 * Simplified SM-2 algorithm implementation for spaced repetition
 *
 * The algorithm determines the next review date based on:
 * - Current mastery level
 * - Whether the review was successful
 * - Custom deadline (if set)
 */
export function calculateNextReview(
  currentLevel: MasteryLevel,
  wasSuccessful: boolean,
  currentIntervalDays: number,
  customDeadline?: string
): ReviewResult {
  let newMasteryLevel: MasteryLevel;
  let newIntervalDays: number;

  if (wasSuccessful) {
    // Move up one level (max 5)
    newMasteryLevel = Math.min(5, currentLevel + 1) as MasteryLevel;
  } else {
    // Move down one level (min 1)
    newMasteryLevel = Math.max(1, currentLevel - 1) as MasteryLevel;
  }

  // Get interval from configuration or use defaults
  const levelConfig = DEFAULT_URGENCY_LEVELS.find((l) => l.level === newMasteryLevel);
  newIntervalDays = levelConfig?.daysInterval ?? SR_INTERVALS[newMasteryLevel];

  // For level 3 (Deadline), use custom deadline if set
  if (newMasteryLevel === 3 && customDeadline) {
    const deadlineDate = new Date(customDeadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    // If deadline is in the future, use it
    if (daysUntilDeadline > 0) {
      newIntervalDays = daysUntilDeadline;
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newIntervalDays);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    nextReviewDate,
    newIntervalDays,
    newMasteryLevel,
  };
}

/**
 * Progressive interval calculation for repeated successful reviews
 * Following the pattern: 1 -> 3 -> 7 -> 14 -> 21 -> 30 -> 45 -> 60 days
 */
export function calculateProgressiveInterval(reviewCount: number): number {
  const intervals = [1, 3, 7, 14, 21, 30, 45, 60];

  if (reviewCount >= intervals.length) {
    // Cap at 60 days, but could increase by 1.5x for each additional review
    const extra = reviewCount - intervals.length + 1;
    return Math.min(180, Math.round(60 * Math.pow(1.5, extra)));
  }

  return intervals[reviewCount];
}

/**
 * Calculate the optimal review time based on forgetting curve
 * Returns a score from 0-100 indicating urgency (100 = most urgent)
 */
export function calculateReviewUrgency(task: Task): number {
  const now = new Date();
  const nextReview = new Date(task.nextReviewDate);
  const daysUntilReview = Math.ceil(
    (nextReview.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );

  // Base urgency on mastery level
  const levelUrgency = {
    1: 100, // Critical - always highest urgency
    2: 80,  // Urgent
    3: 60,  // Deadline
    4: 40,  // Good
    5: 20,  // Mastered
  };

  let urgency = levelUrgency[task.masteryLevel];

  // Adjust based on days until review
  if (daysUntilReview <= 0) {
    // Overdue - increase urgency
    urgency = Math.min(100, urgency + Math.abs(daysUntilReview) * 5);
  } else if (daysUntilReview <= 1) {
    // Due today or tomorrow
    urgency = Math.min(100, urgency + 20);
  } else {
    // Future - decrease urgency slightly
    urgency = Math.max(0, urgency - daysUntilReview * 2);
  }

  // Consider custom deadline
  if (task.customDeadline) {
    const deadline = new Date(task.customDeadline);
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysUntilDeadline <= 0) {
      urgency = 100; // Past deadline
    } else if (daysUntilDeadline <= 3) {
      urgency = Math.max(urgency, 90); // Approaching deadline
    }
  }

  return Math.round(urgency);
}

/**
 * Get tasks sorted by review urgency
 */
export function sortTasksByUrgency(tasks: Task[]): Task[] {
  return tasks.slice().sort((a, b) => {
    const urgencyA = calculateReviewUrgency(a);
    const urgencyB = calculateReviewUrgency(b);
    return urgencyB - urgencyA; // Higher urgency first
  });
}

/**
 * Get tasks due for review today or overdue
 */
export function getTasksDueToday(tasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return tasks.filter((task) => {
    const nextReview = new Date(task.nextReviewDate);
    return nextReview <= today && !task.isArchived;
  });
}

/**
 * Get a recommended study schedule based on workload
 */
export function getRecommendedDailyLoad(
  tasks: Task[],
  availableMinutes: number
): Task[] {
  const dueTasks = sortTasksByUrgency(getTasksDueToday(tasks));
  const schedule: Task[] = [];
  let remainingTime = availableMinutes;

  for (const task of dueTasks) {
    if (task.estimatedDuration <= remainingTime) {
      schedule.push(task);
      remainingTime -= task.estimatedDuration;
    }

    // Also consider partial time for urgent tasks
    if (remainingTime < 15) break; // Minimum useful study time
  }

  return schedule;
}
