"use client";

// components/Header.tsx — 顶部导航 + 搜索 + 筛选（统一面板）

import Link from "next/link";
import SearchBar from "./SearchBar";
import FilterBar, { type FilterState } from "./FilterBar";
import styles from "./Header.module.css";

interface HeaderProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
}

export default function Header({
  search,
  onSearchChange,
  filters,
  onFilterChange,
}: HeaderProps) {
  const showToolbar = onSearchChange && onFilterChange && filters !== undefined;

  return (
    <header className={styles.header}>
      {/* Row 1: Logo + Nav */}
      <div className={styles.topRow}>
        <Link href="/" className={styles.logo}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              width="48"
              height="48"
              rx="12"
              fill="url(#hdr-gradient)"
            />
            <path
              d="M14 16h20v2H14zM14 22h16v2H14zM14 28h12v2H14zM30 24l6 8h-12l6-8z"
              fill="white"
              opacity="0.9"
            />
            <defs>
              <linearGradient
                id="hdr-gradient"
                x1="0"
                y1="0"
                x2="48"
                y2="48"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#7C3AFF" />
                <stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>
            Pix<span className={styles.accent}>Cue</span>
          </span>
        </Link>

        <div className={styles.actions}>
          <Link href="/admin" className="btn btn-ghost">
            管理
          </Link>
        </div>
      </div>

      {showToolbar && (
        <>
          {/* Row 2: Search */}
          <div className={styles.searchRow}>
            <SearchBar value={search ?? ""} onChange={onSearchChange} />
          </div>

          {/* Row 3 + 4: Filters */}
          <FilterBar filters={filters} onChange={onFilterChange} />
        </>
      )}
    </header>
  );
}
