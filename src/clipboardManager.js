const { clipboard, ipcMain } = require('electron');
const { addClipboardItem, cleanupOldItems, syncDatabase } = require('./database');

class ClipboardManager {
  constructor(db) {
    this.db = db;
    this.lastClipboardContent = '';
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.monitorFailCount = 0;
    this.maxMonitorFailCount = 3;
  }

  // Start monitoring clipboard changes
  startMonitoring(intervalMs = 300) {
    if (this.isMonitoring) {
      console.log('Clipboard monitoring already active');
      return;
    }
    
    this.isMonitoring = true;
    
    // 读取当前剪贴板内容作为初始值
    try {
      this.lastClipboardContent = clipboard.readText();
      console.log(`Initial clipboard content: ${this.lastClipboardContent.substring(0, 30)}${this.lastClipboardContent.length > 30 ? '...' : ''}`);
    } catch (error) {
      console.error('Error reading initial clipboard content:', error);
      this.lastClipboardContent = '';
    }
    
    // Check for clipboard changes at regular intervals
    this.monitorInterval = setInterval(() => {
      this.checkClipboardChanges();
    }, intervalMs);
    
    // 添加自动恢复机制
    this.recoveryInterval = setInterval(() => {
      if (!this.isMonitoring && this.monitorInterval === null) {
        console.log('Automatically restarting clipboard monitoring...');
        this.startMonitoring(intervalMs);
      }
    }, 10000); // 每10秒检查一次
    
    console.log('Clipboard monitoring started');
  }

  // Stop monitoring clipboard changes
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('Clipboard monitoring already stopped');
      return;
    }
    
    clearInterval(this.monitorInterval);
    this.monitorInterval = null;
    
    // 清理恢复计时器
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = null;
    }
    
    this.isMonitoring = false;
    
    console.log('Clipboard monitoring stopped');
  }

  // Check for clipboard changes and save new content
  async checkClipboardChanges() {
    try {
      if (!this.isMonitoring) {
        console.log('Monitoring is off, skipping clipboard check');
        return;
      }
      
      let currentContent;
      try {
        currentContent = clipboard.readText();
      } catch (error) {
        console.error('Error reading clipboard:', error);
        this.monitorFailCount++;
        return;
      }
      
      // 只有当内容完全相同时才跳过
      if (currentContent === this.lastClipboardContent) {
        return;
      }
      
      // 允许保存空内容，但记录日志
      if (!currentContent) {
        console.log('Empty clipboard content detected');
      } else {
        console.log(`Clipboard change detected: ${currentContent.substring(0, 30)}${currentContent.length > 30 ? '...' : ''}`);
      }
      
      // 更新最后内容
      this.lastClipboardContent = currentContent;
      
      // 保存到数据库
      try {
        const itemId = await addClipboardItem(this.db, currentContent);
        console.log(`Clipboard content saved to database (ID: ${itemId})`);
        
        // 立即同步数据库，确保内容被持久化
        try {
          await syncDatabase(this.db);
          console.log('Database synced after saving clipboard content');
        } catch (syncError) {
          console.error('Error syncing database after saving clipboard content:', syncError);
          // 继续执行，不要因为同步失败就中断
        }
        
        // 重置失败计数
        this.monitorFailCount = 0;
        
        // 定期清理旧项目
        await cleanupOldItems(this.db);
        
        // 通知渲染进程有新的剪贴板项目
        this.notifyClipboardChange();
      } catch (dbError) {
        console.error('Error saving clipboard content to database:', dbError);
        this.monitorFailCount++;
        
        if (this.monitorFailCount >= this.maxMonitorFailCount) {
          console.error('Too many database failures, restarting monitoring...');
          this.stopMonitoring();
          setTimeout(() => this.startMonitoring(), 1000);
        }
      }
    } catch (error) {
      console.error('Error checking clipboard changes:', error);
      this.monitorFailCount++;
      
      if (this.monitorFailCount >= this.maxMonitorFailCount) {
        console.error('Too many monitoring failures, restarting monitoring...');
        this.stopMonitoring();
        setTimeout(() => this.startMonitoring(), 1000);
      }
    }
  }

  // Notify renderer process about clipboard changes
  notifyClipboardChange() {
    const windows = require('electron').BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('clipboard-updated');
        console.log('Sent clipboard-updated notification to window');
      }
    }
  }

  // Write text to clipboard
  writeToClipboard(text) {
    console.log(`Writing to clipboard: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
    
    // 暂时停止监控以避免捕获我们自己的写入
    const wasMonitoring = this.isMonitoring;
    if (wasMonitoring) {
      this.stopMonitoring();
    }
    
    try {
      // 写入剪贴板
      clipboard.writeText(text);
      this.lastClipboardContent = text;
      console.log('Content written to clipboard');
    } catch (error) {
      console.error('Error writing to clipboard:', error);
    }
    
    // 恢复监控（如果之前是活跃的）
    if (wasMonitoring) {
      // 减少延迟，确保尽快恢复监控
      setTimeout(() => {
        this.startMonitoring();
      }, 100);
    }
  }
  
  // 获取当前监控状态
  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      failCount: this.monitorFailCount,
      lastContent: this.lastClipboardContent ? 
        `${this.lastClipboardContent.substring(0, 30)}${this.lastClipboardContent.length > 30 ? '...' : ''}` : 
        'empty'
    };
  }
}

module.exports = ClipboardManager; 