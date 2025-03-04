const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const path = require('node:path');

// Import custom modules
const { initDatabase, getRecentItems, closeDatabase, syncDatabase, setupDatabaseMaintenance } = require('./database');
const ClipboardManager = require('./clipboardManager');
const KeyboardManager = require('./keyboardManager');
const { initI18n, t, getAppName, getCurrentLocale } = require('./i18n');

// Global references
let mainWindow = null;
let historyWindow = null;
let statusWindow = null;
let tray = null;
let db = null;
let clipboardManager = null;
let keyboardManager = null;
let dbMaintenanceCleanup = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize the app
const initialize = async () => {
  try {
    console.log('Initializing application...');
    
    // Initialize database
    db = await initDatabase();
    console.log(t('databaseInitialized'));
    
    // 验证数据库连接
    if (!db) {
      throw new Error('Database initialization failed, connection is null');
    }
    
    // 执行一次数据库同步，确保之前的数据已正确写入
    try {
      await syncDatabase(db);
      console.log('Initial database sync completed');
    } catch (syncError) {
      console.error('Initial database sync failed:', syncError);
      // 继续执行，不要因为同步失败就中断
    }
    
    // 设置数据库定期维护
    dbMaintenanceCleanup = setupDatabaseMaintenance(db);
    
    // Initialize clipboard manager
    clipboardManager = new ClipboardManager(db);
    
    // 确保剪贴板管理器有效
    if (!clipboardManager) {
      throw new Error('Clipboard manager initialization failed');
    }
    
    // 启动剪贴板监控
    clipboardManager.startMonitoring();
    
    // Initialize keyboard manager
    keyboardManager = new KeyboardManager();
    keyboardManager.registerShortcut('CommandOrControl+Shift+V');
    
    // Create history window
    createHistoryWindow();
    
    // Set the history window reference in keyboard manager
    keyboardManager.setHistoryWindow(historyWindow);
    
    console.log(t('appInitialized'));
  } catch (error) {
    console.error('Failed to initialize app:', error);
    
    // 尝试重新初始化数据库
    if (!db) {
      console.log('Attempting to reinitialize database...');
      try {
        db = await initDatabase();
        console.log('Database reinitialized successfully');
      } catch (dbError) {
        console.error('Database reinitialization failed:', dbError);
      }
    }
  }
};

// Create the main window
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: getAppName(),
    // 在macOS上，将窗口设置为不显示在Dock中
    skipTaskbar: true
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('close', (event) => {
    // 如果应用正在退出，则允许窗口关闭
    if (app.isQuitting) return;
    
    // 否则，阻止窗口关闭，只是隐藏它
    event.preventDefault();
    mainWindow.hide();
  });

  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
  
  // Create tray icon
  createTray();
};

// Create the history window (hidden by default)
const createHistoryWindow = () => {
  historyWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-history.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    transparent: false,
    resizable: true,
    title: t('clipboardHistory'),
    // 在macOS上，将窗口设置为不显示在Dock中
    skipTaskbar: true
  });

  historyWindow.loadFile(path.join(__dirname, 'history.html'));

  historyWindow.on('close', (event) => {
    // 如果应用正在退出，则允许窗口关闭
    if (app.isQuitting) return;
    
    // 否则，阻止窗口关闭，只是隐藏它
    event.preventDefault();
    historyWindow.hide();
  });
  
  // Hide window when it loses focus
  historyWindow.on('blur', () => {
    historyWindow.hide();
  });
  
  // Prevent window from being closed
  historyWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      historyWindow.hide();
    }
    return false;
  });
};

// Create status window
const createStatusWindow = () => {
  statusWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-status.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: t('statusWindowTitle'),
    // 在macOS上，将窗口设置为不显示在Dock中
    skipTaskbar: true
  });

  statusWindow.loadFile(path.join(__dirname, 'status.html'));

  statusWindow.on('close', (event) => {
    // 如果应用正在退出，则允许窗口关闭
    if (app.isQuitting) return;
    
    // 否则，阻止窗口关闭，只是隐藏它
    event.preventDefault();
    statusWindow.hide();
  });

  statusWindow.on('ready-to-show', () => {
    console.log(t('statusWindowReady'));
  });
};

// Show status window
const showStatusWindow = () => {
  if (!statusWindow) {
    createStatusWindow();
  }
  
  statusWindow.show();
  statusWindow.focus();
};

