"use client";

// components/FilterBar.tsx — 筛选栏

import { getPlatformOptions } from "@/lib/platforms";
import styles from "./FilterBar.module.css";

export interface FilterState {
  platform: string;
  sort: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const PLATFORM_OPTIONS = [
  { value: "", label: "全部平台" },
  ...getPlatformOptions(),
];

const SORT_OPTIONS = [
  { value: "newest", label: "最新" },
  { value: "popular", label: "最热" },
];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className={styles.bar}>
      {/* 平台筛选 */}
      <div className={styles.platformGroup}>
        {PLATFORM_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.chip} ${
              filters.platform === value ? styles.chipActive : ""
            }`}
            onClick={() => onChange({ ...filters, platform: value })}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 排序 */}
      <div className={styles.group}>
        {SORT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.chip} ${
              filters.sort === value ? styles.chipActive : ""
            }`}
            onClick={() => onChange({ ...filters, sort: value })}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
