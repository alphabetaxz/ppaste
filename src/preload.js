// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Send messages to main process
  getClipboardItems: () => ipcRenderer.send('get-clipboard-items'),
  useClipboardItem: (content) => ipcRenderer.send('use-clipboard-item', content),
  hideHistoryWindow: () => ipcRenderer.send('hide-history-window'),
  getMonitoringStatus: () => ipcRenderer.send('get-monitoring-status'),
  restartMonitoring: () => ipcRenderer.send('restart-monitoring'),
  
  // Receive messages from main process
  onClipboardItems: (callback) => ipcRenderer.on('clipboard-items', (_, items) => callback(items)),
  onClipboardUpdated: (callback) => ipcRenderer.on('clipboard-updated', () => callback()),
  onWindowShown: (callback) => ipcRenderer.on('window-shown', () => callback()),
  onWindowHidden: (callback) => ipcRenderer.on('window-hidden', () => callback()),
  onMonitoringStatus: (callback) => ipcRenderer.on('monitoring-status', (_, status) => callback(status)),
}); 