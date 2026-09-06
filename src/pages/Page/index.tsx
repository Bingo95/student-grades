// @ts-nocheck
import routerConfig from '@config/router.config';

const Page = () => {
  const handleGoPage = (path) => {
    window.router.push(path);
  };

  /**
   * 扁平化嵌套路由数组，提取所有包含name的路由项（仅保留name和path）
   * @param {Array} routes - 嵌套的路由配置数组
   * @returns {Array} 扁平化后包含name和path的路由数组
   */
  const flattenRoutesWithName = (routes) => {
    let result = [];
    // 递归遍历所有层级的路由
    function traverse(currentRoutes) {
      // 使用forEach遍历currentRoutes数组
      currentRoutes.forEach((route) => {
        // 只保留有name属性的路由项，提取name和path
        if ((route.name || route.path) && !route.routes) {
          result.push({
            name: route.name || route.path,
            path: route.path,
          });
        }
        // 如果有子路由，继续递归遍历
        if (route.routes && Array.isArray(route.routes)) {
          traverse(route.routes);
        }
      });
    }

    traverse(routes);
    return result;
  };

  const menu = flattenRoutesWithName(routerConfig);

  return (
    <div style={{ padding: 20 }}>
      <h1>h5页面</h1>
      {menu.map((i) => (
        <div key={i.path} style={{ marginBottom: 10 }}>
          <a onClick={() => handleGoPage(i.path)}>{i.name}</a>
        </div>
      ))}
    </div>
  );
};

export default Page;
