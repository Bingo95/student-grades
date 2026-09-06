import { defineConfig } from '@umijs/max';

type ConfigType = ReturnType<typeof defineConfig>;

export default defineConfig({
  define: {
    UMI_ENV: 'dev',
    API_BASE_URL: '',
    APP_WEPAPP_URL: 'http://localhost:8096',
    HTML_TITLE: '开发',
  },
  proxy: {
    '/api': {
      target: 'http://game.koi.huishs.asia',
      changeOrigin: true,
    },
  },
}) as ConfigType;
