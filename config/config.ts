// https://umijs.org/config/
import { join } from 'node:path';
import { defineConfig } from '@umijs/max';
import define from './define.config';
import routes from './router.config';

type ConfigType = ReturnType<typeof defineConfig>;

export default defineConfig({
  base: '/',
  publicPath: '/',
  // outputPath: './dist',
  define,
  favicons: [],
  hash: true,
  // { type: 'browser' | 'hash' # | 'memory' }
  history: { type: 'browser' },
  headScripts: [
    {
      src: 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js',
      defer: true,
    },
  ],
  fastRefresh: true,
  ignoreMomentLocale: true,
  dva: {},
  model: {},
  initialState: {},
  request: {
    dataField: '',
  },
  alias: {
    '@': join(__dirname, '../src'),
    '@config': join(__dirname, '../config'),
    '@audio': join(__dirname, '../src/assets/audio'),
    '@images': join(__dirname, '../src/assets/images'),
    '@spine': join(__dirname, '../src/assets/spine'),
    '@video': join(__dirname, '../src/assets/video'),
    '@fonts': join(__dirname, '../src/assets/fonts'),
  },
  metas: [
    {
      name: 'viewport',
      content:
        'width=device-width,viewport-fit=cover, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0',
    },
  ],
  //================ pro 插件配置 =================
  plugins: [],
  targets: {
    chrome: '49',
    ios: '10',
  },
  /**
   * @name moment2dayjs 插件
   * @description 将项目中的 moment 替换为 dayjs
   * @doc https://umijs.org/docs/max/moment2dayjs
   */
  moment2dayjs: {
    plugins: ['duration'],
  },
  // umi routes: https://umijs.org/docs/routing
  routes,
  esbuildMinifyIIFE: true,
  jsMinifierOptions: {
    target: ['chrome80', 'es2020'],
  },
}) as ConfigType;
