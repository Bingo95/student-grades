import dayjs from 'dayjs';
import { Toast } from 'antd-mobile';
import { history } from '@umijs/max';
import isBetween from 'dayjs/plugin/isBetween';
import queryString from 'query-string';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
dayjs.extend(isBetween);

// 补0两位数
export const padZero = (num: number | string): string => {
  if (num === null || num === undefined) return '';
  return String(num).padStart(2, '0');
};

export const toast = (val: string, fn?: (() => any) | undefined) => {
  requestAnimationFrame(() => {
    Toast.show({
      content: val,
      afterClose: () => {
        fn && fn();
      },
    });
  });
};

// 设计稿基准宽度（优先使用全局 DESIGN_WIDTH，缺失/非法时回退 750）
const DESIGN_WIDTH_VALUE: number =
  typeof DESIGN_WIDTH !== 'undefined' && DESIGN_WIDTH > 0 ? DESIGN_WIDTH : 750;

export const pxToVw = (pxValue: number | string): string => {
  if (pxValue === 'auto') return pxValue;
  if (pxValue === null || pxValue === undefined) return '';
  const px = parseFloat(String(pxValue));
  if (isNaN(px)) return String(pxValue);
  return `${(px / DESIGN_WIDTH_VALUE) * 100}vw`;
};

/**
 * 格式化时间：今天显示n秒/分/小时前，昨天显示昨天，前天显示前天，其余显示YY‑MM‑DD HH:mm
 * @param {string | number} time - 时间戳（字符串/数字）或日期字符串，支持UTC带Z格式
 * @param {string} line 日期分隔符
 * @returns {string} 格式化后的时间文本
 */
export const formatTime = (time: string | number, line: string = '-'): string => {
  // 1. 解析时间：兼容秒/毫秒时间戳、UTC‑Z字符串、普通日期字符串
  let inputTime: string | number = time;

  // 兼容秒级时间戳：数字或纯数字字符串且小于 1e12 → 秒时间戳，转毫秒
  const raw = typeof time === 'string' ? Number(time) : time;
  if (typeof raw === 'number' && !Number.isNaN(raw) && raw < 1e12) {
    inputTime = raw * 1000;
  }

  // ✅重点：如果输入是带Z的UTC时间，使用 dayjs.utc() 解析，再转本地时区
  let targetTime: dayjs.Dayjs;
  if (typeof inputTime === 'string' && inputTime.endsWith('Z')) {
    targetTime = dayjs.utc(inputTime).local();
  } else {
    targetTime = dayjs(inputTime);
  }

  if (!targetTime.isValid()) return '无效时间';

  const now = dayjs();
  // 未来时间直接格式化
  if (targetTime.isAfter(now)) {
    return targetTime.format(`YY${line}MM${line}DD HH:mm`);
  }

  const todayStart = now.startOf('day');
  const todayEnd = now.endOf('day');
  const yesterdayStart = now.subtract(1, 'day').startOf('day');
  const yesterdayEnd = now.subtract(1, 'day').endOf('day');
  const beforeYesterdayStart = now.subtract(2, 'day').startOf('day');
  const beforeYesterdayEnd = now.subtract(2, 'day').endOf('day');

  /*
   ✅ dayjs isBetween 第四个参数 '[]' 代表闭区间：包含左右边界 [start, end]
   原代码是开区间，00:00:00时刻会漏掉，导致日期归类错误
  */
  if (targetTime.isBetween(todayStart, todayEnd, null, '[]')) {
    const diffSeconds = now.diff(targetTime, 'second');
    if (diffSeconds < 60) {
      return `${diffSeconds || 1}秒前`;
    }
    const diffMinutes = now.diff(targetTime, 'minute');
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    }
    const diffHours = now.diff(targetTime, 'hour');
    return `${diffHours}小时前`;
  } else if (targetTime.isBetween(yesterdayStart, yesterdayEnd, null, '[]')) {
    return '昨天';
  } else if (targetTime.isBetween(beforeYesterdayStart, beforeYesterdayEnd, null, '[]')) {
    return '前天';
  } else {
    return targetTime.format(`YY${line}MM${line}DD HH:mm`);
  }
};

/**
 * 修改页面标题
 * @param {*} title
 * @returns
 */
