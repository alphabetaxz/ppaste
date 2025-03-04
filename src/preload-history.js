const { contextBridge, ipcRenderer } = require('electron');

// 从主进程获取翻译
contextBridge.exposeInMainWorld('i18n', {
  // 获取翻译
  t: (key) => ipcRenderer.sendSync('get-translation', key),
  
  // 获取当前语言
  getCurrentLocale: () => ipcRenderer.sendSync('get-current-locale')
});

// 剪贴板操作API
contextBridge.exposeInMainWorld('clipboard', {
  // 获取剪贴板历史
  getHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  
  // 使用剪贴板项目
  useItem: (content) => ipcRenderer.send('use-clipboard-item', content),
  
  // 搜索剪贴板历史
  searchHistory: (query) => ipcRenderer.invoke('search-clipboard-history', query),
  
  // 隐藏窗口
  hideWindow: () => ipcRenderer.send('hide-history-window')
}); 