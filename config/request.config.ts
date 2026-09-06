/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 *
 * 请求签名规则（与后端 RequestSignService / game/js/api.js 保持一致）：
 * 1. 排除 sign / token / pkg 三个字段（大小写不敏感），且不参与签名；
 * 2. 空值（null / undefined / '' / NaN / 对象 / 数组）直接丢弃，不参与签名；
 * 3. 布尔转 'true' | 'false'，数字按整数/浮点原样转字符串；
 * 4. 参与签名的 key 按字典序升序排列，拼接成 k1=v1&k2=v2；
 * 5. 末尾追加 key=<secret>，整体做 SHA-256，输出 64 位小写 hex；
 * 6. 业务参数补 timestamp（毫秒）后一起签名，sign 与 timestamp 随请求体 / query 一起发送。
 */
// @ts-nocheck
import CryptoJS from 'crypto-js';
import { Toast } from 'antd-mobile';
import { getUrlParams } from '@/utils/utils';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/utils/access-token';
import type { RequestOptions } from '@@/plugin-request/request';
import queryString from 'query-string';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

// ===================== 签名密钥 =====================
/** 兜底密钥：后端下发后请改为 window.APP_CONFIG.requestSignSecret，避免硬编码进包体 */
const FALLBACK_REQUEST_SIGN_SECRET = '2sZpGXbKSAW9hj75T42dGx6yQss7PP9F';

/** 与 game/js/api.js 一致：优先读运行时 window.APP_CONFIG.requestSignSecret */
const requestSignSecret = () => {
  const cfg = (typeof window !== 'undefined' && (window as any).APP_CONFIG) || {};
  return cfg.requestSignSecret || FALLBACK_REQUEST_SIGN_SECRET;
};

// ===================== 进房令牌（accessToken） =====================
/**
 * 统一在响应拦截器里捕获进房令牌：
 * POST /api/users/partner/enter 返回 { accessToken, expiresInSeconds, ... }，
 * 落 localStorage 后，后续所有请求自动带 Authorization: Bearer <token>。
 *
 * - 放在拦截器而非 service 里：覆盖所有调用方（含 native-request 本地兜底链路）；
 * - 以「响应体里带 accessToken 字符串」为准而非匹配 URL：兼容拿到的是 axios response
 *   （数据在 response.data）还是已被 umi 解包过的业务体，也顺带支持后续令牌续期接口。
 */
const captureAccessToken = (response: any) => {
  const body = response?.data ?? response;
  const token = typeof body?.accessToken === 'string' ? body.accessToken : '';
  if (!token) return;
  setAccessToken(token, body?.expiresInSeconds);
};

// ===================== 签名核心 =====================
/** sign / token / pkg 不参与签名 */
const isExcludedSignKey = (key: string) => {
  const k = String(key || '').toLowerCase();
  return k === 'sign' || k === 'token' || k === 'pkg';
};

/** 参数值归一化：可签名的返回字符串，否则返回 null（不参与签名） */
const stringifySignValue = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const s = value.trim();
    return s === '' ? null : s;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (Number.isInteger(value)) return String(value);
    if (Math.floor(value) === value) return String(Math.trunc(value));
    return String(value);
  }
  // 对象 / 数组 / 函数等复杂结构不参与签名
  if (typeof value === 'object') return null;
  const s = String(value).trim();
  return s === '' ? null : s;
};

/** 计算签名：字典序拼接 + 末尾 &key=secret，SHA-256 输出小写 hex */
const computeRequestSign = (params?: Record<string, any>) => {
  const secret = requestSignSecret();
  if (!secret) throw new Error('未配置 requestSignSecret，无法签名');

  const sortedKeys = Object.keys(params || {})
    .filter((k) => !isExcludedSignKey(k))
    .filter((k) => stringifySignValue((params || {})[k]) != null)
    .sort();

  const parts = sortedKeys.map((k) => `${k}=${stringifySignValue(params[k])}`);
  parts.push(`key=${secret}`);
  return CryptoJS.SHA256(parts.join('&')).toString(CryptoJS.enc.Hex);
};

/** 为业务参数补 timestamp + sign（token / pkg 若存在会原样保留但不参与签名） */
const withRequestSign = (fields?: Record<string, any>) => {
  const payload: Record<string, any> = { ...(fields || {}) };
  payload.timestamp = Date.now();
  payload.sign = computeRequestSign(payload);
  return payload;
};

/** 只有普通对象才需要加签（FormData / Blob / 字符串等原样透传） */
const isPlainObjectBody = (data: any) =>
  !!data &&
  typeof data === 'object' &&
  !Array.isArray(data) &&
  !(typeof FormData !== 'undefined' && data instanceof FormData) &&
  !(typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) &&
  !(typeof Blob !== 'undefined' && data instanceof Blob) &&
  !(typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer);

