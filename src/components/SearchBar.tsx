"use client";

// components/SearchBar.tsx — 搜索栏

import { useState, useEffect, useRef } from "react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "搜索提示词...",
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLocal(v);

    // Debounce 300ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  }

  function handleClear() {
    setLocal("");
    onChange("");
  }

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.icon}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16 16l4.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="text"
        className={`input ${styles.input}`}
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="搜索"
      />
      {local && (
        <button className={styles.clear} onClick={handleClear} aria-label="清除搜索">
          ✕
        </button>
      )}
    </div>
  );
}