// Create tray icon
const createTray = () => {
  // 如果托盘图标已经存在，则不再创建
  if (tray) {
    console.log('Tray icon already exists, skipping creation');
    return;
  }
  
  try {
    // 使用我们创建的菜单栏图标
    let iconPath;
    
    if (process.platform === 'darwin') {
      // 在macOS上，使用模板图标（黑白图标，会根据系统主题自动调整）
      iconPath = path.join(__dirname, 'assets', 'tray-icon-template.png');
      const icon = nativeImage.createFromPath(iconPath);
      // 设置为模板图标
      icon.setTemplateImage(true);
      tray = new Tray(icon);
    } else {
      // 在其他平台上，使用普通图标
      iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
      const icon = nativeImage.createFromPath(iconPath);
      tray = new Tray(icon);
    }
    
    console.log(`${t('trayIconCreated')} ${iconPath}`);
  } catch (error) {
    console.error(`${t('creatingTrayIconFailed')} ${error}`);
    
    // 如果创建托盘图标失败，尝试使用简单的空图标
    try {
      tray = new Tray(nativeImage.createEmpty());
      console.log(t('usingFallbackIcon'));
    } catch (fallbackError) {
      console.error(`${t('creatingFallbackIconFailed')} ${fallbackError}`);
      // 如果连备用图标也创建失败，则不创建托盘图标
      return;
    }
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('showClipboardHistory'),
      click: () => keyboardManager.showHistoryWindow()
    },
    {
      label: t('statusMonitor'),
      click: () => showStatusWindow()
    },
    { type: 'separator' },
    {
      label: t('quit'),
      click: () => safeQuit()
    }
  ]);
  
  tray.setToolTip(getAppName());
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标时显示历史窗口
  tray.on('click', () => {
    keyboardManager.showHistoryWindow();
  });
};

