'use client';

import { useMemo, useState } from 'react';
import styles from './Form.module.css';

const RELATIONS = [
  { value: '夫', label: '夫' },
  { value: '妻', label: '妻' },
  { value: '兄', label: '兄' },
  { value: '弟', label: '弟' },
  { value: '姐', label: '姐' },
  { value: '妹', label: '妹' },
];

/** 寄信人角色 → 可选的收信人角色 */
const RECEIVER_ROLES: Record<string, string[]> = {
  '夫': ['妻'],
  '妻': ['夫'],
  '兄': ['弟', '妹'],
  '弟': ['兄', '姐'],
  '姐': ['弟', '妹'],
  '妹': ['兄', '姐'],
};

export interface FormData {
  senderRole: string;
  senderName: string;
  receiverRole: string;
  receiverName: string;
  content: string;
  attachment: string;
}

interface FormProps {
  onSubmit: (data: FormData) => void;
}

export default function Form({ onSubmit }: FormProps) {

  const [formData, setFormData] = useState<FormData>({
    senderRole: '',
    senderName: '',
    receiverRole: '',
    receiverName: '',
    content: '',
    attachment: '',
  });

  const receiverOptions = useMemo(() => {
    if (!formData.senderRole) return [];
    const allowed = RECEIVER_ROLES[formData.senderRole] || [];
    return RELATIONS.filter(r => allowed.includes(r.value));
  }, [formData.senderRole]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };

      if (field === 'senderRole') {
        const allowed = RECEIVER_ROLES[value] || [];
        // 一个或可选第一个，都默认选中第一个
        next.receiverRole = allowed[0] || '';
      }

      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.senderName || !formData.receiverName || !formData.content.trim()) return;
    onSubmit(formData);
  };

  const canSubmit = formData.senderName && formData.receiverName && formData.content.trim();

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>裕豐銀信局</h2>
      <p className={styles.subtitle}>專理 潮州各屬 詔安等處 汕頭香港 上海廣州 兌匯</p>

      <div className={styles.divider}>寄信人</div>

      <div className={styles.row}>
        <div className={styles.fieldNarrow}>
          <select
            className={styles.select}
            value={formData.senderRole}
            onChange={e => handleChange('senderRole', e.target.value)}
          >
            <option value="">称谓</option>
            {RELATIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.fieldWide}>
          <input
            className={styles.input}
            type="text"
            placeholder="姓名，如：木生"
            value={formData.senderName}
            onChange={e => handleChange('senderName', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.divider}>收信人</div>

      <div className={styles.row}>
        <div className={styles.fieldNarrow}>
          {receiverOptions.length === 1 ? (
            <div className={styles.fixedRole}>
              {receiverOptions[0].label}
            </div>
          ) : receiverOptions.length > 1 ? (
            <select
              className={styles.select}
              value={formData.receiverRole}
              onChange={e => handleChange('receiverRole', e.target.value)}
            >
              {receiverOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <div className={styles.fixedRole}>—</div>
          )}
        </div>
        <div className={styles.fieldWide}>
          <input
            className={styles.input}
            type="text"
            placeholder="姓名，如：淑柔"
            value={formData.receiverName}
            onChange={e => handleChange('receiverName', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.divider}>信件内容</div>

      <div className={styles.fieldWide}>
        <textarea
          className={styles.textarea}
          rows={5}
          placeholder="在此写下你想说的话（白话即可）…"
          value={formData.content}
          onChange={e => handleChange('content', e.target.value)}
        />
      </div>

      <div className={styles.divider}>随信附寄</div>

      <div className={styles.fieldWide}>
        <input
          className={styles.input}
          type="text"
          placeholder="如：银元五枚"
          value={formData.attachment}
          onChange={e => handleChange('attachment', e.target.value)}
        />
      </div>

      <button
        className={`${styles.submit} ${canSubmit ? styles.submitActive : ''}`}
        type="submit"
        disabled={!canSubmit}
      >
        狄功代笔
      </button>
    </form>
  );
}
