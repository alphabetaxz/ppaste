# Clipboard History Manager

A macOS clipboard history manager that allows you to quickly access your recent clipboard items.

## Features

- Automatically records clipboard history
- Quick access with keyboard shortcut (Cmd+Shift+V)
- Displays the 50 most recent clipboard items
- Keyboard navigation to select items
- Press Enter to copy the selected item to clipboard
- Search functionality to filter clipboard items

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/clipboard-history.git
   cd clipboard-history
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

4. To build the application:
   ```
   npm run make
   ```

## Usage

- The app runs in the background with a tray icon
- Press `Cmd+Shift+V` (or `Ctrl+Shift+V` on Windows/Linux) to show the clipboard history
- Use arrow keys to navigate through the history
- Press Enter to select an item (copies to clipboard)
- Press Escape to close the history window
- Type in the search box to filter items

## Development

This application is built with:
- Electron
- SQLite (for storing clipboard history)
- Node.js

## License

MIT 

## 权限配置

### macOS辅助功能权限

为了使应用能够自动在光标位置粘贴选中的剪贴板内容，需要配置辅助功能权限：

#### 在开发环境中配置权限

1. 打开"系统设置" > "隐私与安全性" > "辅助功能"
2. 点击"+"按钮添加应用程序
3. 找到并添加您用于启动应用的终端程序（如Terminal或iTerm2）
4. 确保该终端程序旁边的复选框已勾选
5. 重启终端和应用程序以使权限生效

#### 在生产环境中配置权限

1. 打开"系统设置" > "隐私与安全性" > "辅助功能"
2. 在右侧列表中找到此应用程序
3. 勾选应用程序旁边的复选框以授予权限
4. 如果应用程序不在列表中，请点击"+"按钮添加应用程序
5. 重启应用程序以使权限生效

### 权限问题排查

如果自动粘贴功能不工作：

1. 确认已授予正确的权限
   - 在macOS上，打开"系统设置" > "隐私与安全性" > "辅助功能"
   - 确保应用程序（或开发环境中的终端程序）已被添加并勾选

2. 在开发环境中，确保权限已授予给启动应用的终端程序
   - 注意：权限必须授予给启动Electron应用的终端程序，而不是Electron应用本身
   - 如果使用VS Code的终端，则需要授予VS Code权限
   - 如果使用iTerm2或Terminal，则需要授予相应程序权限

3. 检查控制台日志
   - 查看应用程序控制台输出中是否有权限相关的错误信息
   - 特别注意"System Events got an error: osascript is not allowed to send keystrokes"这类错误

4. 尝试重启应用程序和终端
   - 有时权限更改需要重启应用程序和终端才能生效

5. 检查系统设置
   - 在某些macOS版本中，可能需要在"系统设置" > "隐私与安全性" > "自动化"中额外授予权限
   - 确保没有其他安全软件阻止AppleScript执行

6. 手动测试AppleScript
   - 打开终端，运行以下命令测试AppleScript是否可以正常工作：
   ```
   osascript -e 'tell application "System Events" to keystroke "v" using {command down}'
   ```
   - 如果此命令返回错误，则表明系统权限设置有问题

7. 使用备选方法
   - 如果自动粘贴功能仍然不工作，可以使用手动粘贴（Cmd+V）
   - 应用程序会自动将选中的内容复制到剪贴板，您只需手动粘贴即可 