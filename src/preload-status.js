// Preload script for status.html
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Send messages to main process
  getMonitoringStatus: () => ipcRenderer.send('get-monitoring-status'),
  restartMonitoring: () => ipcRenderer.send('restart-monitoring'),
  syncDatabase: () => ipcRenderer.send('sync-database'),
  
  // Receive messages from main process
  onMonitoringStatus: (callback) => ipcRenderer.on('monitoring-status', (_, status) => callback(status)),
  onDatabaseSyncResult: (callback) => ipcRenderer.on('database-sync-result', (_, result) => callback(result)),
}); 