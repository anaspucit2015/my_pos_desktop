import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { getDb, bootstrapDatabase } from '@my-pos/database';
import { registerHandlers } from '@my-pos/ipc';

/** Creates the main application window with security best practices. */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in the system browser, never inside Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    // Dev: electron-vite starts a Vite dev server for the renderer
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  // On first launch: create tables and insert seed data.
  // Safe to call every time — migrations are idempotent and seed is skipped
  // when users already exist.
  const dbPath = process.env['DATABASE_PATH'] ?? join(app.getPath('userData'), 'pos.db');
  bootstrapDatabase(dbPath);

  const db = getDb(dbPath);
  registerHandlers(db);

  createWindow();

  app.on('activate', () => {
    // macOS: re-create the window when the dock icon is clicked with no open windows
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
