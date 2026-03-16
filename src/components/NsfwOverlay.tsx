"use client";

// components/NsfwOverlay.tsx — NSFW 模糊遮罩

import { useState } from "react";
import styles from "./NsfwOverlay.module.css";

interface NsfwOverlayProps {
  children: React.ReactNode;
  isNsfw: boolean;
}

export default function NsfwOverlay({ children, isNsfw }: NsfwOverlayProps) {
  const [revealed, setRevealed] = useState(false);

  if (!isNsfw) return <>{children}</>;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.content} ${revealed ? styles.revealed : ""}`}>
        {children}
      </div>
      {!revealed && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <span className={styles.icon}>🔞</span>
            <p className={styles.label}>NSFW 内容</p>
            <button
              className="btn btn-secondary"
              onClick={() => setRevealed(true)}
            >
              点击查看
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
