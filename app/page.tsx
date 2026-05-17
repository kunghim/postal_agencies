'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import Form, { type FormData } from '@/components/Form/Form';
import Loading from '@/components/Loading/Loading';
import Letter, { type LetterData } from '@/components/Letter/Letter';
import SendModal from '@/components/SendModal/SendModal';

type PageState = 'form' | 'loading' | 'result' | 'error';

export default function Home() {
  const [page, setPage] = useState<PageState>('form');
  const [letterData, setLetterData] = useState<LetterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (data: FormData) => {
    setPage('loading');
    setError(null);

    try {
      const resp = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.error || `请求失败 (${resp.status})`);
      }

      const result = await resp.json();
      if (result.error) throw new Error(result.error);

      setLetterData({
        senderRole: data.senderRole,
        senderName: data.senderName,
        receiverRole: data.receiverRole,
        receiverName: data.receiverName,
        content: result.content,
        date: (() => {
          const d = new Date();
          return new Date(d.getTime() + 8 * 3600000).toISOString().split('T')[0];
        })(),
      });
      setPage('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setPage('error');
    }
  };

  const handleSubmitRaw = (data: FormData) => {
    const d = new Date();
    const beijingDate = new Date(d.getTime() + 8 * 3600000).toISOString().split('T')[0];

    setLetterData({
      senderRole: data.senderRole,
      senderName: data.senderName,
      receiverRole: data.receiverRole,
      receiverName: data.receiverName,
      content: data.content,
      date: beijingDate,
    });
    setPage('result');
  };

  const handleDownload = async () => {
    if (!letterRef.current || downloading || downloaded) return;
    setDownloading(true);

    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 200));

    try {
      const dataUrl = await toPng(letterRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = '侨批书信.png';
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
    } catch (err) {
      console.error('下载失败:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setPage('form');
    setLetterData(null);
    setError(null);
    setDownloaded(false);
  };

  return (
    <main style={styles.main}>
      {page === 'form' && (
        <div style={styles.fadeIn}>
          <Form onSubmit={handleSubmit} onSubmitRaw={handleSubmitRaw} />
        </div>
      )}

      {page === 'loading' && (
        <div style={styles.fadeIn}>
          <Loading />
        </div>
      )}

      {page === 'result' && letterData && (
        <div style={styles.fadeIn}>
          <div ref={letterRef}>
            <Letter data={letterData} />
          </div>
          <div style={styles.actions}>
            {/* <button style={styles.shipBtn} onClick={() => setShowSend(true)}>
              漂洋过海
            </button> */}
            <button
              style={{
                ...styles.downloadBtn,
                ...(downloading || downloaded ? styles.btnDisabled : {}),
              }}
              onClick={handleDownload}
              disabled={downloading || downloaded}
            >
              {downloading ? '生成中…' : downloaded ? '已下载' : '下载信件'}
            </button>
            <button style={styles.resetBtn} onClick={handleReset}>
              再写一封
            </button>
          </div>

          {showSend && (
            <SendModal
              letterEl={letterRef.current}
              senderName={letterData.senderName}
              receiverName={letterData.receiverName}
              onClose={() => setShowSend(false)}
            />
          )}
        </div>
      )}

      {page === 'error' && (
        <div style={{ ...styles.fadeIn, textAlign: 'center' }}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.resetBtn} onClick={handleReset}>重试</button>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    gap: '20px',
  },
  fadeIn: {
    animation: 'fadeIn 0.5s ease',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px',
    flexWrap: 'wrap' as const,
  },
  shipBtn: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '2px',
    background: '#2c5f7c',
    color: '#f5e6c8',
    fontFamily: "'Noto Serif TC', serif",
    fontSize: '16px',
    letterSpacing: '4px',
    cursor: 'pointer',
  },
  downloadBtn: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '2px',
    background: '#b5302a',
    color: '#f5e6c8',
    fontFamily: "'Noto Serif TC', serif",
    fontSize: '16px',
    letterSpacing: '4px',
    cursor: 'pointer',
  },
  resetBtn: {
    padding: '12px 32px',
    border: '1.5px solid rgba(245, 230, 200, 0.4)',
    borderRadius: '2px',
    background: 'transparent',
    color: '#f5e6c8',
    fontFamily: "'Noto Serif TC', serif",
    fontSize: '16px',
    letterSpacing: '4px',
    cursor: 'pointer',
  },
  errorText: {
    color: '#e8a0a0',
    fontFamily: "'Noto Serif TC', serif",
    fontSize: '16px',
    marginBottom: '16px',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
