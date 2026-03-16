"use client";

// components/StatsCards.tsx — 统计卡片

import styles from "./StatsCards.module.css";

export interface Stats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

interface StatsCardsProps {
  stats: Stats;
}

const CARD_CONFIG = [
  { key: "total" as const, label: "总作品", icon: "📊", color: "var(--color-primary-400)" },
  { key: "published" as const, label: "已发布", icon: "✅", color: "var(--color-success)" },
  { key: "draft" as const, label: "草稿", icon: "📝", color: "var(--color-warning)" },
  { key: "archived" as const, label: "已归档", icon: "📦", color: "var(--text-tertiary)" },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className={styles.grid}>
      {CARD_CONFIG.map(({ key, label, icon, color }) => (
        <div key={key} className={styles.card}>
          <div className={styles.cardIcon}>{icon}</div>
          <div className={styles.cardInfo}>
            <span className={styles.cardValue} style={{ color }}>
              {stats[key]}
            </span>
            <span className={styles.cardLabel}>{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
