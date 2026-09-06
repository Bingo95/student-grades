// @ts-nocheck
import { matchRoutes } from 'umi';
import { unstableSetRender } from 'antd-mobile';
import { createRoot } from 'react-dom/client';
import { router, editTitle } from '@/utils/utils'; // 导入你的路由工具
import { RequestConfig } from '@umijs/max'; // Umi 提供的类型，用于类型安全配置
import requestConfig from '../config/request.config'; // 请求配置
import { useEffect } from 'react';
import vconsole from 'vconsole';

if (UMI_ENV === 'dev' || UMI_ENV === 'test') {
  new vconsole();
}

// antd v5兼容react 19
unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});
/**
 * Umi 启动时执行，确保全局可用
 */
if (typeof window !== 'undefined') {
  window.router = router;
}

// 设置标题 在初始加载和路由切换时做一些事情
export function onRouteChange({ clientRoutes, location }) {
  const route = matchRoutes(clientRoutes, location.pathname)?.pop()?.route;
  editTitle(route.name);
}

/**
 * UmiJS 4 运行时配置 - 应用启动时执行
 * 参考文档：https://umijs.org/docs/api/runtime-config
 */
export function rootContainer(container: React.ReactElement) {
  return container;
}

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
// @ts-ignore
export const request: RequestConfig = requestConfig;
