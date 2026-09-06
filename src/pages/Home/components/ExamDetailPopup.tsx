import { Button } from 'antd-mobile';
import CenterPopup from '@/components/CenterPopup';
import { pickSubjectColor } from '../constants';
import type { ExamRecord } from '../types';
import { calcFullTotal, calcRate, calcTotal, round1, toPercent } from '../utils/analyze';
import { DeltaText } from './OverviewCard';

export interface ExamDetailPopupProps {
  /** 当前记录，null 时不展示 */
  record: ExamRecord | null;
  /** 上一次考试（时间更早），用于计算环比 */
  prev?: ExamRecord | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (record: ExamRecord) => void;
  onDelete?: (record: ExamRecord) => void;
}

/** 考试记录详情弹窗：展示完整分数、得分率、环比与操作入口 */
export default function ExamDetailPopup({
  record,
  prev,
  open,
  onClose,
  onEdit,
  onDelete,
}: ExamDetailPopupProps) {
  if (!record) return null;

  const total = calcTotal(record);
  const fullTotal = calcFullTotal(record);
  const rate = calcRate(record);
  const delta = prev ? round1(total - calcTotal(prev)) : null;

  const prevScoreMap = new Map<string, number>();
  (prev?.subjects || []).forEach((item) => {
    if (typeof item.score === 'number') prevScoreMap.set(item.name, item.score);
  });

  return (
    <CenterPopup open={open} onClose={onClose}>
      <div className="sr-detail">
        <div className="sr-detail__head">
          <div className="sr-detail__name">{record.name || '未命名考试'}</div>
          <div className="sr-detail__date">{record.date}</div>
        </div>

        <div className="sr-detail__summary">
          <div className="sr-detail__total">
            <span className="sr-detail__num">{total}</span>
            <span className="sr-detail__unit">总分</span>
          </div>
          <div className="sr-detail__rates">
            <div>
              得分率 <b>{fullTotal ? toPercent(rate) : '--'}</b>
            </div>
            <div>
              满分合计 <b>{fullTotal}</b>
            </div>
            <div className="sr-detail__delta">
              较上次 <DeltaText value={delta} />
            </div>
          </div>
        </div>

        <div className="sr-detail__rank">
          <div className="sr-detail__rank-item">
            <span>班级排名</span>
            <b>{record.classRank !== null ? `第 ${record.classRank} 名` : '--'}</b>
          </div>
          <div className="sr-detail__rank-item">
            <span>年级排名</span>
            <b>{record.gradeRank !== null ? `第 ${record.gradeRank} 名` : '--'}</b>
          </div>
        </div>

        <div className="sr-detail__title">学科明细</div>
        <div className="sr-detail__subjects">
          {(record.subjects || []).map((item) => {
            const subjectRate = item.fullScore > 0 ? (item.score || 0) / item.fullScore : 0;
            const prevScore = prevScoreMap.get(item.name);
            return (
              <div className="sr-detail__subject" key={item.name}>
                <div className="sr-detail__subject-head">
                  <span className="sr-detail__subject-name">
                    <i className="sr-dot" style={{ background: pickSubjectColor(item.name) }} />
                    {item.name}
                  </span>
                  <span className="sr-detail__subject-score">
                    {item.score === null ? '--' : item.score}
                    <em>/{item.fullScore}</em>
                    {prevScore !== undefined && item.score !== null && (
                      <DeltaText value={round1(item.score - prevScore)} />
                    )}
                  </span>
                </div>
                <div className="sr-bar">
                  <div
                    className="sr-bar__fill"
                    style={{
                      width: `${Math.min(subjectRate * 100, 100)}%`,
                      background: pickSubjectColor(item.name),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="sr-detail__footer">
          <Button block color="primary" className="sr-detail__btn" onClick={() => onEdit?.(record)}>
            编辑
          </Button>
        </div>
        <div className="sr-detail__close" onClick={onClose}>
          关闭
        </div>
      </div>
    </CenterPopup>
  );
}
