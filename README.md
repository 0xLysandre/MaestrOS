# MedPlanOS

A smart task scheduler for medical students featuring spaced repetition learning, Google Calendar integration, and gamification.

## Download & Install

### Windows
1. Download `Medical.Scheduler.Setup.exe` from the [latest release](../../releases/latest)
2. Run the installer
3. Launch "Medical Scheduler" from your Start Menu

### macOS
1. Download `Medical.Scheduler.dmg` from the [latest release](../../releases/latest)
2. Open the DMG and drag the app to Applications
3. Launch from Applications (right-click > Open on first launch)

### Linux
1. Download `Medical.Scheduler.AppImage` from the [latest release](../../releases/latest)
2. Make it executable: `chmod +x Medical.Scheduler.AppImage`
3. Run it: `./Medical.Scheduler.AppImage`

**That's it!** The app works fully offline. Google Calendar sync is optional.

---

## Features

### Smart Task Management
- **5-Level Mastery System**: Track learning progress from Critical (1) to Mastered (5)
- **Spaced Repetition**: Tasks auto-reschedule based on SM-2 algorithm principles
- **One-Click Scheduling**: "Create & Schedule" button finds the best time slot automatically

### Calendar Integration
- **Google Calendar Sync**: See all your events in one place (optional)
- **Weekly View**: Interactive calendar with drag-and-drop
- **Conflict Detection**: Smart scheduling avoids double-booking

### Gamification
- **Daily Streaks**: Build consistency with streak tracking
- **Achievements**: Unlock badges for reaching milestones
- **Progress Stats**: Track completed tasks and mastery progress

### Additional Features
- **Dark/Light Mode**: Choose your preferred theme
- **Export/Import**: Backup your data as JSON
- **PDF Links**: Attach learning resources to tasks
- **Tags & Notes**: Organize tasks with custom metadata
- **Offline Support**: Works without internet

---

## Quick Start Guide

### Creating Tasks
1. Click **"New Task"** in the sidebar
2. Fill in title, description, and mastery level
3. Click **"Create & Schedule"** to auto-schedule, or just **"Create"**

### Mastery Levels

| Level | Name | Review Interval |
|-------|------|-----------------|
| 1 | Critical | 1 day |
| 2 | Urgent | 3 days |
| 3 | Deadline | 7 days |
| 4 | Good | 7 days |
| 5 | Mastered | 21 days |

### Completing Tasks
- Click a task to mark complete
- Select your new mastery level (higher = understood well, lower = need more review)
- Next review date calculates automatically

---

## Optional: Google Calendar Setup

To sync with Google Calendar:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google Calendar API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Select **Desktop app** as application type
6. Copy the Client ID and Client Secret
7. Create a `.env` file in the app's data folder with:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```
8. Add your email as a **Test User** in OAuth consent screen
9. Restart the app and click "Connect Calendar"

---

## For Developers

### Prerequisites
- Node.js 18+
- npm

### Development Setup

```bash
# Clone the repository
git clone https://github.com/0xLysandre/MedPlanOS.git
cd MedPlanOS

# Install dependencies
npm install

# Start development server
npm run dev
```

#### NixOS Users
```bash
./dev.sh
```

### Building

```bash
# Build for current platform
npm run package

# Build for specific platform
npm run package:win
npm run package:mac
npm run package:linux
```

### Project Structure

```
MedPlanOS/
├── src/
│   ├── main/           # Electron main process
│   │   ├── database/   # SQLite database
│   │   └── services/   # Business logic
│   └── renderer/       # React frontend
│       ├── components/ # UI components
│       └── store/      # Zustand state
├── .github/
│   └── workflows/      # CI/CD automation
└── package.json
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 38 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Database | SQLite (better-sqlite3) |
| Calendar | FullCalendar |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with Electron, React, and Tailwind CSS**
