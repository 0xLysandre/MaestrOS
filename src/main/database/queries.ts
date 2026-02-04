import { getDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';
import type {
  Task,
  ScheduledTask,
  CalendarEvent,
  UserStats,
  Achievement,
  CreateTaskDTO,
  UpdateTaskDTO,
  MasteryLevel,
} from '../../shared/types';
import { DEFAULT_URGENCY_LEVELS, ACHIEVEMENTS } from '../../shared/constants';

// Helper to parse JSON safely
function parseJson<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Task queries
export const taskQueries = {
  create(dto: CreateTaskDTO): Task {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const intervalDays = DEFAULT_URGENCY_LEVELS.find(
      (l) => l.level === dto.masteryLevel
    )?.daysInterval ?? 1;
    const nextReviewDate = dto.customDeadline ??
      new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO tasks (
        id, title, description, mastery_level, custom_deadline,
        next_review_date, interval_days, created_at, estimated_duration,
        pdf_link, notes, tags, is_archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    ).run(
      id,
      dto.title,
      dto.description ?? null,
      dto.masteryLevel,
      dto.customDeadline ?? null,
      nextReviewDate,
      intervalDays,
      now,
      dto.estimatedDuration,
      dto.pdfLink ?? null,
      dto.notes ?? null,
      dto.tags ? JSON.stringify(dto.tags) : null
    );

    return this.getById(id)!;
  },

  update(dto: UpdateTaskDTO): Task | null {
    const db = getDatabase();
    const existing = this.getById(dto.id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (dto.title !== undefined) {
      updates.push('title = ?');
      values.push(dto.title);
    }
    if (dto.description !== undefined) {
      updates.push('description = ?');
      values.push(dto.description);
    }
    if (dto.masteryLevel !== undefined) {
      updates.push('mastery_level = ?');
      values.push(dto.masteryLevel);

      // Update interval days based on new level
      const intervalDays = DEFAULT_URGENCY_LEVELS.find(
        (l) => l.level === dto.masteryLevel
      )?.daysInterval ?? 1;
      updates.push('interval_days = ?');
      values.push(intervalDays);
    }
    if (dto.customDeadline !== undefined) {
      updates.push('custom_deadline = ?');
      values.push(dto.customDeadline);
    }
    if (dto.estimatedDuration !== undefined) {
      updates.push('estimated_duration = ?');
      values.push(dto.estimatedDuration);
    }
    if (dto.pdfLink !== undefined) {
      updates.push('pdf_link = ?');
      values.push(dto.pdfLink);
    }
    if (dto.notes !== undefined) {
      updates.push('notes = ?');
      values.push(dto.notes);
    }
    if (dto.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(dto.tags));
    }

    if (updates.length === 0) return existing;

    values.push(dto.id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.getById(dto.id);
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  complete(id: string, newMasteryLevel: MasteryLevel): Task | null {
    const db = getDatabase();
    const task = this.getById(id);
    if (!task) return null;

    const now = new Date().toISOString();
    const intervalDays = DEFAULT_URGENCY_LEVELS.find(
      (l) => l.level === newMasteryLevel
    )?.daysInterval ?? 1;
    const nextReviewDate = new Date(
      Date.now() + intervalDays * 24 * 60 * 60 * 1000
    ).toISOString();

    db.prepare(
      `UPDATE tasks SET
        mastery_level = ?,
        last_reviewed_at = ?,
        completed_at = ?,
        next_review_date = ?,
        interval_days = ?
      WHERE id = ?`
    ).run(newMasteryLevel, now, now, nextReviewDate, intervalDays, id);

    return this.getById(id);
  },

  getById(id: string): Task | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToTask(row);
  },

  getAll(includeArchived = false): Task[] {
    const db = getDatabase();
    const query = includeArchived
      ? 'SELECT * FROM tasks ORDER BY mastery_level ASC, next_review_date ASC'
      : 'SELECT * FROM tasks WHERE is_archived = 0 ORDER BY mastery_level ASC, next_review_date ASC';
    const rows = db.prepare(query).all() as Record<string, unknown>[];
    return rows.map((row) => this.mapRowToTask(row));
  },

  getDueToday(): Task[] {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const rows = db
      .prepare(
        `SELECT * FROM tasks
         WHERE is_archived = 0
         AND date(next_review_date) <= date(?)
         ORDER BY mastery_level ASC`
      )
      .all(today) as Record<string, unknown>[];
    return rows.map((row) => this.mapRowToTask(row));
  },

  mapRowToTask(row: Record<string, unknown>): Task {
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | undefined,
      masteryLevel: row.mastery_level as MasteryLevel,
      customDeadline: row.custom_deadline as string | undefined,
      nextReviewDate: row.next_review_date as string,
      intervalDays: row.interval_days as number,
      createdAt: row.created_at as string,
      lastReviewedAt: row.last_reviewed_at as string | undefined,
      completedAt: row.completed_at as string | undefined,
      pdfLink: row.pdf_link as string | undefined,
      notes: row.notes as string | undefined,
      estimatedDuration: row.estimated_duration as number,
      tags: parseJson<string[]>(row.tags as string | null, []),
      isArchived: Boolean(row.is_archived),
    };
  },
};

// Scheduled task queries
export const scheduledTaskQueries = {
  create(taskId: string, start: string, end: string): ScheduledTask {
    const db = getDatabase();
    const id = uuidv4();

    db.prepare(
      `INSERT INTO scheduled_tasks (id, task_id, scheduled_start, scheduled_end, completed)
       VALUES (?, ?, ?, ?, 0)`
    ).run(id, taskId, start, end);

    return this.getById(id)!;
  },

  update(id: string, data: Partial<ScheduledTask>): ScheduledTask | null {
    const db = getDatabase();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.scheduledStart !== undefined) {
      updates.push('scheduled_start = ?');
      values.push(data.scheduledStart);
    }
    if (data.scheduledEnd !== undefined) {
      updates.push('scheduled_end = ?');
      values.push(data.scheduledEnd);
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.completedAt !== undefined) {
      updates.push('completed_at = ?');
      values.push(data.completedAt);
    }

    if (updates.length === 0) return this.getById(id);

    values.push(id);
    db.prepare(`UPDATE scheduled_tasks SET ${updates.join(', ')} WHERE id = ?`).run(
      ...values
    );

    return this.getById(id);
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM scheduled_tasks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  complete(id: string): ScheduledTask | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE scheduled_tasks SET completed = 1, completed_at = ? WHERE id = ?'
    ).run(now, id);
    return this.getById(id);
  },

  getById(id: string): ScheduledTask | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM scheduled_tasks WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToScheduledTask(row);
  },

  getByDateRange(startDate: string, endDate: string): ScheduledTask[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM scheduled_tasks
         WHERE scheduled_start >= ? AND scheduled_start <= ?
         ORDER BY scheduled_start ASC`
      )
      .all(startDate, endDate) as Record<string, unknown>[];
    return rows.map((row) => this.mapRowToScheduledTask(row));
  },

  getByTaskId(taskId: string): ScheduledTask[] {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM scheduled_tasks WHERE task_id = ? ORDER BY scheduled_start ASC')
      .all(taskId) as Record<string, unknown>[];
    return rows.map((row) => this.mapRowToScheduledTask(row));
  },

  mapRowToScheduledTask(row: Record<string, unknown>): ScheduledTask {
    return {
      id: row.id as string,
      taskId: row.task_id as string,
      scheduledStart: row.scheduled_start as string,
      scheduledEnd: row.scheduled_end as string,
      completed: Boolean(row.completed),
      completedAt: row.completed_at as string | undefined,
    };
  },
};

// Calendar event queries
export const calendarEventQueries = {
  upsert(event: Omit<CalendarEvent, 'id'> & { id?: string }): CalendarEvent {
    const db = getDatabase();
    const id = event.id || uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO calendar_events (id, google_event_id, title, start_time, end_time, location, description, last_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(google_event_id) DO UPDATE SET
         title = excluded.title,
         start_time = excluded.start_time,
         end_time = excluded.end_time,
         location = excluded.location,
         description = excluded.description,
         last_synced = excluded.last_synced`
    ).run(
      id,
      event.googleEventId ?? null,
      event.title,
      event.startTime,
      event.endTime,
      event.location ?? null,
      event.description ?? null,
      now
    );

    return this.getById(id) ?? this.getByGoogleId(event.googleEventId!)!;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id);
    return result.changes > 0;
  },

  deleteByGoogleId(googleEventId: string): boolean {
    const db = getDatabase();
    const result = db
      .prepare('DELETE FROM calendar_events WHERE google_event_id = ?')
      .run(googleEventId);
    return result.changes > 0;
  },

  getById(id: string): CalendarEvent | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM calendar_events WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToEvent(row);
  },

  getByGoogleId(googleEventId: string): CalendarEvent | null {
    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM calendar_events WHERE google_event_id = ?')
      .get(googleEventId) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToEvent(row);
  },

  getByDateRange(startDate: string, endDate: string): CalendarEvent[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM calendar_events
         WHERE start_time >= ? AND start_time <= ?
         ORDER BY start_time ASC`
      )
      .all(startDate, endDate) as Record<string, unknown>[];
    return rows.map((row) => this.mapRowToEvent(row));
  },

  clearAll(): void {
    const db = getDatabase();
    db.prepare('DELETE FROM calendar_events').run();
  },

  mapRowToEvent(row: Record<string, unknown>): CalendarEvent {
    return {
      id: row.id as string,
      googleEventId: row.google_event_id as string | undefined,
      title: row.title as string,
      startTime: row.start_time as string,
      endTime: row.end_time as string,
      location: row.location as string | undefined,
      description: row.description as string | undefined,
      lastSynced: row.last_synced as string,
      isGoogleEvent: Boolean(row.google_event_id),
    };
  },
};

// User stats queries
export const statsQueries = {
  get(): UserStats {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM user_stats WHERE id = 1').get() as Record<
      string,
      unknown
    >;
    return {
      currentStreak: (row.current_streak as number) ?? 0,
      longestStreak: (row.longest_streak as number) ?? 0,
      lastActivityDate: row.last_activity_date as string | undefined,
      totalTasksCompleted: (row.total_tasks_completed as number) ?? 0,
    };
  },

  update(stats: Partial<UserStats>): UserStats {
    const db = getDatabase();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (stats.currentStreak !== undefined) {
      updates.push('current_streak = ?');
      values.push(stats.currentStreak);
    }
    if (stats.longestStreak !== undefined) {
      updates.push('longest_streak = ?');
      values.push(stats.longestStreak);
    }
    if (stats.lastActivityDate !== undefined) {
      updates.push('last_activity_date = ?');
      values.push(stats.lastActivityDate);
    }
    if (stats.totalTasksCompleted !== undefined) {
      updates.push('total_tasks_completed = ?');
      values.push(stats.totalTasksCompleted);
    }

    if (updates.length > 0) {
      db.prepare(`UPDATE user_stats SET ${updates.join(', ')} WHERE id = 1`).run(
        ...values
      );
    }

    return this.get();
  },

  incrementTasksCompleted(): UserStats {
    const db = getDatabase();
    const current = this.get();
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = current.lastActivityDate?.split('T')[0];

    let newStreak = current.currentStreak;

    if (!lastActivity) {
      // First activity
      newStreak = 1;
    } else if (lastActivity === today) {
      // Same day, keep streak
    } else {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      if (lastActivity === yesterday) {
        // Consecutive day
        newStreak = current.currentStreak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(current.longestStreak, newStreak);

    return this.update({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: new Date().toISOString(),
      totalTasksCompleted: current.totalTasksCompleted + 1,
    });
  },
};

// Achievement queries
export const achievementQueries = {
  initialize(): void {
    const db = getDatabase();
    for (const achievement of ACHIEVEMENTS) {
      db.prepare(
        `INSERT OR IGNORE INTO achievements (id, title, description, requirement_type, requirement_value, icon)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        achievement.id,
        achievement.title,
        achievement.description,
        achievement.requirementType,
        achievement.requirementValue,
        achievement.icon
      );
    }
  },

  getAll(): Achievement[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM achievements').all() as Record<
      string,
      unknown
    >[];
    return rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      unlockedAt: row.unlocked_at as string | undefined,
      requirementType: row.requirement_type as Achievement['requirementType'],
      requirementValue: row.requirement_value as number,
      icon: row.icon as string,
    }));
  },

  unlock(id: string): Achievement | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare('UPDATE achievements SET unlocked_at = ? WHERE id = ? AND unlocked_at IS NULL').run(
      now,
      id
    );
    const row = db.prepare('SELECT * FROM achievements WHERE id = ?').get(id) as Record<
      string,
      unknown
    > | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      unlockedAt: row.unlocked_at as string | undefined,
      requirementType: row.requirement_type as Achievement['requirementType'],
      requirementValue: row.requirement_value as number,
      icon: row.icon as string,
    };
  },

  checkAndUnlock(stats: UserStats): Achievement[] {
    const achievements = this.getAll();
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.unlockedAt) continue;

      let shouldUnlock = false;

      switch (achievement.requirementType) {
        case 'tasks_completed':
          shouldUnlock = stats.totalTasksCompleted >= achievement.requirementValue;
          break;
        case 'streak':
          shouldUnlock = stats.currentStreak >= achievement.requirementValue;
          break;
      }

      if (shouldUnlock) {
        const unlocked = this.unlock(achievement.id);
        if (unlocked) {
          newlyUnlocked.push(unlocked);
        }
      }
    }

    return newlyUnlocked;
  },
};

// Settings queries
export const settingsQueries = {
  get<T>(key: string, defaultValue: T): T {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    if (!row) return defaultValue;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    const db = getDatabase();
    db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run(key, JSON.stringify(value));
  },

  getAll(): Record<string, unknown> {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM settings').all() as {
      key: string;
      value: string;
    }[];
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    return settings;
  },
};
