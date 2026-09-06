import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarPicker } from 'antd-mobile';
import LineChart from '@/components/Chart/LineChart';
import { CHART_COLOR, pickSubjectColor } from '../constants';
import type { ExamRecord } from '../types';
import { analyzeSubjects, buildSubjectTrend, buildTotalTrend, formatDate } from '../utils/analyze';

export interface TrendCardProps {
  /** 考试成绩（升序） */
  records: ExamRecord[];
}

const TOTAL_KEY = '__total__';
const MIN_DATE = new Date(2000, 0, 1);
const MAX_DATE = new Date(new Date().getFullYear() + 1, 11, 31);

/** 把 YYYY-MM-DD 压缩成 MM/DD，用于筛选器与图标展示 */
const fmtShort = (value: string | null): string => (value ? dayjs(value).format('MM/DD') : '');

/** 分数趋势卡片：支持切换总分 / 单科，并支持自定义时间区间筛选 */
export default function TrendCard({ records }: TrendCardProps) {
  const [active, setActive] = useState<string>(TOTAL_KEY);
  /** 时间区间（YYYY-MM-DD），null 表示该端不限制 */
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const [filterOpen, setFilterOpen] = useState(false);
  /** 日历当前选中区间（打开弹窗时用已选区间初始化） */
  const [calValue, setCalValue] = useState<[Date, Date] | null>(null);

  useEffect(() => {
    if (filterOpen) {
      setCalValue(
        range.start && range.end
          ? [dayjs(range.start).toDate(), dayjs(range.end).toDate()]
          : null,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOpen]);

  /** 按时间区间筛选（ISO 日期可直接按字符串比较） */
  const filtered = useMemo(() => {
    const { start, end } = range;
    if (!start && !end) return records;
    return records.filter((r) => (!start || r.date >= start) && (!end || r.date <= end));
  }, [records, range]);

  const subjects = useMemo(() => analyzeSubjects(records), [records]);

  const data = useMemo(
    () => (active === TOTAL_KEY ? buildTotalTrend(filtered) : buildSubjectTrend(filtered, active)),
    [filtered, active],
  );

  const color = active === TOTAL_KEY ? CHART_COLOR : pickSubjectColor(active);

  const options = [
    { key: TOTAL_KEY, name: '总分', color: CHART_COLOR },
    ...subjects.map((item) => ({ key: item.name, name: item.name, color: pickSubjectColor(item.name) })),
  ];

  const hasRange = !!(range.start || range.end);
  const rangeLabel = hasRange
    ? `${fmtShort(range.start) || '…'} - ${fmtShort(range.end) || '…'}`
    : '全部时间';

  /** 点「确定」写回区间；清空（allowClear）则与「全部时间」等价 */
  const confirmRange = (val: [Date, Date] | null) => {
    setRange(
      val
        ? { start: formatDate(val[0]), end: formatDate(val[1]) }
        : { start: null, end: null },
    );
    setFilterOpen(false);
  };

  const closeFilter = () => setFilterOpen(false);

  return (
    <div className="sr-card">
      <div className="sr-card__head">
        <div className="sr-card__title">分数趋势</div>
        <div className="sr-trend__head-right">
          <span className="sr-card__extra">{filtered.length} 次记录</span>
          <div
            className={`sr-trend__filter${hasRange ? ' sr-trend__filter--active' : ''}`}
            onClick={() => setFilterOpen(true)}
          >
            {rangeLabel}
          </div>
        </div>
      </div>

      <div className="sr-scroll-chips">
        {options.map((item) => (
          <div
            key={item.key}
            className={`sr-chip${active === item.key ? ' sr-chip--active' : ''}`}
            style={
              active === item.key ? { background: item.color, borderColor: item.color } : undefined
            }
            onClick={() => setActive(item.key)}
          >
            {item.name}
          </div>
        ))}
      </div>

      {data.length ? (
        <LineChart boxId="home-trend-chart" data={data} color={color} height={200} />
      ) : (
        <div className="sr-empty-hint">
          {records.length
            ? '该时间区间内暂无记录，换个范围或学科看看'
            : '记录 1 次考试后即可看到趋势'}
        </div>
      )}

      <CalendarPicker
        visible={filterOpen}
        title="选择时间区间"
        confirmText="确定"
        selectionMode="range"
        value={calValue}
        onChange={setCalValue}
        onConfirm={confirmRange}
        onClose={closeFilter}
        onMaskClick={closeFilter}
        min={MIN_DATE}
        max={MAX_DATE}
      />
    </div>
  );
}