const errorHandler = (error: { name?: any; data?: any; config?: any; response?: any }) => {
  const { url: apiName } = error.config || {};

  if (error.name === 'BizError') {
    showErrorToast(`【${apiName}】${error.data.msg}`);
    return error.data.code;
  }

  const { response } = error;
  const status = response?.status;

  // 401：会话/进房失效时清掉本地令牌，避免带着过期 token 反复重试
  if (status === 401) {
    const msg = response?.data?.error || response?.data?.msg || '';
    if (String(msg).includes('会话') || String(msg).includes('进房')) {
      clearAccessToken();
    }
  }

  // @ts-ignore
  const errortext = codeMessage[status || 500] || response?.statusText;
  showErrorToast(response?.data?.error || `【${apiName}】${errortext}`);
};

// 表单数据编码函数（兼容多层对象、数组，处理特殊字符）
const encodeFormData = (data: Record<string, any>) => {
  if (!data || typeof data !== 'object') return '';
  return queryString.stringify(data);
};

const getToken = () => {
  const { ci, c } = getUrlParams();
  // 通用参数
  const commonParams = {
    a: 11,
    av: '1.0.0',
    c: 4,
    ci: ci || c || 4,
    di: '1a00bf0e978c458f7620b390714b26cc',
    lat: '',
    lng: '',
    pm: '',
    pn: 'com.starbuds.h5',
    st: 1,
    sv: '',
    t: '',
    ts: Date.now(),
  };

  // 构建签名字符串，参数顺序需与后端一致
  const paramEntries = Object.entries(commonParams);
  const toSign = paramEntries.map(([k, v]) => `${k}=${v}`).join('&') + commonParams.pn;
  const sign = CryptoJS.MD5(toSign + '.security').toString();
  const pkgObj = { ...commonParams, s: sign };
  const token = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(pkgObj)));
  return token;
};

// 错误提示工具函数
const showErrorToast = (content: string) => {
  Toast.clear(); // 先清除所有旧的 Toast（关键：避免覆盖）
  Toast.show({ content });
};

export default {
  timeout: 5000,
  baseURL: API_BASE_URL,
  credentials: 'include', // 默认请求是否带上cookie 'include','same-origin'
  // 请求拦截器（发送请求前处理）
  requestInterceptors: [
    (config: RequestOptions) => {
      const showLoading = config && config.showLoading !== false;
      // 支持每次请求通过 config.showToast 控制是否显示 loading toast（默认显示）
      if (showLoading) Toast.show({ icon: 'loading', duration: 0, maskClickable: false });

      // headers 兜底：umi request 未显式传 headers 时为 undefined，后续赋值会抛错
      config.headers = { ...(config.headers || {}) };

      const method = String(config.method || 'get').toUpperCase();
      // 允许单个请求通过 skipSign: true 关闭加签（第三方地址 / 文件上传等）
      const needSign = config.skipSign !== true;

      // ========== GET：query 追加 timestamp + sign（同时解决安卓 webview GET 磁盘缓存） ==========
      if (method === 'GET' && needSign) {
        config.params = withRequestSign(config.params);
      }

      // ========== 写操作：JSON 请求体加签 ==========
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
        needSign &&
        isPlainObjectBody(config.data)
      ) {
        config.data = withRequestSign(config.data);
      }

      // 处理表单请求的data编码（signed 字段已包含 timestamp + sign）
      if (
        config.requestType === 'form' &&
        ['POST', 'PUT', 'PATCH'].includes(method) &&
        typeof config.data === 'object'
      ) {
        // 把对象转成 key=value& 格式的字符串
        config.data = encodeFormData(config.data);

        // @ts-ignore 显式设置 Content-Type（确保合规）
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      }

      // 获取 token（优先本地，其次 URL）忽略环境判断
      const token = getToken();
      const accessToken = getAccessToken();

      config.headers = {
        ...config.headers,
        ...(token ? { pkg: `${token}` } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      return config;
    },
  ],
  // 响应拦截器（接收响应后处理）
  responseInterceptors: [
    [
      async (response: any) => {
        // 仅在请求允许显示 toast 时清除 loading
        const respConfig = response && response.config;
        const shouldShow = respConfig && respConfig.showToast !== false;
        const showLoading = respConfig && respConfig.showLoading !== false;
        (shouldShow || showLoading) && Toast.clear();
        // 兼容blob文件下载（如导出Excel）
        if (response?.data instanceof Blob || response?.config?.responseType === 'blob') {
          return response;
        }

        // 进房令牌落地：enter 接口返回后写入 localStorage，后续请求自动携带
        captureAccessToken(response);

        // 正确解析响应数据（clone避免数据流被消费）
        const res = response.data;
        // 业务失败（success=false 或 code不是成功值）
        if (!res) {
          // 普通业务异常提示（尊重 showToast 配置）
          if (shouldShow) Toast.show({ content: error || '响应失败' });
          // 抛出异常，让useRequest能捕获（关键：否则useRequest认为请求成功）
          throw new Error(error || `业务异常：${code}`);
        }
        // 业务成功：只返回data（或整行res，根据业务需求调整）
        return response;
      },
      (error: { response: any; name?: any; data?: any }) => {
        // 根据请求配置决定是否显示错误提示
        if (error.response?.status) {
          // HTTP 状态码错误
          errorHandler(error);
        } else {
          // 其他响应错误
          showErrorToast('响应处理异常，请稍后重试');
        }
        return Promise.reject(error);
      },
    ],
  ],
};
