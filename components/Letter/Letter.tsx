import { forwardRef } from 'react';
import styles from './Letter.module.css';

export interface LetterData {
  senderRole: string;
  senderName: string;
  receiverRole: string;
  receiverName: string;
  content: string;
  attachment?: string;
  date: string;
}

interface LetterProps {
  data: LetterData;
}

const ROLE_LABEL: Record<string, string> = {
  '夫': '吾夫', '妻': '吾妻',
  '兄': '仁兄', '弟': '仁弟',
  '姐': '贤姐', '妹': '贤妹',
};

const COL_CHARS = 18;
const GRID_COLS = 10;
const FONT_SIZE = 24;
const LETTER_SPACING = 8;
const DATE_SIZE = 16;
const DATE_SPACING = 4;
/** 日期字高度相对于正文字高度的比例 */
const DATE_SCALE = (DATE_SIZE + DATE_SPACING) / (FONT_SIZE + LETTER_SPACING); // 20/32 = 0.625

function numToChinese(n: number): string {
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n <= 10) return n === 10 ? '十' : digits[n];
  if (n < 20) return '十' + digits[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return (t === 2 ? '二十' : t === 3 ? '三十' : '') + (o ? digits[o] : '');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const yearStr = String(d.getFullYear()).split('').map(ch => '零一二三四五六七八九'[parseInt(ch)]).join('');
  return `${yearStr}年${numToChinese(d.getMonth() + 1)}月${numToChinese(d.getDate())}日`;
}

function splitColumns(text: string): string[] {
  const clean = text.replace(/\s+/g, '');
  const cols: string[] = [];
  for (let i = 0; i < clean.length; i += COL_CHARS) {
    cols.push(clean.slice(i, i + COL_CHARS));
  }
  return cols;
}

type ColumnItem =
  | { type: 'text'; text: string }
  | { type: 'closing'; padding: string; name: string; date: string };

function buildColumns(data: LetterData): ColumnItem[] {
  const rcvr = ROLE_LABEL[data.receiverRole] || data.receiverRole;
  const sndr = data.senderRole;

  const items: ColumnItem[] = [];

  // 第 1 列（最右）：称呼
  items.push({ type: 'text', text: `${rcvr}${data.receiverName}，展信安康。` });

  // 中间：正文
  const bodyCols = splitColumns(data.content);
  for (const col of bodyCols) {
    items.push({ type: 'text', text: col });
  }

  // 计算空列数，确保落款对齐到最左格
  const usedCols = 1 + bodyCols.length + 1; // greeting + body + closing
  const emptyCols = Math.max(0, GRID_COLS - usedCols);
  for (let i = 0; i < emptyCols; i++) {
    items.push({ type: 'text', text: '' });
  }

  // 落款列（最左）：名称置底 + 日期小字
  // 日期字高 20px(16+4) / 正文 32px(24+8) = 0.625，不能按 1:1 算列数
  const namePart = `${sndr}${data.senderName}`;
  const datePart = formatDate(data.date);
  const effectiveLen = Math.ceil((namePart.length + 1) + datePart.length * DATE_SCALE);
  const padTop = Math.max(0, COL_CHARS - effectiveLen);
  items.push({
    type: 'closing',
    padding: '　'.repeat(padTop),
    name: namePart,
    date: datePart,
  });

  return items;
}

const Letter = forwardRef<HTMLDivElement, LetterProps>(({ data }, ref) => {
  const cols = buildColumns(data);

  return (
    <div ref={ref} className={styles.letter}>
      <div className={styles.innerFrame} />
      <div className={styles.grid} />
      <div className={styles.content}>
        {cols.map((col, i) => {
          if (col.type === 'closing') {
            return (
              <div key={i} className={styles.col}>
                {col.padding}
                {col.name}
                {'　'}
                <span className={styles.dateText}>{col.date}</span>
              </div>
            );
          }
          return (
            <div key={i} className={styles.col}>
              {col.text}
            </div>
          );
        })}
      </div>
    </div>
  );
});

Letter.displayName = 'Letter';

export default Letter;
