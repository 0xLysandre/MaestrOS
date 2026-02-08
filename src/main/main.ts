import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import path from 'path';
import { initializeDatabase } from './database/db';
import { setupIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

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
    // In production, load from the correct path
    const indexPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // Debug: Log any load errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
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
