import dayjs from 'dayjs';
import { FAIL_RATE, PRESET_SUBJECTS, WEAK_RATE_OFFSET } from '../constants';
import type { ExamRecord, OverviewSummary, SubjectStat, TrendPoint } from '../types';

/** 生成唯一 id */
export const createId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** 统一格式化日期 */
export const formatDate = (value: string | Date | null | undefined): string =>
  value ? dayjs(value).format('YYYY-MM-DD') : '';

/** 数字安全解析，非法值返回 null */
export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
};

/** 保留一位小数 */
export const round1 = (value: number): number => Math.round(value * 10) / 10;

/** 百分比文案，如 85.5% */
export const toPercent = (rate: number, fractionDigits = 1): string =>
  `${(rate * 100).toFixed(fractionDigits)}%`;

/** 总分（只统计已录入分数的学科） */
export const calcTotal = (record: ExamRecord): number =>
  (record.subjects || []).reduce(
    (sum, item) => sum + (typeof item.score === 'number' ? item.score : 0),
    0,
  );

/** 本次考试参与统计的满分合计 */
export const calcFullTotal = (record: ExamRecord): number =>
  (record.subjects || []).reduce(
    (sum, item) => sum + (typeof item.score === 'number' ? item.fullScore : 0),
    0,
  );

/** 本次考试得分率 */
export const calcRate = (record: ExamRecord): number => {
  const full = calcFullTotal(record);
  return full > 0 ? calcTotal(record) / full : 0;
};

/** 按考试时间升序（同一天按创建时间） */
export const sortByDateAsc = (list: ExamRecord[]): ExamRecord[] =>
  [...list].sort((a, b) => {
    if (a.date === b.date) return a.createdAt - b.createdAt;
    return a.date < b.date ? -1 : 1;
  });

/** 构建总分趋势数据（x 轴为考试日期） */
export const buildTotalTrend = (records: ExamRecord[]): TrendPoint[] =>
  sortByDateAsc(records).map((record) => ({
    label: record.date ? dayjs(record.date).format('YY/MM/DD') : '',
    value: round1(calcTotal(record)),
    fullName: record.name || formatDate(record.date),
    date: record.date,
  }));

/** 构建单科趋势数据（跳过未录入的考试，x 轴为考试日期） */
export const buildSubjectTrend = (records: ExamRecord[], subject: string): TrendPoint[] =>
  sortByDateAsc(records)
    .map((record) => {
      const hit = (record.subjects || []).find((item) => item.name === subject);
      if (!hit || typeof hit.score !== 'number') return null;
      return {
        label: record.date ? dayjs(record.date).format('YY/MM/DD') : '',
        value: round1(hit.score),
        fullName: record.name || formatDate(record.date),
        date: record.date,
      } as TrendPoint;
    })
    .filter(Boolean) as TrendPoint[];

/**
 * 学科统计：按「首次出现顺序」返回（语数英 → 物化生 → 自定义）
 * 只统计录入了分数的记录
 */
