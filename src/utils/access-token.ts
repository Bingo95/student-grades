/**
 * 进房令牌（accessToken）存储工具
 *
 * - 令牌由 POST /api/users/partner/enter 下发（accessToken + expiresInSeconds）；
 * - 与 game/js/api.js 共用同一个 localStorage key（gp_game_access_token），
 *   保证 H5 与游戏页在同一域名下会话互通；
 * - 请求时以 `Authorization: Bearer <token>` 携带，且不参与请求签名（签名排除 token）；
 * - 401 且错误信息含「会话」/「进房」时清除令牌，避免带着过期令牌反复重试。
 */

/** 令牌本体（与 game/js/api.js 保持一致） */
const ACCESS_TOKEN_KEY = 'gp_game_access_token';
/** 令牌过期时间点（毫秒时间戳，0 表示不过期） */
const ACCESS_TOKEN_EXPIRES_KEY = 'gp_game_access_token_expires_at';
/** 预留 60s 时钟偏差，避免临界秒级因客户端/服务端时间差导致 401 */
const CLOCK_SKEW_MS = 60 * 1000;

/** 读取令牌：不存在或已过期返回空串（过期会顺带清理） */
export const getAccessToken = (): string => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) || '';
    if (!token) return '';
    const expiresAt = Number(
      localStorage.getItem(ACCESS_TOKEN_EXPIRES_KEY) || 0,
    );
    if (expiresAt > 0 && Date.now() >= expiresAt - CLOCK_SKEW_MS) {
      clearAccessToken();
      return '';
    }
    return token;
  } catch (_) {
    return '';
  }
};

/**
 * 写入令牌
 * @param token 令牌本体，空值等同于清除
 * @param expiresInSeconds 有效期（秒），<=0 或未传时表示不过期
 */
export const setAccessToken = (
  token?: string,
  expiresInSeconds?: number,
): void => {
  try {
    if (!token) {
      clearAccessToken();
      return;
    }
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    const ttl = Number(expiresInSeconds);
    if (ttl > 0) {
      localStorage.setItem(
        ACCESS_TOKEN_EXPIRES_KEY,
        String(Date.now() + ttl * 1000),
      );
    } else {
      localStorage.removeItem(ACCESS_TOKEN_EXPIRES_KEY);
    }
  } catch (_) {
    /* localStorage 不可用（隐私模式等）时静默降级 */
  }
};

/** 清除令牌与过期时间 */
export const clearAccessToken = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_EXPIRES_KEY);
  } catch (_) {
    /* ignore */
  }
};