export const editTitle = (title: string) => {
  if (!title) return;
  document.title = title;
  // iframe 辅助函数（确保 DOM 就绪）
  const createIframe = () => {
    if (!document.body) return;
    const iframe = document.createElement('iframe');
    iframe.title = title;
    iframe.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    iframe.style.cssText = 'visibility:hidden;width:1px;height:1px;position:absolute;top:-999px;';
    iframe.onload = () => setTimeout(() => iframe.remove(), 10); // 10ms 延迟兼容部分浏览器标题渲染
    document.body.appendChild(iframe);
  };
  // 确保 DOM 加载完成后创建 iframe
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createIframe();
  } else {
    document.addEventListener('DOMContentLoaded', createIframe);
  }
};

/**
 * 获取路由参数
 * @returns {Object} {}
 */
/**
 * 获取 URL 参数
 * @param paramName 可选，指定要获取的参数名（不传则返回所有参数对象）
 * @returns 若传参数名则返回对应值（string），不传则返回所有参数对象
 */
// 重载1：传参数名 → 返回 string
export function getUrlParams(paramName: string): string;
// 重载2：不传参数名 → 返回 Record<string, string>
export function getUrlParams(): Record<string, string>;

export function getUrlParams(paramName?: string): string | Record<string, string> {
  const { search } = history.location;
  // 解析 URL 搜索参数
  const paramsObj = queryString.parse(search) as Record<string, string>;
  // 根据是否传参数名返回对应结果
  if (paramName) {
    return paramsObj[paramName] || ''; // 返回指定参数值（无则返回 ''）
  }
  return paramsObj; // 不传参数名则返回所有参数对象
}

/**
 * 对象转路由参数
 * @returns {String} a=1&b=2
 */
export const queryParams = (data: Record<string, any>): string => {
  const newSearch = queryString.stringify(data);
  return newSearch ? newSearch : '';
};

/**
 * 路由跳转
 * @param {*} path
 * @param {*} params
 */

// 拼接 URL：兼容 path 已携带 query 的情况，避免重复 '?'
const buildUrl = (path: string, params: object): string => {
  const trimmed = path.trim();
  const [base, existQuery] = trimmed.split('?');
  const existParams = existQuery ? queryString.parse(existQuery) : {};
  const merged = { ...existParams, ...params };
  const data = queryString.stringify(merged);
  return data ? `${base}?${data}` : base;
};

export const router = {
  /**
   * 历史记录跳转
   * @param {string} path - 目标路径（必填）
   * @param {Object} [params] - 跳转参数（可选）
   */
  push: (path: string = '', params: object = {}) => {
    history.push(buildUrl(path, params));
  },

  /**
   * 替换当前历史记录（重定向）
   * @param {string} path - 目标路径（必填）
   * @param {Object} [params] - 跳转参数（可选）
   * 特点：不会新增历史记录，返回时跳过当前页
   */
  replace: (path: string = '', params: object = {}) => {
    history.replace(buildUrl(path, params));
  },

  /**
   * 基于历史记录跳转（支持前进/后退）
   * @param {number} step - 跳转步数（正数前进，负数后退）
   * 示例：router.go(-1) → 后退1页，等同于 router.goBack()
   */
  go: (step: number = 0) => {
    history.go(step);
  },

  /**
   * 后退一页（快捷方法）
   * 等同于：router.go(-1) / history.back()
   */
  goBack: () => {
    history.back();
  },

  /**
   * 前进一页（快捷方法）
   * 等同于：router.go(1) / history.forward()
   */
  goForward: () => {
    history.forward();
  },
};

/**
 * 复制
 * @param {*} text
 */
export const handleCopy = (text: string) => {
  // 兼容性兜底：用 textarea + execCommand 复制
  const fallbackCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      toast('复制成功');
    } catch {
      toast('复制失败');
    }
    document.body.removeChild(textarea);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    // 现代浏览器（需 https / localhost）
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast('复制成功');
      })
      .catch(() => {
        // 写入失败（如页面未聚焦、权限不足）降级到 execCommand
        fallbackCopy();
      });
  } else {
    fallbackCopy();
  }
};

/**
 * 根据对象的 value 获取对应的 key（支持浅层对象）
 * @param obj 目标对象（必须为非数组对象）
 * @param value 要匹配的值（严格相等 ===）
 * @returns 匹配到的 key（无匹配时返回 null）
 */
export const objGetKey = (obj: { [x: string]: any }, value: any) => {
  return Object.keys(obj).find((k) => obj[k] === value) ?? null;
};
