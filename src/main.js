// 这是应用程序的主入口点
const { app } = require('electron');

// 在应用程序启动时立即隐藏Dock图标
// 这必须在应用程序准备好之前调用
if (process.platform === 'darwin') {
  try {
    console.log('Attempting to hide dock icon immediately...');
    app.dock.hide();
    console.log('Dock icon hidden successfully at startup');
  } catch (error) {
    console.error('Failed to hide dock icon at startup:', error);
  }
}

// 导入实际的应用程序代码
require('./index'); 