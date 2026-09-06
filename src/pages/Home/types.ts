/** 单科成绩 */
export interface SubjectScore {
  /** 学科名称 */
  name: string;
  /** 得分，null 表示本次未录入 */
  score: number | null;
  /** 该科满分 */
  fullScore: number;
}

/** 一次考试记录 */
export interface ExamRecord {
  /** 唯一 id */
  id: string;
  /** 考试名称 */
  name: string;
  /** 考试日期 YYYY-MM-DD */
  date: string;
  /** 各学科分数 */
  subjects: SubjectScore[];
  /** 班级排名 */
  classRank: number | null;
  /** 年级排名 */
  gradeRank: number | null;
  /** 创建时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt: number;
}

/** 表单提交数据（去掉由程序生成的字段） */
export type ExamFormValues = Omit<ExamRecord, 'id' | 'createdAt' | 'updatedAt'>;

/** 单科统计结果 */
export interface SubjectStat {
  /** 学科名称 */
  name: string;
  /** 满分 */
  fullScore: number;
  /** 平均得分 */
  avgScore: number;
  /** 平均得分率 0~1 */
  avgRate: number;
  /** 最近一次得分 */
  latestScore: number | null;
  /** 最好一次得分 */
  bestScore: number | null;
  /** 最近一次相比上一次的变化（正为进步） */
  delta: number | null;
  /** 有效样本次数 */
  count: number;
}

/** 趋势图的一个点 */
export interface TrendPoint {
  /** x 轴文案 */
  label: string;
  /** y 轴数值 */
  value: number;
  /** 完整考试名称（tooltip 用） */
  fullName: string;
  /** 考试日期 */
  date: string;
}

/** 顶部概览数据 */
export interface OverviewSummary {
  /** 考试次数 */
  examCount: number;
  /** 最近一次总分 */
  latestTotal: number | null;
  /** 平均总分 */
  avgTotal: number;
  /** 历史最高总分 */
  bestTotal: number | null;
  /** 历史最高总分对应的考试日期（多条数据时用于展示） */
  bestTotalDate: string | null;
  /** 最近一次得分率 */
  latestRate: number | null;
  /** 最近一次相比上一次的总分变化 */
  delta: number | null;
  /** 最近一次班级排名 */
  latestClassRank: number | null;
  /** 班级排名变化（正为前进名次数） */
  classRankDelta: number | null;
  /** 最近一次班级排名对应的考试日期 */
  latestClassRankDate: string | null;
  /** 上一次班级排名对应的考试日期 */
  prevClassRankDate: string | null;
  /** 最近一次年级排名 */
  latestGradeRank: number | null;
  /** 年级排名变化（正为前进名次数） */
  gradeRankDelta: number | null;
  /** 最近一次年级排名对应的考试日期 */
  latestGradeRankDate: string | null;
  /** 上一次年级排名对应的考试日期 */
  prevGradeRankDate: string | null;
}
