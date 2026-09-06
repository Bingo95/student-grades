import type { OverviewSummary } from '../types';
import { toPercent } from '../utils/analyze';

export interface OverviewCardProps {
  summary: OverviewSummary;
}

interface StatProps {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  suffix?: string;
  caption?: string;
}

/** 变化量文案：正数为进步（绿），负数为退步（红） */
export const DeltaText = ({
  value,
  suffix = '',
  reverse = false,
}: {
  value?: number | null;
  suffix?: string;
  reverse?: boolean;
}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const positive = value > 0;
  const good = reverse ? !positive : positive;
  if (value === 0) return <span className="sr-delta sr-delta--flat">持平</span>;
  return (
    <span className={`sr-delta ${good ? 'sr-delta--up' : 'sr-delta--down'}`}>
      {positive ? '↑' : '↓'}
      {Math.abs(value)}
      {suffix}
    </span>
  );
};

const Stat = ({ label, value, delta, suffix, caption }: StatProps) => (
  <div className="sr-stat">
    <div className="sr-stat__value">
      {value}
      {suffix && <em>{suffix}</em>}
    </div>
    <div className="sr-stat__label">{label}</div>
    {delta !== undefined && delta !== null && (
      <div className="sr-stat__delta">
        <DeltaText value={delta} />
      </div>
    )}
    {caption && <div className="sr-stat__caption">{caption}</div>}
  </div>
);

/** 顶部概览卡片：考试次数 / 最近总分 / 平均总分 / 最高总分 + 排名 */
export default function OverviewCard({ summary }: OverviewCardProps) {
  const {
    examCount,
    latestTotal,
    avgTotal,
    bestTotal,
    bestTotalDate,
    latestRate,
    delta,
    latestClassRank,
    classRankDelta,
    latestClassRankDate,
    prevClassRankDate,
    latestGradeRank,
    gradeRankDelta,
    latestGradeRankDate,
    prevGradeRankDate,
  } = summary;

  return (
    <div className="sr-card">
      <div className="sr-card__head">
        <div className="sr-card__title">学习概览</div>
        {latestRate !== null && examCount > 0 && (
          <div className="sr-card__extra">最近得分率 {toPercent(latestRate)}</div>
        )}
      </div>

      <div className="sr-stat-grid">
        <Stat label="最近总分" value={latestTotal ?? '--'} delta={delta} />
        <Stat
          label="最高总分"
          value={bestTotal ?? '--'}
          caption={examCount > 1 && bestTotalDate ? bestTotalDate : undefined}
        />
      </div>

      <div className="sr-rank-row">
        <div className="sr-rank">
          <span className="sr-rank__label">最近班级排名</span>
          <span className="sr-rank__value">
            {latestClassRank !== null ? `第 ${latestClassRank} 名` : '未录入'}
          </span>
        </div>
        {classRankDelta !== null && classRankDelta !== 0 && (
          <div className="sr-rank__delta">
            较上次
            <DeltaText value={classRankDelta} suffix=" 名" />
          </div>
        )}
        {latestClassRankDate && prevClassRankDate && (
          <div className="sr-rank__dates">
            <span className="sr-rank__date">最近 {latestClassRankDate}</span>
            <span className="sr-rank__date">上次 {prevClassRankDate}</span>
          </div>
        )}
      </div>

      <div className="sr-rank-row">
        <div className="sr-rank">
          <span className="sr-rank__label">最近年级排名</span>
          <span className="sr-rank__value">
            {latestGradeRank !== null ? `第 ${latestGradeRank} 名` : '未录入'}
          </span>
        </div>
        {gradeRankDelta !== null && gradeRankDelta !== 0 && (
          <div className="sr-rank__delta">
            较上次
            <DeltaText value={gradeRankDelta} suffix=" 名" />
          </div>
        )}
        {latestGradeRankDate && prevGradeRankDate && (
          <div className="sr-rank__dates">
            <span className="sr-rank__date">最近 {latestGradeRankDate}</span>
            <span className="sr-rank__date">上次 {prevGradeRankDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
