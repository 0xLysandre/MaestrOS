import { autoUpdater } from 'electron-updater';
import { app, dialog } from 'electron';
import { getMainWindow } from '../main';
import { IPC_CHANNELS } from '../../shared/constants';

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Track update state
let updateAvailable = false;
let updateDownloaded = false;
let updateInfo: { version: string; releaseNotes?: string } | null = null;

/**
 * Send update status to renderer
 */
function sendUpdateStatus(status: string, info?: unknown): void {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send(IPC_CHANNELS.UPDATE_STATUS, { status, info });
  }
}

/**
 * Initialize the auto-updater
 */
export function initAutoUpdater(): void {
  // Only run in packaged app
  if (!app.isPackaged) {
    console.log('Auto-updater disabled in development mode');
    return;
  }

  // Set up event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    sendUpdateStatus('checking');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    updateAvailable = true;
    updateInfo = {
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
    };
    sendUpdateStatus('available', updateInfo);

    // Show dialog asking user if they want to download
    const mainWindow = getMainWindow();
    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Available',
          message: `A new version (${info.version}) is available!`,
          detail: 'Would you like to download it now?',
          buttons: ['Download', 'Later'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            downloadUpdate();
          }
        });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
    sendUpdateStatus('not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`Download progress: ${Math.round(progress.percent)}%`);
    sendUpdateStatus('downloading', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    updateDownloaded = true;
    sendUpdateStatus('downloaded', { version: info.version });

    // Show dialog asking user if they want to install now
    const mainWindow = getMainWindow();
    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message: `Version ${info.version} has been downloaded.`,
          detail: 'The update will be installed when you quit the app. Would you like to restart now?',
          buttons: ['Restart Now', 'Later'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            quitAndInstall();
          }
        });
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    sendUpdateStatus('error', { message: error.message });
  });

  // Check for updates on startup (after a delay)
  setTimeout(() => {
    checkForUpdates();
  }, 30000); // Wait 30 seconds after app start
}

/**
 * Check for updates
 */
export async function checkForUpdates(): Promise<void> {
  if (!app.isPackaged) {
    console.log('Update check skipped in development');
    return;
  }

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

/**
 * Download the available update
 */
export async function downloadUpdate(): Promise<void> {
  if (!updateAvailable) {
    console.log('No update available to download');
    return;
  }

  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error('Failed to download update:', error);
  }
}

/**
 * Quit and install the downloaded update
 */
export function quitAndInstall(): void {
  if (!updateDownloaded) {
    console.log('No update downloaded to install');
    return;
  }

  autoUpdater.quitAndInstall(false, true);
}

/**
 * Get current update state
 */
export function getUpdateState(): {
  available: boolean;
  downloaded: boolean;
  info: { version: string; releaseNotes?: string } | null;
} {
  return {
    available: updateAvailable,
    downloaded: updateDownloaded,
    info: updateInfo,
  };
}
