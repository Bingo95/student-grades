import type { SubjectScore } from './types';

/** 本地存储的 key（带版本号，方便后续数据结构升级） */
export const STORAGE_KEY = 'student-record:exam-records:v1';

/** 预设学科及其满分 */
export interface SubjectPreset {
  name: string;
  fullScore: number;
}

export const PRESET_SUBJECTS: SubjectPreset[] = [
  { name: '语文', fullScore: 150 },
  { name: '数学', fullScore: 150 },
  { name: '英语', fullScore: 150 },
  { name: '物理', fullScore: 100 },
  { name: '化学', fullScore: 100 },
  { name: '生物', fullScore: 100 },
];

/** 自定义学科默认满分 */
export const CUSTOM_FULL_SCORE = 100;

/** 低于整体平均得分率 3 个百分点 → 判定为偏弱 */
export const WEAK_RATE_OFFSET = 0.03;

/** 得分率低于 60% → 判定为薄弱 */
export const FAIL_RATE = 0.6;

/** 学科配色（按名称哈希取，保证每次渲染颜色稳定，不闪烁） */
export const SUBJECT_COLORS = [
  '#007aff',
  '#ff9500',
  '#34c759',
  '#ff3b30',
  '#af52de',
  '#5ac8fa',
  '#ff2d55',
  '#5856d6',
];

/** 折线图主色 */
export const CHART_COLOR = '#007aff';

/** 创建一个空的学科分数项 */
export const createSubject = (name: string, fullScore: number): SubjectScore => ({
  name,
  score: null,
  fullScore,
});

/** 按学科名称稳定取色（避免使用随机数导致刷新时颜色跳变） */
export const pickSubjectColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  }
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
};
