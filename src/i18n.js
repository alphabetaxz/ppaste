const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// 支持的语言列表
const supportedLocales = ['en', 'zh-CN'];

// 翻译字典
const translations = {
  'en': {
    // 应用名称
    'appName': 'Clipboard History',
    
    // 菜单项
    'showClipboardHistory': 'Show Clipboard History',
    'statusMonitor': 'Status Monitor',
    'quit': 'Quit',
    
    // 历史窗口
    'clipboardHistory': 'Clipboard History',
    'searchPlaceholder': 'Search clipboard history...',
    'noItemsFound': 'No clipboard items found',
    'navigateShortcut': '↑/↓: Navigate',
    'selectShortcut': 'Enter: Select',
    'closeShortcut': 'Esc: Close',
    'today': 'Today at',
    'yesterday': 'Yesterday at',
    
    // 状态监控
    'statusWindowTitle': 'Clipboard Status Monitor',
    'statusWindowReady': 'Status window ready',
    'monitoringActive': 'Active',
    'monitoringInactive': 'Inactive',
    'failCount': 'Fail Count',
    'lastContent': 'Last Content',
    'refreshStatus': 'Refresh Status',
    'restartMonitoring': 'Restart Monitoring',
    'autoRefresh': 'Auto Refresh (5s)',
    'monitoringStatusSent': 'Monitoring status sent',
    'monitoringRestarted': 'Monitoring restarted',
    
    // 通知和提示
    'accessibilityPermissionNeeded': 'Accessibility Permission Needed',
    'accessibilityPermissionMessage': 'Content copied to clipboard. Please paste manually or configure accessibility permissions to enable auto-paste.',
    'configurePermissions': 'Configure Permissions',
    'permissionInstructions': `Please follow these steps to configure permissions:

1. Go to "System Settings" > "Privacy & Security" > "Accessibility"
2. Find this application (${app.getName()}) in the list on the right
3. Check the checkbox next to the application to grant permission
4. If the application is not in the list, click the "+" button to add it
5. In development environment, add your terminal application (like Terminal or iTerm2)
6. Restart the application for the permissions to take effect

Note: In development environment, permissions need to be granted to the terminal program that launches this app (like Terminal or iTerm2).`,
    'gotIt': 'Got it',
    
    // 日志消息
    'databaseInitialized': 'Database initialized',
    'clipboardMonitoringStarted': 'Clipboard monitoring started',
    'clipboardMonitoringStopped': 'Clipboard monitoring stopped',
    'globalShortcutRegistered': 'Global shortcut CommandOrControl+Shift+V registered',
    'globalShortcutsUnregistered': 'Global shortcuts unregistered',
    'appInitialized': 'App initialized successfully',
    'usingClipboardItem': 'Using clipboard item',
    'contentCopiedToClipboard': 'Content copied to clipboard',
    'historyWindowHidden': 'History window hidden',
    'accessibilityPermissionStatus': 'Accessibility permission status',
    'authorized': 'authorized',
    'unauthorized': 'unauthorized',
    'permissionNotificationShown': 'Permission notification shown',
    'tryingToAutoPaste': 'Trying to auto-paste with AppleScript',
    'tryingToGetFrontApp': 'Trying to get foreground app and execute paste',
    'currentForegroundApp': 'Current foreground app',
    'pasteCommandExecuted': 'Paste command executed successfully',
    'pasteCommandFailed': 'Failed to execute paste command',
    'trayIconCreated': 'Tray icon created successfully, using icon',
    'usingFallbackIcon': 'Using fallback empty icon',
    'creatingTrayIconFailed': 'Failed to create tray icon',
    'creatingFallbackIconFailed': 'Failed to create fallback tray icon',
    'iconFileNotFound': 'Icon file not found',
    'usingCustomIcon': 'Using custom icon as dock icon',
    'settingDockIconFailed': 'Failed to set dock icon',
  },
  'zh-CN': {
    // 应用名称
    'appName': '剪贴板历史管理器',
    
    // 菜单项
    'showClipboardHistory': '显示剪贴板历史',
    'statusMonitor': '状态监控',
    'quit': '退出',
    
    // 历史窗口
    'clipboardHistory': '剪贴板历史',
    'searchPlaceholder': '搜索剪贴板历史...',
    'noItemsFound': '未找到剪贴板项目',
    'navigateShortcut': '↑/↓: 导航',
    'selectShortcut': 'Enter: 选择',
    'closeShortcut': 'Esc: 关闭',
    'today': '今天',
    'yesterday': '昨天',
    
    // 状态监控
    'statusWindowTitle': '剪贴板状态监控',
    'statusWindowReady': '状态窗口已准备就绪',
    'monitoringActive': '活跃',
    'monitoringInactive': '未活跃',
    'failCount': '失败计数',
    'lastContent': '最近内容',
    'refreshStatus': '刷新状态',
    'restartMonitoring': '重启监控',
    'autoRefresh': '自动刷新 (5秒)',
    'monitoringStatusSent': '监控状态已发送',
    'monitoringRestarted': '监控已重启',
    
    // 通知和提示
    'accessibilityPermissionNeeded': '需要辅助功能权限',
    'accessibilityPermissionMessage': '内容已复制到剪贴板。请手动粘贴或配置辅助功能权限以启用自动粘贴。',
    'configurePermissions': '配置权限',
    'permissionInstructions': `请按照以下步骤配置权限：

1. 点击"系统设置" > "隐私与安全性" > "辅助功能"
2. 在右侧列表中找到此应用程序（${app.getName()}）
3. 勾选应用程序旁边的复选框以授予权限
4. 如果应用程序不在列表中，请点击"+"按钮添加应用程序
5. 在开发环境中，请添加您的终端应用（如Terminal或iTerm2）
6. 重启应用程序以使权限生效

注意：在开发环境中，权限需要授予给启动此应用的终端程序（如Terminal或iTerm2）。`,
    'gotIt': '好的，我知道了',
    
    // 日志消息
    'databaseInitialized': '数据库已初始化',
    'clipboardMonitoringStarted': '剪贴板监控已启动',
    'clipboardMonitoringStopped': '剪贴板监控已停止',
    'globalShortcutRegistered': '全局快捷键 CommandOrControl+Shift+V 已注册',
    'globalShortcutsUnregistered': '全局快捷键已注销',
    'appInitialized': '应用程序初始化成功',
    'usingClipboardItem': '使用剪贴板项目',
    'contentCopiedToClipboard': '内容已复制到剪贴板',
    'historyWindowHidden': '历史窗口已隐藏',
    'accessibilityPermissionStatus': '辅助功能权限状态',
    'authorized': '已授权',
    'unauthorized': '未授权',
    'permissionNotificationShown': '已显示权限通知',
    'tryingToAutoPaste': '尝试使用AppleScript自动粘贴',
    'tryingToGetFrontApp': '尝试获取前台应用并执行粘贴',
    'currentForegroundApp': '当前前台应用',
    'pasteCommandExecuted': '粘贴命令执行成功',
    'pasteCommandFailed': '粘贴命令执行失败',
    'trayIconCreated': '托盘图标创建成功，使用图标',
    'usingFallbackIcon': '使用备用空图标',
    'creatingTrayIconFailed': '创建托盘图标失败',
    'creatingFallbackIconFailed': '创建备用托盘图标也失败',
    'iconFileNotFound': '图标文件不存在',
    'usingCustomIcon': '使用自定义图标作为dock图标',
    'settingDockIconFailed': '设置dock图标失败',
  }
};

// 获取系统语言
function getSystemLocale() {
  // 获取系统语言，如果无法获取则默认为英文
  const locale = app.getLocale() || 'en';
  
  // 检查是否支持该语言，如果不支持则使用英文
  if (supportedLocales.includes(locale)) {
    return locale;
  }
  
  // 如果是中文的其他变种（如zh-TW），也使用zh-CN
  if (locale.startsWith('zh')) {
    return 'zh-CN';
  }
  
  // 默认使用英文
  return 'en';
}

// 当前使用的语言
let currentLocale = 'en'; // 默认为英文

// 初始化i18n
function initI18n() {
  currentLocale = getSystemLocale();
  console.log(`Using locale: ${currentLocale}`);
  return currentLocale;
}

// 获取翻译
function t(key) {
  // 如果找不到对应的翻译，则返回英文翻译，如果英文也没有，则返回键名
  return translations[currentLocale]?.[key] || translations['en'][key] || key;
}

// 获取应用名称
function getAppName() {
  return t('appName');
}

// 获取当前语言
function getCurrentLocale() {
  return currentLocale;
}

module.exports = {
  initI18n,
  t,
  getAppName,
  getCurrentLocale
}; 