"use client";

// components/TagInput.tsx — 标签输入 (autocomplete)

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./TagInput.module.css";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ value, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ name: string; slug: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 搜索已有标签
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      setSuggestions(
        (json.data || []).filter(
          (t: { name: string }) => !value.includes(t.name)
        )
      );
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInput(v);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(v), 300);
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  // 点击外部关闭建议
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.tagBox}>
        {value.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={() => removeTag(tag)}
              aria-label={`移除标签 ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.input}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input && fetchSuggestions(input)}
          placeholder={value.length === 0 ? "输入标签，回车或逗号确认" : ""}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((s) => (
            <button
              key={s.slug}
              type="button"
              className={styles.suggestionItem}
              onClick={() => addTag(s.name)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
