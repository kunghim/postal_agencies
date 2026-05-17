'use client';

import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import styles from './SendModal.module.css';

interface SendModalProps {
  letterEl: HTMLElement | null;
  senderName: string;
  receiverName: string;
  onClose: () => void;
}

export default function SendModal({ letterEl, senderName, receiverName, onClose }: SendModalProps) {
  const [phase, setPhase] = useState<'fold' | 'form' | 'sending' | 'sent' | 'error'>('fold');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const imageRef = useRef<string | null>(null);

  // 折叠动画结束后展示表单
  useEffect(() => {
    if (phase === 'fold') {
      const t = setTimeout(() => setPhase('form'), 1800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // 预截图
  useEffect(() => {
    if (!letterEl || imageRef.current) return;
    const capture = async () => {
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 200));
      try {
        imageRef.current = await toPng(letterEl, { quality: 0.9, pixelRatio: 2 });
      } catch { /* 降级 */ }
    };
    capture();
  }, [letterEl]);

  const handleSend = async () => {
    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }
    setPhase('sending');

    try {
      const resp = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          image: imageRef.current,
          senderName,
          receiverName,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '发送失败');
      setPhase('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败');
      setPhase('error');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* 折叠动画 */}
        {phase === 'fold' && (
          <div className={styles.foldScene}>
            <div className={styles.foldingLetter} />
            <div className={styles.envelopeCover}>
              <div className={styles.envelopeSeal}>僑</div>
            </div>
          </div>
        )}

        {/* 邮箱表单 */}
        {phase === 'form' && (
          <div className={styles.formArea}>
            <h3 className={styles.formTitle}>漂洋过海</h3>
            <p className={styles.formDesc}>输入收件邮箱，将侨批书信寄往远方</p>
            <input
              className={styles.emailInput}
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formBtns}>
              <button className={styles.sendBtn} onClick={handleSend}>寄出</button>
              <button className={styles.cancelBtn} onClick={onClose}>取消</button>
            </div>
          </div>
        )}

        {/* 发送中 */}
        {phase === 'sending' && (
          <div className={styles.statusArea}>
            <div className={styles.ship} />
            <p className={styles.statusText}>信件漂洋过海中…</p>
          </div>
        )}

        {/* 发送成功 */}
        {phase === 'sent' && (
          <div className={styles.statusArea}>
            <div className={styles.checkmark}>✓</div>
            <p className={styles.statusText}>已寄达 {email}</p>
            <button className={styles.cancelBtn} onClick={onClose}>完成</button>
          </div>
        )}

        {/* 发送失败 */}
        {phase === 'error' && (
          <div className={styles.formArea}>
            <h3 className={styles.formTitle}>寄送失败</h3>
            <p className={styles.error}>{error}</p>
            <button className={styles.sendBtn} onClick={() => { setPhase('form'); setError(''); }}>
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
