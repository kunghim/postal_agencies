'use client';

import { useState } from 'react';
import styles from './Envelope.module.css';

interface EnvelopeProps {
  sender: string;
  recipient: string;
  onOpen?: () => void;
}

export default function Envelope({ sender, recipient, onOpen }: EnvelopeProps) {
  const [opened, setOpened] = useState(false);

  const handleClick = () => {
    if (opened) return;
    setOpened(true);
    onOpen?.();
  };

  return (
    <div
      className={`${styles.container} ${opened ? styles.opened : ''}`}
      onClick={handleClick}
    >
      <div className={styles.envelope}>
        <div className={styles.opening} />
        <div className={styles.title}>僑批</div>
        <div className={styles.sender}>{sender}</div>
        <div className={styles.recipient}>{recipient}</div>
        <div className={styles.letterSlot}>
          <div className={styles.letterInside} />
        </div>
        <div className={styles.letterEdge} />
      </div>
      {!opened && <div className={styles.hint}>点击拆信</div>}
    </div>
  );
}
