// postcss.config.js
module.exports = {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: ['> 1%', 'last 2 versions', 'not dead'],
    },
    // px转viewport核心插件配置
    'postcss-px-to-viewport-8-plugin': {
      viewportWidth: 750, // 设计稿宽度（常用375或750，根据UI设计稿定）
      viewportUnit: 'vw', // 转换后的单位（默认vw，推荐）
      unitPrecision: 5, // 转换后的小数精度
      propList: ['*'], // 需要转换的CSS属性（*表示所有）
      selectorBlackList: [], // 不需要转换的选择器（如.ignore-*）
      minPixelValue: 1, // 小于等于1px的数值不转换
      mediaQuery: false, // 媒体查询中的px是否转换
      exclude: [/node_modules/], // 排除的文件（如第三方组件库，避免样式错乱）
      landscape: false, // 是否处理横屏模式
    },
  },
};
