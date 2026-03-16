"use client";

// components/CopyButton.tsx — 一键复制 prompt + 参数

import { useState, useCallback } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyButton({
  text,
  label = "复制",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      className={`btn btn-secondary ${className}`}
      onClick={handleCopy}
      aria-label={copied ? "已复制" : label}
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5L6.5 12L13 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          已复制
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="5"
              y="5"
              width="9"
              height="9"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M11 5V3.5A1.5 1.5 0 009.5 2H3.5A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
