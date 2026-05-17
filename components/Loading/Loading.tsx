import styles from './Loading.module.css';

const CHARS = ['書', '寫', '中', '…'];

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.scene}>
        {/* 信纸 */}
        <div className={styles.paper}>
          <div className={styles.paperLine} />
          <div className={styles.paperLine} />
          <div className={styles.paperLine} />
          <div className={styles.paperLine} />
          <div className={styles.paperText}>
            {CHARS.map((ch, i) => (
              <span key={i} className={styles.char} style={{ animationDelay: `${i * 0.8}s` }}>
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* 毛笔 */}
        <div className={styles.brush}>
          <div className={styles.brushHandle} />
          <div className={styles.brushTip} />
        </div>

        {/* 墨滴粒子 */}
        <div className={styles.inkDrop1} />
        <div className={styles.inkDrop2} />
      </div>

      <p className={styles.text}>先生代笔中…</p>
    </div>
  );
}
