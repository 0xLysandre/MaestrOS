import { app, BrowserWindow, ipcMain, nativeTheme, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './database/db';
import { setupIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;

// Use app.isPackaged as the primary check - it's the most reliable
const isDev = !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a2e' : '#ffffff',
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, use __dirname which works correctly in asar
    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');

    // Check if file exists and show error if not
    if (!fs.existsSync(indexPath)) {
      dialog.showErrorBox('Error', `Cannot find: ${indexPath}\n\n__dirname: ${__dirname}\nappPath: ${app.getAppPath()}`);
    }

    mainWindow.loadFile(indexPath).catch((err) => {
      dialog.showErrorBox('Load Error', `Failed to load app: ${err.message}`);
    });
  }

  // Debug: Log any load errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    dialog.showErrorBox('Load Failed', `Error ${errorCode}: ${errorDescription}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app
app.whenReady().then(async () => {
  // Initialize database
  await initializeDatabase();

  // Setup IPC handlers
  setupIpcHandlers();

  // Create main window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle theme changes
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme:changed', nativeTheme.shouldUseDarkColors);
});

// Export for IPC handlers
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
