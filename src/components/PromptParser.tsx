"use client";

// components/PromptParser.tsx — Prompt 粘贴 → 参数解析可视化

import { useState } from "react";
import { parseMjPrompt } from "@/lib/mj-parser";
import type { MjParsedResult } from "@/lib/mj-parser";
import { getPlatformInfo } from "@/lib/platforms";
import styles from "./PromptParser.module.css";

interface PromptParserProps {
  onParsed: (result: MjParsedResult) => void;
}

const PARAM_LABELS: Record<string, string> = {
  mj_version: "版本",
  mj_aspect_ratio: "宽高比",
  mj_stylize: "Stylize",
  mj_chaos: "Chaos",
  mj_seed: "Seed",
  mj_quality: "Quality",
  mj_tile: "Tile",
  mj_stop: "Stop",
  mj_weird: "Weird",
  mj_repeat: "Repeat",
  mj_style: "Style",
  mj_personalize: "Personalize",
  mj_sref: "--sref",
  mj_cref: "--cref",
  mj_oref: "--oref",
  mj_iw: "Image Weight",
  mj_cw: "Char Weight",
};

export default function PromptParser({ onParsed }: PromptParserProps) {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<MjParsedResult | null>(null);

  function handleParse() {
    if (!raw.trim()) return;
    const parsed = parseMjPrompt(raw);
    setResult(parsed);
    onParsed(parsed);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // 粘贴后自动解析
    setTimeout(() => {
      const value = (e.target as HTMLTextAreaElement).value;
      if (value.trim()) {
        const parsed = parseMjPrompt(value);
        setResult(parsed);
        onParsed(parsed);
      }
    }, 0);
  }

  const activeParams = result
    ? Object.entries(result.params).filter(
        ([, v]) => v !== undefined && v !== null && v !== false
      )
    : [];

  return (
    <div className={styles.parser}>
      <div className={styles.inputSection}>
        <label className={styles.label}>粘贴原始 Prompt</label>
        <textarea
          className={`input ${styles.textarea}`}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onPaste={handlePaste}
          placeholder="粘贴完整的 MJ/Niji prompt（含参数），例如：a cute cat --ar 16:9 --v 6.1 --s 500"
          rows={4}
        />
        <button className="btn btn-primary" onClick={handleParse} type="button">
          解析 Prompt
        </button>
      </div>

      {result && (
        <div className={styles.resultSection}>
          {/* 平台识别 */}
          <div className={styles.platformRow}>
            <span className={styles.platformLabel}>识别平台:</span>
            <span
              className="badge"
              style={{
                background: `${getPlatformInfo(result.platform).color}26`,
                color: getPlatformInfo(result.platform).color,
              }}
            >
              {getPlatformInfo(result.platform).label}
            </span>
          </div>

          {/* 纯净 Prompt */}
          <div className={styles.cleanPrompt}>
            <span className={styles.paramLabel}>纯净提示词:</span>
            <p className={styles.promptText}>{result.prompt_text || "(空)"}</p>
          </div>

          {/* 解析到的参数 */}
          {activeParams.length > 0 && (
            <div className={styles.paramsGrid}>
              {activeParams.map(([key, value]) => (
                <div key={key} className={styles.paramChip}>
                  <span className={styles.paramKey}>
                    {PARAM_LABELS[key] || key}
                  </span>
                  <span className={styles.paramVal}>{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