export const analyzeSubjects = (records: ExamRecord[]): SubjectStat[] => {
  const ordered = sortByDateAsc(records);
  const map = new Map<string, SubjectStat>();

  const presetOrder = PRESET_SUBJECTS.map((item) => item.name);

  ordered.forEach((record) => {
    (record.subjects || []).forEach((item) => {
      if (typeof item.score !== 'number') return;
      const stat = map.get(item.name) || {
        name: item.name,
        fullScore: item.fullScore,
        avgScore: 0,
        avgRate: 0,
        latestScore: null,
        bestScore: null,
        delta: null,
        count: 0,
      };
      // 最近一次的前一次即上一次，用于计算进退步
      const prev = stat.latestScore;
      stat.delta = prev === null ? null : round1(item.score - prev);
      stat.latestScore = item.score;
      stat.bestScore = stat.bestScore === null ? item.score : Math.max(stat.bestScore, item.score);
      stat.avgScore = round1((stat.avgScore * stat.count + item.score) / (stat.count + 1));
      stat.count += 1;
      stat.fullScore = item.fullScore;
      map.set(item.name, stat);
    });
  });

  const list = Array.from(map.values());
  list.forEach((item) => {
    item.avgRate = item.fullScore > 0 ? item.avgScore / item.fullScore : 0;
  });

  // 预设学科按配置顺序，自定义学科按出现顺序排在后面
  return list.sort((a, b) => {
    const ia = presetOrder.indexOf(a.name);
    const ib = presetOrder.indexOf(b.name);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
};

/** 整体平均得分率（总分 / 满分合计） */
export const calcOverallRate = (records: ExamRecord[]): number => {
  let total = 0;
  let full = 0;
  sortByDateAsc(records).forEach((record) => {
    total += calcTotal(record);
    full += calcFullTotal(record);
  });
  return full > 0 ? total / full : 0;
};

/** 弱势学科：得分率低于整体平均一定幅度，或低于及格线 */
export const pickWeakSubjects = (stats: SubjectStat[], overallRate: number): SubjectStat[] => {
  const threshold = overallRate - WEAK_RATE_OFFSET;
  return stats
    .filter((item) => item.avgRate < threshold || item.avgRate < FAIL_RATE)
    .sort((a, b) => a.avgRate - b.avgRate);
};

/** 顶部概览统计 */
export const buildOverview = (records: ExamRecord[]): OverviewSummary => {
  const ordered = sortByDateAsc(records);
  const totals = ordered.map(calcTotal);
  const latest = ordered[ordered.length - 1];
  const prev = ordered[ordered.length - 2];

  // 历史最高总分对应的考试记录（同分时取较晚的一次）
  const bestRecord = ordered.reduce<ExamRecord | null>((best, item) => {
    const itemTotal = calcTotal(item);
    if (!best) return item;
    const bestTotal = calcTotal(best);
    if (itemTotal > bestTotal) return item;
    if (
      itemTotal === bestTotal &&
      (item.date > best.date || (item.date === best.date && item.createdAt > best.createdAt))
    ) {
      return item;
    }
    return best;
  }, null);

  const classRanks = ordered
    .map((item) => item.classRank)
    .filter((v): v is number => typeof v === 'number');
  const latestClassRank = classRanks.length ? classRanks[classRanks.length - 1] : null;
  const prevClassRank = classRanks.length > 1 ? classRanks[classRanks.length - 2] : null;

  const gradeRanks = ordered
    .map((item) => item.gradeRank)
    .filter((v): v is number => typeof v === 'number');
  const latestGradeRank = gradeRanks.length ? gradeRanks[gradeRanks.length - 1] : null;
  const prevGradeRank = gradeRanks.length > 1 ? gradeRanks[gradeRanks.length - 2] : null;

  // 最近一次 / 上一次排名对应的考试日期（取录入了该排名的记录序列的末位与前一位）
  const getRankDates = (key: 'classRank' | 'gradeRank'): { latest: string | null; prev: string | null } => {
    const dates = ordered.filter((item) => typeof item[key] === 'number').map((item) => item.date);
    return {
      latest: dates.length ? dates[dates.length - 1] : null,
      prev: dates.length > 1 ? dates[dates.length - 2] : null,
    };
  };
  const classRankDates = getRankDates('classRank');
  const gradeRankDates = getRankDates('gradeRank');
  const latestClassRankDate = classRankDates.latest;
  const prevClassRankDate = classRankDates.prev;
  const latestGradeRankDate = gradeRankDates.latest;
  const prevGradeRankDate = gradeRankDates.prev;

  return {
    examCount: ordered.length,
    latestTotal: latest ? calcTotal(latest) : null,
    avgTotal: totals.length ? round1(totals.reduce((a, b) => a + b, 0) / totals.length) : 0,
    bestTotal: totals.length ? Math.max(...totals) : null,
    bestTotalDate: bestRecord ? bestRecord.date : null,
    latestRate: latest ? calcRate(latest) : null,
    delta: latest && prev ? round1(calcTotal(latest) - calcTotal(prev)) : null,
    latestClassRank,
    // 排名越小越好，正数代表前进了多少名
    classRankDelta:
      latestClassRank !== null && prevClassRank !== null ? prevClassRank - latestClassRank : null,
    latestClassRankDate,
    prevClassRankDate,
    latestGradeRank,
    gradeRankDelta:
      latestGradeRank !== null && prevGradeRank !== null ? prevGradeRank - latestGradeRank : null,
    latestGradeRankDate,
    prevGradeRankDate,
  };
};
