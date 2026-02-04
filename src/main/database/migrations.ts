import type Database from 'better-sqlite3';

interface Migration {
  version: number;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      // Tasks table
      db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          mastery_level INTEGER NOT NULL CHECK(mastery_level BETWEEN 1 AND 5),
          custom_deadline TEXT,
          next_review_date TEXT NOT NULL,
          interval_days INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          last_reviewed_at TEXT,
          completed_at TEXT,
          pdf_link TEXT,
          notes TEXT,
          estimated_duration INTEGER NOT NULL,
          tags TEXT,
          is_archived INTEGER DEFAULT 0
        );
      `);

      // Scheduled tasks table
      db.exec(`
        CREATE TABLE IF NOT EXISTS scheduled_tasks (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          scheduled_start TEXT NOT NULL,
          scheduled_end TEXT NOT NULL,
          completed INTEGER DEFAULT 0,
          completed_at TEXT,
          FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
      `);

      // Calendar events table (cached from Google)
      db.exec(`
        CREATE TABLE IF NOT EXISTS calendar_events (
          id TEXT PRIMARY KEY,
          google_event_id TEXT UNIQUE,
          title TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          location TEXT,
          description TEXT,
          last_synced TEXT NOT NULL
        );
      `);

      // User statistics table
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_stats (
          id INTEGER PRIMARY KEY CHECK(id = 1),
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_activity_date TEXT,
          total_tasks_completed INTEGER DEFAULT 0
        );
      `);

      // Insert default stats row
      db.exec(`
        INSERT OR IGNORE INTO user_stats (id, current_streak, longest_streak, total_tasks_completed)
        VALUES (1, 0, 0, 0);
      `);

      // Achievements table
      db.exec(`
        CREATE TABLE IF NOT EXISTS achievements (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          unlocked_at TEXT,
          requirement_type TEXT,
          requirement_value INTEGER,
          icon TEXT
        );
      `);

      // Settings table
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // Create indexes for better query performance
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tasks_next_review ON tasks(next_review_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_mastery_level ON tasks(mastery_level);
        CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_date ON scheduled_tasks(scheduled_start);
        CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);
      `);
    },
  },
];

export function runMigrations(db: Database.Database): void {
  // Create migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Get current version
  const currentVersionRow = db
    .prepare('SELECT MAX(version) as version FROM migrations')
    .get() as { version: number | null };
  const currentVersion = currentVersionRow?.version ?? 0;

  console.log('Current database version:', currentVersion);

  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Running migration version ${migration.version}...`);

      db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO migrations (version, applied_at) VALUES (?, ?)').run(
          migration.version,
          new Date().toISOString()
        );
      })();

      console.log(`Migration version ${migration.version} completed`);
    }
  }
}
