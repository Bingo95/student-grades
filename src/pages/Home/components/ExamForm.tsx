import { useEffect, useState } from 'react';
import { useBoolean, useMemoizedFn } from 'ahooks';
import {
  Button,
  DatePicker,
  Dialog,
  Input,
  NumberKeyboard,
  Toast,
  VirtualInput,
} from 'antd-mobile';
import { CUSTOM_FULL_SCORE, PRESET_SUBJECTS, pickSubjectColor } from '../constants';
import type { ExamFormValues, ExamRecord, SubjectScore } from '../types';
import { formatDate, toNumber } from '../utils/analyze';
import useSubjectConfig from '../hooks/useSubjectConfig';
import './ExamForm.less';

export interface ExamFormProps {
  /** 编辑时传入原记录，新增时为 null */
  record?: ExamRecord | null;
  /** 保存回调 */
  onSubmit: (values: ExamFormValues) => void;
  /** 取消编辑（仅编辑态展示） */
  onCancel?: () => void;
}

/** 表单内部的学科草稿：录入过程中统一用字符串，保存时再转成数字 */
interface SubjectDraft {
  name: string;
  /** 满分，字符串便于虚拟键盘编辑 */
  fullScore: string;
  /** 得分，空串表示本次未录入 */
  score: string;
}

/** 当前聚焦的数值字段：score:学科名 / full:学科名 / classRank / gradeRank */
type FieldKey = string;

const MIN_DATE = new Date(2000, 0, 1);
const MAX_DATE = new Date(new Date().getFullYear() + 1, 11, 31);

/** 数字键盘输入校验：最多一位小数、数字总长度不超过 5 位 */
const isValidInput = (current: string, input: string): boolean => {
  if (input === '.' && current.includes('.')) return false;
  const next = current + input;
  const dotIndex = next.indexOf('.');
  if (dotIndex >= 0 && next.length - dotIndex - 1 > 1) return false;
  return next.replace('.', '').length <= 5;
};

