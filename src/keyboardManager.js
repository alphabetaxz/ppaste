const { globalShortcut, BrowserWindow, app, clipboard } = require('electron');
const { GlobalKeyboardListener } = require('node-global-key-listener');

class KeyboardManager {
  constructor() {
    this.historyWindow = null;
    this.globalKeyboardListener = null;
    this.isListening = false;
    this.shortcutRegistered = false;
    this.previouslyFocusedApp = null;
  }

  // Register global shortcut to show clipboard history
  registerShortcut(shortcut = 'CommandOrControl+Shift+V') {
    if (this.shortcutRegistered) {
      this.unregisterShortcut();
    }

    try {
      globalShortcut.register(shortcut, () => {
        this.toggleHistoryWindow();
      });
      
      this.shortcutRegistered = true;
      console.log(`Global shortcut ${shortcut} registered`);
    } catch (error) {
      console.error('Failed to register global shortcut:', error);
    }
  }

  // Unregister global shortcut
  unregisterShortcut() {
    globalShortcut.unregisterAll();
    this.shortcutRegistered = false;
    console.log('Global shortcuts unregistered');
  }

  // Set the history window reference
  setHistoryWindow(window) {
    this.historyWindow = window;
  }

  // Toggle the history window visibility
  toggleHistoryWindow() {
    if (!this.historyWindow) return;

    if (this.historyWindow.isVisible()) {
      this.hideHistoryWindow();
    } else {
      this.showHistoryWindow();
    }
  }

  // Show the history window
  showHistoryWindow() {
    if (!this.historyWindow) return;

    // Try to get the currently focused app on macOS
    if (process.platform === 'darwin') {
      try {
        // We'll use this to return focus later
        this.previouslyFocusedApp = BrowserWindow.getFocusedWindow();
      } catch (error) {
        console.error('Error getting focused app:', error);
      }
    }

    // Position window near the cursor
    const { screen } = require('electron');
    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    
    // Center the window on the current display
    const windowBounds = this.historyWindow.getBounds();
    const x = Math.floor(cursor.x - (windowBounds.width / 2));
    const y = Math.floor(cursor.y - (windowBounds.height / 2));
    
    // Ensure window is fully visible on screen
    const adjustedX = Math.max(
      display.bounds.x,
      Math.min(x, display.bounds.x + display.bounds.width - windowBounds.width)
    );
    const adjustedY = Math.max(
      display.bounds.y,
      Math.min(y, display.bounds.y + display.bounds.height - windowBounds.height)
    );
    
    this.historyWindow.setPosition(adjustedX, adjustedY);
    this.historyWindow.show();
    this.historyWindow.focus();
    
    // Notify renderer that window is shown
    this.historyWindow.webContents.send('window-shown');
  }

  // Hide the history window
  hideHistoryWindow() {
    if (!this.historyWindow) return;
    
    console.log('正在隐藏历史窗口');
    this.historyWindow.hide();
    
    // Try to return focus to the previously focused app
    if (this.previouslyFocusedApp && !this.previouslyFocusedApp.isDestroyed()) {
      console.log('尝试返回焦点到之前的应用');
      this.previouslyFocusedApp.focus();
    } else {
      console.log('没有之前的应用可以返回焦点，尝试隐藏当前应用');
      // If we don't have a previous window to focus, try to hide the app
      if (process.platform === 'darwin') {
        app.hide();
      }
    }
    
    // Notify renderer that window is hidden
    this.historyWindow.webContents.send('window-hidden');
  }

  // Copy text to clipboard for pasting
  copyTextToClipboard(text) {
    // Hide window first
    this.hideHistoryWindow();
    
    // Set new content to clipboard
    clipboard.writeText(text);
    
    // Notify the user that text is copied and ready to paste
    const { Notification } = require('electron');
    new Notification({
      title: 'Text Copied',
      body: 'Text is copied to clipboard. Use Cmd+V (or Ctrl+V) to paste.'
    }).show();
  }
}

module.exports = KeyboardManager; 