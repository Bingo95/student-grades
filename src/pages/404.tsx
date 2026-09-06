// @ts-nocheck
import { useEffect } from 'react';
import { Result } from 'antd-mobile';

const NoFoundPage = () => {
  // 组件挂载时设置背景色，卸载时恢复
  useEffect(() => {
    const rootElement = document.getElementById('root');
    const originalBg = rootElement.style.background;
    // 设置背景色
    rootElement.style.background = '#ffffff';
    // 组件卸载时恢复原始背景色
    return () => {
      rootElement.style.background = originalBg;
    };
  }, []);

  return <Result status="info" title="404" description={'抱歉，您访问的页面不存在。'} />;
};
export default NoFoundPage;
