import { pickSubjectColor } from '../constants';
import type { ExamRecord } from '../types';
import { calcFullTotal, calcRate, calcTotal, round1, toPercent } from '../utils/analyze';
import { DeltaText } from './OverviewCard';
import './RecordCard.less';

export interface RecordCardProps {
  /** 当前记录 */
  record: ExamRecord;
  /** 上一次考试（时间更早），用于计算环比 */
  prev?: ExamRecord | null;
  /** 点击卡片或「查看详情」 */
  onDetail?: (record: ExamRecord) => void;
  onEdit?: (record: ExamRecord) => void;
  onDelete?: (record: ExamRecord) => void;
}

/** 单条考试记录卡片：底部并排展示 查看详情 / 编辑 / 删除 */
export default function RecordCard({ record, prev, onDetail, onEdit, onDelete }: RecordCardProps) {
  const total = calcTotal(record);
  const fullTotal = calcFullTotal(record);
  const rate = calcRate(record);
  const delta = prev ? round1(total - calcTotal(prev)) : null;

  /** 各学科相比上一次考试的变化 */
  const subjectDeltaMap = new Map<string, number | null>();
  if (prev) {
    (prev.subjects || []).forEach((item) => {
      if (typeof item.score !== 'number') return;
      const current = (record.subjects || []).find((s) => s.name === item.name);
      if (current && typeof current.score === 'number') {
        subjectDeltaMap.set(item.name, round1(current.score - item.score));
      }
    });
  }

  return (
    <div className="sr-card sr-record" onClick={() => onDetail?.(record)}>
      <div className="sr-record__head">
        <div className="sr-record__main">
          <div className="sr-record__name">{record.name || '未命名考试'}</div>
          <div className="sr-record__date">{record.date}</div>
        </div>
        <div className="sr-record__score">
          <span className="sr-record__total">{total}</span>
          <span className="sr-record__unit">分</span>
          <div className="sr-record__delta">
            <DeltaText value={delta} />
          </div>
        </div>
      </div>

      <div className="sr-record__meta">
        <span>得分率 {fullTotal ? toPercent(rate) : '--'}</span>
        {record.classRank !== null && <span>班级 第{record.classRank}名</span>}
        {record.gradeRank !== null && <span>年级 第{record.gradeRank}名</span>}
      </div>

      <div className="sr-subject-grid">
        {(record.subjects || [])
          .filter((item) => typeof item.score === 'number')
          .map((item) => (
            <div className="sr-subject" key={item.name}>
              <i className="sr-dot" style={{ background: pickSubjectColor(item.name) }} />
              <span className="sr-subject__name">{item.name}</span>
              <span className="sr-subject__score">{item.score}</span>
              {subjectDeltaMap.has(item.name) && (
                <DeltaText value={subjectDeltaMap.get(item.name) ?? null} />
              )}
            </div>
          ))}
      </div>

      <div className="sr-record__actions">
        <div
          className="sr-record__action"
          onClick={(e) => {
            e.stopPropagation();
            onDetail?.(record);
          }}
        >
          查看详情
        </div>
        <div
          className="sr-record__action sr-record__action--edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(record);
          }}
        >
          编辑
        </div>
        <div
          className="sr-record__action sr-record__action--danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(record);
          }}
        >
          删除
        </div>
      </div>
    </div>
  );
}
