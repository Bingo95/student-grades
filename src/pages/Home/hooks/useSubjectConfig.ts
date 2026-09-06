import { useLocalStorageState, useMemoizedFn } from 'ahooks';
import { useMemo } from 'react';
import { CUSTOM_FULL_SCORE, PRESET_SUBJECTS } from '../constants';

/** 本地存储的 key（带版本号） */
const CONFIG_KEY = 'student-record:subject-config:v1';

export interface SubjectConfig {
  /** 学科名称 → 满分（含预设学科，可自定义） */
  fullScores: Record<string, number>;
  /** 自定义学科名称（持久常驻） */
  customNames: string[];
}

/** 预设学科的默认满分配置 */
const seed = (): SubjectConfig => ({
  fullScores: PRESET_SUBJECTS.reduce<Record<string, number>>((acc, item) => {
    acc[item.name] = item.fullScore;
    return acc;
  }, {}),
  customNames: [],
});

/**
 * 学科配置：满分可自定义 + 自定义学科常驻
 * - fullScores 覆盖预设学科的默认满分，也保存自定义学科的满分
 * - customNames 保存「曾经录入过的自定义学科」，跨记录持久存在
 */
export default function useSubjectConfig() {
  const [config, setConfig] = useLocalStorageState<SubjectConfig>(CONFIG_KEY, {
    defaultValue: seed(),
    onError: (error) => console.warn('[useSubjectConfig] 读写本地数据失败', error),
  });

  const safe = useMemo(() => {
    const base = seed();
    return {
      fullScores: { ...base.fullScores, ...(config?.fullScores || {}) },
      customNames: config?.customNames || [],
    };
  }, [config]);

  const getFullScore = useMemoizedFn((name: string): number => safe.fullScores[name] ?? CUSTOM_FULL_SCORE);

  const setFullScore = useMemoizedFn((name: string, value: number) => {
    const v = Number.isFinite(value) && value > 0 ? value : CUSTOM_FULL_SCORE;
    setConfig((prev) => ({
      fullScores: { ...(prev?.fullScores || {}), [name]: v },
      customNames: prev?.customNames || [],
    }));
  });

  /** 新增自定义学科（常驻） */
  const addCustom = useMemoizedFn((name: string, fullScore?: number) => {
    setConfig((prev) => {
      const prevCustom = prev?.customNames || [];
      const fullScores = { ...(prev?.fullScores || {}) };
      const exists = prevCustom.includes(name);
      const customNames = exists ? prevCustom : [...prevCustom, name];
      fullScores[name] = fullScore && fullScore > 0 ? fullScore : fullScores[name] ?? CUSTOM_FULL_SCORE;
      return { fullScores, customNames };
    });
  });

  /** 永久删除自定义学科 */
  const removeCustom = useMemoizedFn((name: string) => {
    setConfig((prev) => {
      const fullScores = { ...(prev?.fullScores || {}) };
      delete fullScores[name];
      return {
        fullScores,
        customNames: (prev?.customNames || []).filter((n) => n !== name),
      };
    });
  });

  const presetNames = useMemo(() => PRESET_SUBJECTS.map((item) => item.name), []);
  const customNames = safe.customNames;
  const allNames = useMemo(() => [...presetNames, ...customNames], [presetNames, customNames]);

  return {
    getFullScore,
    setFullScore,
    addCustom,
    removeCustom,
    presetNames,
    customNames,
    allNames,
  };
}
