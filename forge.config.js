const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

// 应用名称，将在打包时使用
// 注意：这里使用英文名称，因为在打包时还没有初始化i18n
const appName = 'Clipboard History';

module.exports = {
  packagerConfig: {
    asar: true,
    // 添加macOS特定配置，用于AppleScript权限
    // 注意：在开发环境中，这些权限需要手动配置
    // 在系统设置 > 隐私与安全性 > 辅助功能中添加您的终端应用（如Terminal或iTerm2）
    osxSign: {},
    osxEntitlements: {
      'com.apple.security.automation.apple-events': true,
    },
    entitlements: {
      'com.apple.security.automation.apple-events': true,
    },
    entitlementsInherit: {
      'com.apple.security.automation.apple-events': true,
    },
    // 添加应用图标配置
    icon: path.resolve(__dirname, 'src', 'assets', 'icon'),
    // 设置应用程序名称
    name: appName,
    // 设置应用程序ID
    appBundleId: 'com.clipboard.history',
    // 设置应用程序类别
    appCategoryType: 'public.app-category.utilities',
    // macOS特定配置
    extendInfo: {
      // 设置为代理应用，这样就不会在Dock中显示
      LSUIElement: true
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