// IPC handlers
const setupIpcHandlers = () => {
  // Get clipboard items
  ipcMain.on('get-clipboard-items', async (event) => {
    try {
      const items = await getRecentItems(db, 50);
      event.sender.send('clipboard-items', items);
    } catch (error) {
      console.error('Error getting clipboard items:', error);
      event.sender.send('clipboard-items', []);
    }
  });
  
  // Get clipboard monitoring status
  ipcMain.on('get-monitoring-status', (event) => {
    try {
      const status = clipboardManager.getMonitoringStatus();
      event.sender.send('monitoring-status', status);
      console.log('Monitoring status sent:', status);
    } catch (error) {
      console.error('Error getting monitoring status:', error);
      event.sender.send('monitoring-status', { error: error.message });
    }
  });
  
  // Restart clipboard monitoring
  ipcMain.on('restart-monitoring', (event) => {
    try {
      clipboardManager.stopMonitoring();
      setTimeout(() => {
        clipboardManager.startMonitoring();
        const status = clipboardManager.getMonitoringStatus();
        event.sender.send('monitoring-status', status);
        console.log('Monitoring restarted, status:', status);
      }, 500);
    } catch (error) {
      console.error('Error restarting monitoring:', error);
      event.sender.send('monitoring-status', { error: error.message });
    }
  });
  
  // 手动同步数据库
  ipcMain.on('sync-database', async (event) => {
    try {
      console.log('Manual database sync requested');
      await syncDatabase(db);
      event.sender.send('database-sync-result', { success: true });
      console.log('Manual database sync completed successfully');
    } catch (error) {
      console.error('Error during manual database sync:', error);
      event.sender.send('database-sync-result', { 
        success: false, 
        error: error.message 
      });
    }
  });
  
  // Use clipboard item
  ipcMain.on('use-clipboard-item', (event, content) => {
    console.log(`${t('usingClipboardItem')}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`);
    
    // Copy the content to clipboard
    clipboardManager.writeToClipboard(content);
    console.log(t('contentCopiedToClipboard'));
    
    // Hide the history window
    keyboardManager.hideHistoryWindow();
    console.log(t('historyWindowHidden'));
    
    // Check if we have accessibility permissions on macOS
    if (process.platform === 'darwin') {
      const { systemPreferences } = require('electron');
      const hasPermission = systemPreferences.isTrustedAccessibilityClient(false);
      console.log(`${t('accessibilityPermissionStatus')}: ${hasPermission ? t('authorized') : t('unauthorized')}`);
      
      if (!hasPermission) {
        // If we don't have permissions, show a notification with instructions
        const { Notification } = require('electron');
        new Notification({
          title: t('accessibilityPermissionNeeded'),
          body: t('accessibilityPermissionMessage')
        }).show();
        console.log(t('permissionNotificationShown'));
        
        return;
      }
    }
    
    // Try to automatically paste the content
    setTimeout(() => {
      try {
        if (process.platform === 'darwin') {
          console.log(t('tryingToAutoPaste'));
          
          // 使用一个更直接的方法：先激活前台应用，然后粘贴
          const { execSync } = require('child_process');
          
          try {
            console.log(t('tryingToGetFrontApp'));
            
            // 获取当前前台应用
            const getFrontAppScript = `
              tell application "System Events"
                set frontApp to name of first application process whose frontmost is true
                return frontApp
              end tell
            `;
            
            const frontApp = execSync(`osascript -e '${getFrontAppScript}'`).toString().trim();
            console.log(`${t('currentForegroundApp')}: ${frontApp}`);
            
            // 执行粘贴命令
            const pasteScript = `
              tell application "System Events"
                tell process "${frontApp}"
                  keystroke "v" using {command down}
                end tell
              end tell
            `;
            
            execSync(`osascript -e '${pasteScript}'`);
            console.log(t('pasteCommandExecuted'));
          } catch (error) {
            console.error(`${t('pasteCommandFailed')}: ${error}`);
          }
        }
      } catch (error) {
        console.error(`${t('pasteCommandFailed')}: ${error}`);
      }
    }, 100);
  });
  
  // Hide history window
  ipcMain.on('hide-history-window', () => {
    keyboardManager.hideHistoryWindow();
  });
  
  // 国际化相关的IPC处理程序
  ipcMain.on('get-translation', (event, key) => {
    event.returnValue = t(key);
  });
  
  ipcMain.on('get-current-locale', (event) => {
    event.returnValue = getCurrentLocale();
  });
  
  // 获取剪贴板历史
  ipcMain.handle('get-clipboard-history', async () => {
    try {
      return await getRecentItems(db);
    } catch (error) {
      console.error('Failed to get clipboard history:', error);
      return [];
    }
  });
  
  // 搜索剪贴板历史
  ipcMain.handle('search-clipboard-history', async (event, query) => {
    try {
      const items = await getRecentItems(db);
      if (!query) {
        return items;
      }
      return items.filter(item => 
        item.content.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search clipboard history:', error);
      return [];
    }
  });
};

// App events
app.whenReady().then(async () => {
  // 在macOS上，我们只保留托盘图标，隐藏dock图标
  // 这必须在任何窗口创建之前调用
  if (process.platform === 'darwin') {
    console.log('Hiding dock icon on macOS...');
    try {
      app.dock.hide();
      console.log('Dock icon hidden successfully');
    } catch (error) {
      console.error('Failed to hide dock icon:', error);
    }
  }
  
  // Initialize i18n
  initI18n();
  
  // Initialize app
  await initialize();
  
  // Create main window
  createMainWindow();
  
  // Create tray
  createTray();
  
  // Create status window (but don't show it)
  createStatusWindow();
  
  // Setup IPC handlers
  setupIpcHandlers();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 添加一个函数来安全地关闭应用
const safeQuit = async () => {
  // 设置退出标志
  app.isQuitting = true;
  
  console.log('Preparing to quit application...');
  
  // 停止剪贴板监控
  if (clipboardManager) {
    console.log('Stopping clipboard monitoring...');
    clipboardManager.stopMonitoring();
  }
  
  // 注销全局快捷键
  if (keyboardManager) {
    console.log('Unregistering global shortcuts...');
    keyboardManager.unregisterShortcut();
  }
  
  // 确保数据库同步并关闭
  if (db) {
    try {
      console.log('Final database sync before closing...');
      await syncDatabase(db);
      console.log('Final database sync completed');
    } catch (syncError) {
      console.error('Final database sync failed:', syncError);
    }
    
    try {
      console.log('Closing database connection...');
      await closeDatabase(db);
      console.log('Database connection closed');
    } catch (closeError) {
      console.error('Error closing database:', closeError);
    }
  }
  
  // 清理数据库维护定时器
  if (dbMaintenanceCleanup) {
    console.log('Cleaning up database maintenance timers...');
    dbMaintenanceCleanup();
  }
  
  console.log('Application quit preparation completed');
};

// Clean up before quitting
app.on('before-quit', () => {
  // 防止多次调用退出逻辑
  if (app.isQuitting) return;
  
  // 调用安全退出函数
  safeQuit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


