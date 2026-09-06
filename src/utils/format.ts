/**
 * 礼池页面通用格式化与映射工具（纯函数）
 * 由老项目 Old/js/api.js 的辅助函数迁移而来。
 */

/** 千分位格式化金币 */
export const formatCoins = (n: number | string): string => {
  return Number(n || 0).toLocaleString('zh-CN');
};

/** 概率 / 比例转百分比 */
export const formatPct = (n: number, digits = 2): string => {
  return (Number(n) * 100).toFixed(digits) + '%';
};

/** 阶段名称 → 色调 class（hot / warn / 空） */
export const phaseTone = (name?: string): '' | 'hot' | 'warn' => {
  if (!name) return '';
  if (['炽热', '沸腾', '过热'].includes(name)) return 'hot';
  if (['升温', '常温'].includes(name)) return 'warn';
  return '';
};

/** 阶段名称 → 礼池水位百分比（与视觉一致） */
export const heatMap: Record<string, number> = {
  冰冻: 22,
  冷: 34,
  常温: 48,
  升温: 62,
  炽热: 76,
  沸腾: 88,
  过热: 96,
};

/** 不同阶段对应的鼓励语 */
export const cheerLines: Record<'low' | 'mid' | 'high', string[]> = {
  low: ['水花轻溅', '小确幸上岸', '池底有惊喜'],
  mid: ['不错的收获！', '礼池回应你了', '水面翻起金光'],
  high: ['大奖破水而出！', '热池爆发！', '传说浮现！'],
};

/** 依据礼物价值占比挑选鼓励语 */
export const pickCheer = (giftValue: number, maxGiftValue: number): string => {
  const ratio = Number(giftValue) / Math.max(1, maxGiftValue);
  const bag: string[] =
    ratio >= 0.55 ? cheerLines.high : ratio >= 0.2 ? cheerLines.mid : cheerLines.low;
  return bag[Math.floor(Math.random() * bag.length)];
};

/** 生成幂等订单号 */
export const newOrderId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};
