# Changelog

All notable changes to MaestrOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Update section in Settings panel with check/download/install buttons
- macOS traffic light buttons support and window dragging
- Audio notifications for deadline reminders
- Auto-update system using electron-updater
- Proper spaced repetition algorithm with progressive intervals
- Internationalization support (French and English)
- Google API credentials configuration in Settings
- Bilingual UI (French as default, English available)

### Changed
- Renamed app from MedPlanOS to MaestrOS
- Removed medical-specific branding (stethoscope icon)
- Improved task completion UI with "Got it!", "Needs work", "Keep level" options
- Calendar drag-to-create now preserves selected time duration

### Fixed
- macOS DMG now works correctly (instructions for xattr added)
- Electron-builder publish configuration
- Path resolution on Windows
- FullCalendar navigation button text

## [1.0.0] - 2026-02-11

### Added
- Initial release as MaestrOS
- 5-level mastery system for task management
- Weekly calendar view with drag-and-drop scheduling
- Google Calendar integration (optional)
- Daily streak tracking and gamification
- Achievement system with unlockable badges
- Dark/Light/System theme support
- Data export/import functionality
- PDF link attachments for tasks
- Tags and notes for task organization
- Offline-first architecture with SQLite database
- Cross-platform support (Windows, macOS, Linux)

---

## Pre-release History (as MedPlanOS)

### [0.9.0] - 2026-02-10
- Added automated CI/CD builds for all platforms
- Fixed various UI issues with calendar and theme toggle

### [0.8.0] - 2026-02-09
- Initial Google Calendar sync implementation
- OAuth 2.0 authentication flow

### [0.7.0] - 2026-02-08
- Gamification features (streaks, achievements)
- Profile page with statistics

### [0.6.0] - 2026-02-07
- Task scheduling with conflict detection
- Working hours configuration

### [0.5.0] - 2026-02-06
- FullCalendar integration
- Weekly view implementation

### [0.4.0] - 2026-02-05
- SQLite database with better-sqlite3
- Task CRUD operations

### [0.3.0] - 2026-02-04
- React + TypeScript frontend
- Tailwind CSS styling
- Zustand state management

### [0.2.0] - 2026-02-03
- Electron app shell
- IPC communication setup

### [0.1.0] - 2026-02-02
- Project initialization
