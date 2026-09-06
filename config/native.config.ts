/**
 * 原生调用配置文件
 * 集中管理支持的原生方法、页面路由等配置，便于统一维护和扩展
 */

// 支持的原生方法列表
export const SUPPORTED_METHODS = ['getData', 'postData', 'close', 'go'] as const;

// 支持的页面路由列表
export const SUPPORTED_PAGES = [
  'recharge',
  'profile',
  'login',
  'send',
  'chatRoom',
  'coupleRoom',
  'package',
] as const;

// 导出类型（供其他文件复用）
export type SupportedMethod = (typeof SUPPORTED_METHODS)[number];
export type SupportedPage = (typeof SUPPORTED_PAGES)[number];
