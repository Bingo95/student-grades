import { defineConfig } from '@umijs/max';

type ConfigType = ReturnType<typeof defineConfig>;

export default defineConfig({
  define: {
    UMI_ENV: 'prod',
    API_BASE_URL: '', // 请求服务器
  },
}) as ConfigType;
