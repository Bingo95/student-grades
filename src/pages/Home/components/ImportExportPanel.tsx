import { useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { Button, Dialog, Toast } from 'antd-mobile';
import dayjs from 'dayjs';
import type { ExamRecord } from '../types';
import { normalizeRecords } from '../hooks/useExamRecords';
import './ImportExportPanel.less';

export interface ImportExportPanelProps {
  /** 当前全部记录 */
  records: ExamRecord[];
  /** 覆盖导入 */
  onReplace: (list: ExamRecord[]) => void;
  /** 合并导入 */
  onMerge: (list: ExamRecord[]) => void;
  /** 清空全部数据 */
  onClear: () => void;
}

type ImportMode = 'replace' | 'merge';

const readFileText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

/** 数据导入导出：导出为本地 JSON 文件 / 从 JSON 文件导入 / 清空数据 */
export default function ImportExportPanel({
  records,
  onReplace,
  onMerge,
  onClear,
}: ImportExportPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modeRef = useRef<ImportMode>('merge');
  const [fileName, setFileName] = useState('');

  const fileSize = useMemoizedFn(() => {
    const bytes = new Blob([JSON.stringify(records)]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  });

  /** 导出为 JSON 文件并保存到本地 */
  const handleExport = useMemoizedFn(() => {
    if (!records.length) {
      Toast.show({ content: '暂无数据可导出' });
      return;
    }
    const content = JSON.stringify(records, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `考试成绩记录_${dayjs().format('YYYYMMDD_HHmm')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Toast.show({ icon: 'success', content: '已导出到本地' });
  });

  /** 选择本地 JSON 文件 */
  const handlePickFile = useMemoizedFn((mode: ImportMode) => {
    modeRef.current = mode;
    inputRef.current?.click();
  });

  const handleFileChange = useMemoizedFn(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 允许重复选择同一个文件
    event.target.value = '';
    if (!file) return;
    try {
      const text = await readFileText(file);
      const parsed = JSON.parse(text);
      const raw = Array.isArray(parsed) ? parsed : parsed?.records;
      if (!Array.isArray(raw)) {
        Toast.show({ content: '文件格式不正确' });
        return;
      }
      const list = normalizeRecords(JSON.stringify(raw));
      if (!list.length) {
        Toast.show({ content: '未解析到有效的考试记录' });
        return;
      }
      setFileName(file.name);
      if (modeRef.current === 'replace') {
        Dialog.confirm({
          content: `覆盖导入 ${list.length} 条记录？当前 ${records.length} 条数据将被替换`,
          confirmText: '覆盖导入',
          cancelText: '取消',
          onConfirm: () => {
            onReplace(list);
            Toast.show({ icon: 'success', content: `已导入 ${list.length} 条` });
          },
        });
      } else {
        onMerge(list);
        Toast.show({ icon: 'success', content: `已合并 ${list.length} 条` });
      }
    } catch (error) {
      console.warn('[ImportExportPanel] 导入失败', error);
      Toast.show({ content: '文件解析失败，请选择正确的 JSON 文件' });
    }
  });

  const handleClear = useMemoizedFn(() => {
    if (!records.length) {
      Toast.show({ content: '当前没有数据' });
      return;
    }
    Dialog.confirm({
      content: '确定清空全部考试记录吗？该操作不可恢复，建议先导出备份',
      confirmText: '清空',
      cancelText: '取消',
      onConfirm: () => {
        onClear();
        setFileName('');
        Toast.show({ icon: 'success', content: '已清空' });
      },
    });
  });

  return (
    <div className="sr-io">
      <div className="sr-card">
        <div className="sr-card__head">
          <div className="sr-card__title">当前数据</div>
          <div className="sr-card__extra">保存在本机浏览器</div>
        </div>
        <div className="sr-io__stats">
          <div className="sr-io__stat">
            <b>{records.length}</b>
            <span>考试记录</span>
          </div>
          <div className="sr-io__stat">
            <b>{fileSize()}</b>
            <span>数据体积</span>
          </div>
        </div>
      </div>

      <div className="sr-card">
        <div className="sr-card__head">
          <div className="sr-card__title">导出</div>
        </div>
        <div className="sr-io__desc">
          把全部考试记录导出为 JSON 文件保存到本地，可用于备份或在其它设备导入。
        </div>
        <Button block color="primary" className="sr-btn" onClick={handleExport}>
          导出为 JSON 文件
        </Button>
      </div>

      <div className="sr-card">
        <div className="sr-card__head">
          <div className="sr-card__title">导入</div>
        </div>
        <div className="sr-io__desc">
          选择之前导出的 JSON 文件。合并导入会保留双方数据（同一条以更新时间更晚的为准），覆盖导入会替换当前全部数据。
        </div>
        <div className="sr-io__actions">
          <Button block color="primary" className="sr-btn" onClick={() => handlePickFile('merge')}>
            合并导入
          </Button>
          <Button block className="sr-btn sr-btn--plain" onClick={() => handlePickFile('replace')}>
            覆盖导入
          </Button>
        </div>
        {fileName && <div className="sr-io__file">最近导入：{fileName}</div>}
      </div>

      <div className="sr-card">
        <div className="sr-card__head">
          <div className="sr-card__title">危险操作</div>
        </div>
        <Button block className="sr-btn sr-btn--danger" onClick={handleClear}>
          清空全部数据
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-io__input"
        onChange={handleFileChange}
      />
    </div>
  );
}