/** 分数录入表单：VirtualInput + NumberKeyboard 输入，支持新增 / 编辑 */
export default function ExamForm({ record, onSubmit, onCancel }: ExamFormProps) {
  // 学科配置：满分可自定义 + 自定义学科常驻（须置于其它 useState 之前，供 subjects 初始值使用）
  const { customNames, getFullScore, setFullScore, addCustom, removeCustom } = useSubjectConfig();
  const presetNames = PRESET_SUBJECTS.map((item) => item.name);

  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [subjects, setSubjects] = useState<SubjectDraft[]>(() =>
    [...presetNames, ...customNames].map((subjectName) => ({
      name: subjectName,
      fullScore: String(getFullScore(subjectName)),
      score: '',
    })),
  );
  const [classRank, setClassRank] = useState('');
  const [gradeRank, setGradeRank] = useState('');
  const [customName, setCustomName] = useState('');

  // ahooks：日期选择器 / 数字键盘的显示与隐藏
  const [dateVisible, { setTrue: openDatePicker, setFalse: closeDatePicker }] = useBoolean(false);
  const [keyboardVisible, { setTrue: showKeyboard, setFalse: hideKeyboard }] = useBoolean(false);
  /** 当前聚焦的数值字段 */
  const [activeField, setActiveField] = useState<FieldKey | null>(null);

  /** 默认学科草稿：预设学科 + 已常驻的自定义学科，满分取配置中的值 */
  const buildDefaultSubjects = useMemoizedFn((): SubjectDraft[] =>
    [...presetNames, ...customNames].map((subjectName) => ({
      name: subjectName,
      fullScore: String(getFullScore(subjectName)),
      score: '',
    })),
  );

  const toDraft = (list: SubjectScore[]): SubjectDraft[] =>
    list.map((item) => ({
      name: item.name,
      fullScore: String(item.fullScore || getFullScore(item.name) || CUSTOM_FULL_SCORE),
      score: typeof item.score === 'number' ? String(item.score) : '',
    }));

  // 切换新增 / 编辑时重置表单
  useEffect(() => {
    if (record) {
      setName(record.name || '');
      setDate(record.date ? new Date(record.date) : new Date());
      setSubjects(record.subjects?.length ? toDraft(record.subjects) : buildDefaultSubjects());
      setClassRank(record.classRank === null ? '' : String(record.classRank));
      setGradeRank(record.gradeRank === null ? '' : String(record.gradeRank));
    } else {
      setName('');
      setDate(new Date());
      setSubjects(buildDefaultSubjects());
      setClassRank('');
      setGradeRank('');
    }
    setCustomName('');
    closeDatePicker();
    closeKeyboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id]);

  const selectedNames = subjects.map((item) => item.name);

  /** 读取某个数值字段的当前值 */
  const getFieldValue = useMemoizedFn((key: FieldKey): string => {
    if (key.startsWith('score:')) {
      const subject = key.slice('score:'.length);
      return subjects.find((item) => item.name === subject)?.score ?? '';
    }
    if (key.startsWith('full:')) {
      const subject = key.slice('full:'.length);
      return subjects.find((item) => item.name === subject)?.fullScore ?? '';
    }
    if (key === 'classRank') return classRank;
    if (key === 'gradeRank') return gradeRank;
    return '';
  });

  /** 写入某个数值字段 */
  const setFieldValue = useMemoizedFn((key: FieldKey, value: string) => {
    if (key.startsWith('score:')) {
      const subject = key.slice('score:'.length);
      setSubjects((prev) =>
        prev.map((item) => (item.name === subject ? { ...item, score: value } : item)),
      );
      return;
    }
    if (key.startsWith('full:')) {
      const subject = key.slice('full:'.length);
      setSubjects((prev) =>
        prev.map((item) => (item.name === subject ? { ...item, fullScore: value } : item)),
      );
      // 满分自定义后写入配置，后续录入沿用
      const num = toNumber(value);
      if (num !== null) setFullScore(subject, num);
      return;
    }
    if (key === 'classRank') setClassRank(value);
    if (key === 'gradeRank') setGradeRank(value);
  });

  /** 关闭数字键盘并取消聚焦 */
  const closeKeyboard = useMemoizedFn(() => {
    setActiveField(null);
    hideKeyboard();
  });

  /** 聚焦某个数值字段并弹出数字键盘 */
  const focusField = useMemoizedFn((key: FieldKey) => {
    setActiveField(key);
    showKeyboard();
  });

  const handleKeyInput = useMemoizedFn((value: string) => {
    if (!activeField) return;
    const current = getFieldValue(activeField);
    if (!isValidInput(current, value)) return;
    setFieldValue(activeField, current + value);
  });

  const handleKeyDelete = useMemoizedFn(() => {
    if (!activeField) return;
    setFieldValue(activeField, getFieldValue(activeField).slice(0, -1));
  });

  /** 切换某学科（预设或自定义）是否在本次考试中录入 */
  const toggleSubject = useMemoizedFn((subjectName: string) => {
    setSubjects((prev) => {
      const exist = prev.find((s) => s.name === subjectName);
      if (exist) return prev.filter((s) => s.name !== subjectName);
      return [
        ...prev,
        { name: subjectName, fullScore: String(getFullScore(subjectName)), score: '' },
      ];
    });
  });

  /** 仅从本次考试中移除该学科（不删除常驻配置） */
  const removeFromRecord = useMemoizedFn((subjectName: string) => {
    setSubjects((prev) => prev.filter((item) => item.name !== subjectName));
  });

  /** 添加自定义学科（常驻） */
  const addCustomSubject = useMemoizedFn(() => {
    const value = customName.trim();
    if (!value) {
      Toast.show({ content: '请输入学科名称' });
      return;
    }
    if (selectedNames.includes(value)) {
      Toast.show({ content: '该学科已存在' });
      return;
    }
    setSubjects((prev) => [
      ...prev,
      { name: value, fullScore: String(CUSTOM_FULL_SCORE), score: '' },
    ]);
    addCustom(value);
    setCustomName('');
  });

  /** 永久删除自定义学科 */
  const handleRemoveCustom = useMemoizedFn((subjectName: string) => {
    Dialog.confirm({
      title: '删除自定义学科',
      content: `确定永久删除「${subjectName}」吗？之后需重新添加`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: () => {
        removeCustom(subjectName);
        removeFromRecord(subjectName);
      },
    });
  });

  /** 校验并保存 */
  const handleSave = useMemoizedFn(() => {
    if (!name.trim()) {
      Toast.show({ content: '请输入考试名称' });
      return;
    }
    const finalSubjects: SubjectScore[] = subjects.map((item) => ({
      name: item.name,
      score: toNumber(item.score),
      fullScore: toNumber(item.fullScore) || CUSTOM_FULL_SCORE,
    }));
    const validScores = finalSubjects.filter((item) => typeof item.score === 'number');
    if (!validScores.length) {
      Toast.show({ content: '至少录入一个学科分数' });
      return;
    }
    const invalid = validScores.find(
      (item) => (item.score as number) < 0 || (item.score as number) > item.fullScore,
    );
    if (invalid) {
      Toast.show({ content: `${invalid.name}分数应在 0 ~ ${invalid.fullScore} 之间` });
      return;
    }

    onSubmit({
      name: name.trim(),
      date: formatDate(date),
      subjects: finalSubjects,
      classRank: toNumber(classRank),
      gradeRank: toNumber(gradeRank),
    });
    closeKeyboard();
  });

  /** 数值录入控件：VirtualInput 展示 + 共享的 NumberKeyboard 输入 */
  const renderNumberField = (key: FieldKey, placeholder: string, className: string) => (
    <VirtualInput
      className={className}
      value={getFieldValue(key)}
      placeholder={placeholder}
      onClick={() => focusField(key)}
      onFocus={() => focusField(key)}
      style={{ '--text-align': 'right' } as React.CSSProperties}
    />
  );

  return (
    <>
      <div className="sr-sheet__head">
        <div className="sr-sheet__title">{record ? '编辑考试记录' : '新增考试记录'}</div>
        {record && onCancel && (
          <div className="sr-sheet__close" onClick={onCancel}>
            退出编辑
          </div>
        )}
      </div>
      <div className="sr-form">
        <div className="sr-group">
          <div className="sr-group__title">基本信息</div>
          <div className="sr-group__card">
            <div className="sr-field">
              <div className="sr-field__label">
                考试名称<i>*</i>
              </div>
              <Input
                className="sr-input"
                value={name}
                onChange={setName}
                placeholder="如：高三上学期期中考试"
                maxLength={20}
              />
            </div>
            <div className="sr-field" onClick={openDatePicker}>
              <div className="sr-field__label">
                考试时间<i>*</i>
              </div>
              <div className="sr-field__control">
                <span className="sr-field__value">{formatDate(date)}</span>
                <span className="sr-field__arrow" />
              </div>
            </div>
          </div>
        </div>

        <div className="sr-group">
          <div className="sr-group__title">排名（选填，点击数字输入）</div>
          <div className="sr-group__card">
            <div className="sr-field">
              <div className="sr-field__label">班级排名</div>
              <div className="sr-field__control--input">
                {renderNumberField('classRank', '如：12', 'sr-input sr-input--number')}
              </div>
            </div>
            <div className="sr-field">
              <div className="sr-field__label">年级排名</div>
              <div className="sr-field__control--input">
                {renderNumberField('gradeRank', '如：68', 'sr-input sr-input--number')}
              </div>
            </div>
          </div>
        </div>

        <div className="sr-group">
          <div className="sr-group__title">学科分数（点击数字输入）</div>
          <div className="sr-chip-wrap">
            {PRESET_SUBJECTS.map((item) => {
              const active = selectedNames.includes(item.name);
              return (
                <div
                  key={item.name}
                  className={`sr-chip${active ? ' sr-chip--active' : ''}`}
                  onClick={() => toggleSubject(item.name)}
                >
                  {item.name}
                </div>
              );
            })}
            {customNames.map((item) => {
              const active = selectedNames.includes(item);
              return (
                <div
                  key={item}
                  className={`sr-chip${active ? ' sr-chip--active' : ''}`}
                  style={
                    active
                      ? undefined
                      : { color: pickSubjectColor(item), borderColor: pickSubjectColor(item) }
                  }
                  onClick={() => toggleSubject(item)}
                >
                  <span className="sr-chip__text">{item}</span>
                  <span
                    className="sr-chip__del"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustom(item);
                    }}
                  >
                    ×
                  </span>
                </div>
              );
            })}
          </div>

          <div className="sr-group__card">
            {subjects.map((item) => {
              const isCustom = !presetNames.includes(item.name);
              return (
                <div className="sr-score" key={item.name}>
                  <div className="sr-score__name">
                    <i className="sr-dot" style={{ background: pickSubjectColor(item.name) }} />
                    {item.name}
                  </div>
                  <div className="sr-score__input">
                    {renderNumberField(`score:${item.name}`, '0', 'sr-input sr-input--number')}
                  </div>
                  <div className="sr-score__full">
                    <span className="sr-score__full-edit">
                      /
                      {renderNumberField(
                        `full:${item.name}`,
                        String(getFullScore(item.name)),
                        'sr-input sr-input--mini',
                      )}
                    </span>
                  </div>
                  {isCustom && (
                    <div className="sr-score__del" onClick={() => removeFromRecord(item.name)}>
                      ×
                    </div>
                  )}
                </div>
              );
            })}

            <div className="sr-score sr-score--add">
              <Input
                className="sr-input sr-input--left"
                value={customName}
                onChange={setCustomName}
                placeholder="自定义学科名称"
                maxLength={10}
              />
              <div className="sr-add-btn" onClick={addCustomSubject}>
                添加
              </div>
            </div>
          </div>
        </div>

        <div className="sr-form__footer">
          <Button block color="primary" className="sr-btn" onClick={handleSave}>
            {record ? '保存修改' : '保存记录'}
          </Button>
        </div>

        <DatePicker
          visible={dateVisible}
          onClose={closeDatePicker}
          precision="day"
          value={date}
          min={MIN_DATE}
          max={MAX_DATE}
          onConfirm={(value) => {
            if (value) setDate(new Date(value));
            closeDatePicker();
          }}
        />

        <NumberKeyboard
          visible={keyboardVisible}
          customKey={['.']}
          confirmText="完成"
          closeOnConfirm
          onInput={handleKeyInput}
          onDelete={handleKeyDelete}
          onClose={closeKeyboard}
          onConfirm={closeKeyboard}
        />
      </div>
    </>
  );
}
