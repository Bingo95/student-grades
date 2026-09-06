import { useMemo, useState } from 'react';
import { useBoolean, useMemoizedFn } from 'ahooks';
import { Button, Dialog, Empty, TabBar, Toast } from 'antd-mobile';
import {
  EditSOutline,
  FolderOutline,
  HistogramOutline,
  UnorderedListOutline,
} from 'antd-mobile-icons';
import ExamDetailPopup from './components/ExamDetailPopup';
import ExamForm from './components/ExamForm';
import ImportExportPanel from './components/ImportExportPanel';
import OverviewCard from './components/OverviewCard';
import RecordCard from './components/RecordCard';
import TrendCard from './components/TrendCard';
import WeakSubjectCard from './components/WeakSubjectCard';
import useExamRecords from './hooks/useExamRecords';
import type { ExamFormValues, ExamRecord } from './types';
import { buildOverview } from './utils/analyze';
import './index.less';

/** 底部 tab */
const TAB = {
  RECORD: 'record',
  STATS: 'stats',
  INPUT: 'input',
  DATA: 'data',
} as const;

const TABS = [
  { key: TAB.RECORD, title: '记录', icon: <UnorderedListOutline /> },
  { key: TAB.STATS, title: '统计图', icon: <HistogramOutline /> },
  { key: TAB.INPUT, title: '分数录入', icon: <EditSOutline /> },
  { key: TAB.DATA, title: '导入导出', icon: <FolderOutline /> },
];

export default function Home() {
  const {
    records,
    list,
    addRecord,
    updateRecord,
    removeRecord,
    clearAll,
    replaceAll,
    mergeRecords,
  } = useExamRecords();

  const [activeTab, setActiveTab] = useState<string>(TAB.RECORD);

  /** 切换底部 tab，并滚动回页面顶部 */
  const switchTab = useMemoizedFn((key: string) => {
    setActiveTab(String(key));
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });
  /** 正在编辑的记录，null 表示新增 */
  const [editing, setEditing] = useState<ExamRecord | null>(null);
  /** 详情弹窗中的记录 */
  const [detail, setDetail] = useState<ExamRecord | null>(null);
  const [detailOpen, { setTrue: openDetail, setFalse: closeDetail }] = useBoolean(false);

  const summary = useMemo(() => buildOverview(records), [records]);

  /** 跳转到录入页，传入 record 则为编辑 */
  const goInput = useMemoizedFn((record: ExamRecord | null) => {
    setEditing(record);
    switchTab(TAB.INPUT);
  });

  const handleSubmit = useMemoizedFn((values: ExamFormValues) => {
    if (editing) {
      updateRecord(editing.id, values);
      Toast.show({ icon: 'success', content: '已更新' });
    } else {
      addRecord(values);
      Toast.show({ icon: 'success', content: '已保存' });
    }
    setEditing(null);
    switchTab(TAB.RECORD);
  });

  const handleDetail = useMemoizedFn((record: ExamRecord) => {
    setDetail(record);
    openDetail();
  });

  const handleDelete = useMemoizedFn((record: ExamRecord) => {
    Dialog.confirm({
      title: '删除记录',
      content: `确定删除「${record.name || '未命名考试'}」吗？删除后不可恢复`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: () => {
        removeRecord(record.id);
        if (detail?.id === record.id) closeDetail();
        Toast.show({ icon: 'success', content: '已删除' });
      },
    });
  });

  const handleEditFromDetail = useMemoizedFn((record: ExamRecord) => {
    closeDetail();
    goInput(record);
  });

  /** 详情弹窗对应的上一次考试（list 为倒序，后一条更早） */
  const detailIndex = detail ? list.findIndex((item) => item.id === detail.id) : -1;
  const detailPrev = detailIndex >= 0 ? list[detailIndex + 1] ?? null : null;

  const renderHeader = () => {
    const { latestClassRank, latestGradeRank } = summary;
    const rankParts: string[] = [];
    if (latestClassRank !== null) rankParts.push(`班级第 ${latestClassRank} 名`);
    if (latestGradeRank !== null) rankParts.push(`年级第 ${latestGradeRank} 名`);
    const rankText = rankParts.length ? `最近 ${rankParts.join(' / ')}` : '';
    return (
      <div className="sr-header">
        <div className="sr-header__main">
          <div className="sr-header__title">
            <div>
              <div>
                已记录 {records.length} 次考试
                <div>{rankText}</div>
              </div>
            </div>
            <div className="sr-header__add" onClick={() => goInput(null)}>
              + 新增
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecordTab = () => (
    <>
      {renderHeader()}
      {list.length ? (
        <div className="sr-list">
          {list.map((record, index) => (
            <RecordCard
              key={record.id}
              record={record}
              prev={list[index + 1] ?? null}
              onDetail={handleDetail}
              onEdit={goInput}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="sr-empty">
          <Empty description="还没有考试记录" />
        </div>
      )}
    </>
  );

  const renderStatsTab = () => (
    <>
      {renderHeader()}
      <OverviewCard summary={summary} />
      <TrendCard records={records} />
      <WeakSubjectCard records={records} />
    </>
  );

  const renderInputTab = () => (
    <ExamForm
      record={editing}
      onSubmit={handleSubmit}
      onCancel={() => {
        setEditing(null);
        switchTab(TAB.RECORD);
      }}
    />
  );

  const renderDataTab = () => (
    <>
      {renderHeader()}
      <ImportExportPanel
        records={records}
        onReplace={replaceAll}
        onMerge={mergeRecords}
        onClear={clearAll}
      />
    </>
  );

  return (
    <div className="sr-page">
      <div className="sr-page__body">
        {activeTab === TAB.RECORD && renderRecordTab()}
        {activeTab === TAB.STATS && renderStatsTab()}
        {activeTab === TAB.INPUT && renderInputTab()}
        {activeTab === TAB.DATA && renderDataTab()}
      </div>

      <div className="sr-tabbar">
        <TabBar activeKey={activeTab} onChange={(key) => switchTab(String(key))} safeArea>
          {TABS.map((item) => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>

      <ExamDetailPopup
        record={detail}
        prev={detailPrev}
        open={detailOpen}
        onClose={closeDetail}
        onEdit={handleEditFromDetail}
        onDelete={handleDelete}
      />
    </div>
  );
}
