/**
 * 极简环境判断工具（仅保留本地/APP核心环境）
 */
// UA 运行期不变，模块级缓存避免重复正则匹配
let cachedUA: string | null = null;
export const getUA = (): string => {
  if (cachedUA !== null) return cachedUA;
  cachedUA = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  return cachedUA;
};

// 判断是否为 iOS 设备（APP环境）
export const isIOS = (): boolean => /iP(hone|od|ad)/.test(getUA());

// 判断是否为 Android 设备（APP环境）
export const isAndroid = (): boolean => /Android/.test(getUA());

// 判断是否为 光阴app 设备（APP环境）
export const isOwnApp = (): boolean => /YAYA/.test(getUA());

// 判断是否为 APP 环境（iOS/Android）
export const isApp = (): boolean => isIOS() || isAndroid();

// 判断是否为本地开发环境（基于 hostname，防止 URL 路径中恰好含 '192.' 误判）
export const isDev = (): boolean => {
  if (typeof location === 'undefined') return false;
  const host = location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.');
};

// 聚合环境信息（便于调试）
export const getEnvInfo = () => ({
  isIOS: isIOS(),
  isAndroid: isAndroid(),
  isApp: isApp(),
  isDev: isDev(),
  isOwnApp: isOwnApp(),
});
