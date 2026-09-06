import { useLocalStorageState, useMemoizedFn } from 'ahooks';
import { useMemo } from 'react';
import { STORAGE_KEY } from '../constants';
import type { ExamFormValues, ExamRecord, SubjectScore } from '../types';
import { createId, sortByDateAsc, toNumber } from '../utils/analyze';

/** 容错解析本地数据：结构损坏 / 字段缺失时尽量修复，实在不行返回空数组 */
export const normalizeRecords = (raw: string): ExamRecord[] => {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object' && item.id && item.date)
      .map((item) => ({
        id: String(item.id),
        name: String(item.name || ''),
        date: String(item.date || ''),
        subjects: (Array.isArray(item.subjects) ? item.subjects : []).map((s: SubjectScore) => ({
          name: String(s?.name || ''),
          score: toNumber(s?.score),
          fullScore: toNumber(s?.fullScore) || 100,
        })),
        classRank: toNumber(item.classRank),
        gradeRank: toNumber(item.gradeRank),
        createdAt: toNumber(item.createdAt) || 0,
        updatedAt: toNumber(item.updatedAt) || 0,
      }));
  } catch (error) {
    console.warn('[useExamRecords] 本地数据解析失败，已重置为空', error);
    return [];
  }
};

/**
 * 考试成绩本地存储 hook（基于 ahooks useLocalStorageState）
 * - 数据统一按「考试时间升序」存放，图表可直接消费
 * - list 为倒序（最新在前），用于列表展示
 */
export default function useExamRecords() {
  const [records, setRecords] = useLocalStorageState<ExamRecord[]>(STORAGE_KEY, {
    defaultValue: [],
    serializer: (value) => JSON.stringify(value ?? []),
    deserializer: normalizeRecords,
    onError: (error) => console.warn('[useExamRecords] 读写本地数据失败', error),
  });

  const safeRecords = useMemo(() => (Array.isArray(records) ? records : []), [records]);

  const addRecord = useMemoizedFn((values: ExamFormValues) => {
    const now = Date.now();
    const record: ExamRecord = { ...values, id: createId(), createdAt: now, updatedAt: now };
    setRecords((prev) => sortByDateAsc([...(prev || []), record]));
    return record;
  });

  const updateRecord = useMemoizedFn((id: string, values: ExamFormValues) => {
    setRecords((prev) =>
      sortByDateAsc(
        (prev || []).map((item) =>
          item.id === id ? { ...item, ...values, updatedAt: Date.now() } : item,
        ),
      ),
    );
  });

  const removeRecord = useMemoizedFn((id: string) => {
    setRecords((prev) => (prev || []).filter((item) => item.id !== id));
  });

  const clearAll = useMemoizedFn(() => setRecords([]));

  /** 覆盖导入：用外部数据替换本地全部记录 */
  const replaceAll = useMemoizedFn((next: ExamRecord[]) => setRecords(sortByDateAsc(next || [])));

  /** 合并导入：同 id 保留更新时间更晚的一条 */
  const mergeRecords = useMemoizedFn((incoming: ExamRecord[]) => {
    setRecords((prev) => {
      const map = new Map<string, ExamRecord>();
      (prev || []).forEach((item) => map.set(item.id, item));
      (incoming || []).forEach((item) => {
        const exist = map.get(item.id);
        if (!exist || (item.updatedAt || 0) >= (exist.updatedAt || 0)) map.set(item.id, item);
      });
      return sortByDateAsc(Array.from(map.values()));
    });
  });

  /** 列表展示用：最新考试排在最前 */
  const list = useMemo(() => [...safeRecords].reverse(), [safeRecords]);

  return {
    records: safeRecords,
    list,
    addRecord,
    updateRecord,
    removeRecord,
    clearAll,
    replaceAll,
    mergeRecords,
  };
}
