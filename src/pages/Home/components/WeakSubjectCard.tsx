import { useMemo } from 'react';
import { FAIL_RATE, pickSubjectColor } from '../constants';
import type { ExamRecord, SubjectStat } from '../types';
import { analyzeSubjects, calcOverallRate, pickWeakSubjects, round1, toPercent } from '../utils/analyze';

export interface WeakSubjectCardProps {
  /** 考试成绩（升序） */
  records: ExamRecord[];
}

/** 进度条配色：越低越偏暖色 */
const pickRateColor = (rate: number): string => {
  if (rate < FAIL_RATE) return '#ff3b30';
  if (rate < 0.7) return '#ff9500';
  return '#34c759';
};

const WeakItem = ({ stat, overallRate }: { stat: SubjectStat; overallRate: number }) => {
  const gap = round1((stat.avgRate - overallRate) * 100);
  const color = pickRateColor(stat.avgRate);
  return (
    <div className="sr-weak">
      <div className="sr-weak__head">
        <span className="sr-weak__name">
          <i className="sr-dot" style={{ background: pickSubjectColor(stat.name) }} />
          {stat.name}
        </span>
        <span className="sr-weak__rate" style={{ color }}>
          {toPercent(stat.avgRate)}
        </span>
      </div>
      <div className="sr-bar">
        <div
          className="sr-bar__fill"
          style={{ width: `${Math.min(stat.avgRate * 100, 100)}%`, background: color }}
        />
      </div>
      <div className="sr-weak__foot">
        <span>
          平均 {stat.avgScore} / {stat.fullScore}
        </span>
        <span className={gap < 0 ? 'sr-text-down' : 'sr-text-up'}>
          {gap >= 0 ? '高于' : '低于'}整体 {Math.abs(gap)}%
        </span>
      </div>
    </div>
  );
};

/** 弱势学科卡片：按平均得分率找出偏低科目 */
export default function WeakSubjectCard({ records }: WeakSubjectCardProps) {
  const stats = useMemo(() => analyzeSubjects(records), [records]);
  const overallRate = useMemo(() => calcOverallRate(records), [records]);
  const weakList = useMemo(() => pickWeakSubjects(stats, overallRate), [stats, overallRate]);

  return (
    <div className="sr-card">
      <div className="sr-card__head">
        <div className="sr-card__title">弱势学科</div>
        {stats.length > 0 && (
          <div className="sr-card__extra">整体平均得分率 {toPercent(overallRate)}</div>
        )}
      </div>

      {!stats.length ? (
        <div className="sr-empty-hint">录入学科分数后，自动帮你找出偏科科目</div>
      ) : !weakList.length ? (
        <div className="sr-empty-hint">目前各科发展均衡，继续保持 👏</div>
      ) : (
        <>
          <div className="sr-tip">
            建议优先提升：<b>{weakList.slice(0, 2).map((item) => item.name).join('、')}</b>
          </div>
          {weakList.map((item) => (
            <WeakItem key={item.name} stat={item} overallRate={overallRate} />
          ))}
        </>
      )}
    </div>
  );
}
