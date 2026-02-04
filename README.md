# Medical Scheduler

A smart task scheduler for medical students featuring Google Calendar integration, spaced repetition learning, and gamification.

## Features

### Calendar Integration
- **Google Calendar Sync**: Connect your Google Calendar to see all your events in one place
- **Weekly View**: Interactive calendar with drag-and-drop task scheduling
- **Automatic Sync**: Events sync periodically in the background

### Smart Task Management
- **5-Level Mastery System**: Track your learning progress from Critical (1) to Mastered (5)
- **Spaced Repetition**: Tasks automatically reschedule based on SM-2 algorithm principles
- **Intelligent Scheduling**: AI-powered time slot suggestions that avoid conflicts
- **Customizable Urgency Levels**: Configure review intervals for each mastery level

### Gamification
- **Daily Streaks**: Build consistency with streak tracking
- **Achievements**: Unlock badges for reaching milestones
- **Progress Stats**: Track your completed tasks and mastery progress

### Additional Features
- **Dark/Light Mode**: Choose your preferred theme
- **PDF Links**: Attach learning resources to tasks
- **Tags**: Organize tasks with custom tags
- **Notes**: Add detailed notes to each task
- **Offline Support**: Works without internet (except calendar sync)

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medical-scheduler.git
cd medical-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Calendar API (optional):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable the Google Calendar API
   - Create OAuth 2.0 credentials (Desktop app)
   - Copy your Client ID and Client Secret
   - Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   - Add your credentials to the `.env` file

4. Start the development server:
```bash
# Terminal 1: Start the renderer (React app)
npm run dev:renderer

# Terminal 2: Build main process and start Electron
npm run build:main && npm run electron:dev
```

Or use the combined command:
```bash
npm run dev
```

## Building for Production

Build the application for distribution:

```bash
# Build for current platform
npm run package

# Build for specific platforms
npm run package:mac
npm run package:win
npm run package:linux
```

Built applications will be in the `release/` directory.

## Project Structure

```
medical-scheduler/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts              # Entry point
│   │   ├── preload.ts           # Preload script for IPC
│   │   ├── ipc-handlers.ts      # IPC communication handlers
│   │   ├── database/            # SQLite database
│   │   │   ├── db.ts            # Database initialization
│   │   │   ├── migrations.ts    # Schema migrations
│   │   │   └── queries.ts       # Database queries
│   │   └── services/            # Business logic
│   │       ├── google-calendar.ts
│   │       ├── spaced-repetition.ts
│   │       └── task-scheduler.ts
│   ├── renderer/                # React frontend
│   │   ├── App.tsx              # Main app component
│   │   ├── store/               # Zustand state management
│   │   ├── components/          # UI components
│   │   │   ├── Calendar/
│   │   │   ├── TodoList/
│   │   │   ├── Profile/
│   │   │   ├── Settings/
│   │   │   └── Layout/
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Utility functions
│   └── shared/                  # Shared types and constants
│       ├── types.ts
│       └── constants.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Tech Stack

- **Framework**: Electron
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: SQLite (better-sqlite3)
- **Calendar**: FullCalendar
- **Date Handling**: date-fns
- **API**: Google Calendar API (googleapis)

## Usage Guide

### Creating Tasks

1. Click the "New Task" button in the sidebar
2. Fill in the task details:
   - **Title**: Name of the task/topic
   - **Description**: Additional details
   - **Mastery Level**: Your current understanding (1-5)
   - **Duration**: Estimated study time
   - **Deadline**: Optional custom deadline
   - **PDF Link**: Optional resource link
   - **Tags**: Categorize with tags

### Mastery Levels

| Level | Name | Review Interval |
|-------|------|-----------------|
| 1 | Critical | 1 day |
| 2 | Urgent | 3 days |
| 3 | Deadline | Custom/7 days |
| 4 | Good | 7 days |
| 5 | Mastered | 21 days |

### Completing Tasks

When you complete a task, select your new mastery level:
- Choose a **higher level** if you understood the material well
- Choose a **lower level** if you need more review
- The next review date will be calculated automatically

### Scheduling

- **Auto-schedule**: The app suggests optimal time slots based on your calendar
- **Manual scheduling**: Drag tasks onto the calendar
- **Rescheduling**: Drag existing scheduled tasks to new times

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Create new task |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + R` | Sync calendar |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Spaced repetition algorithm based on [SM-2](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- Built with [Electron](https://www.electronjs.org/), [React](https://reactjs.org/), and [Tailwind CSS](https://tailwindcss.com/)
