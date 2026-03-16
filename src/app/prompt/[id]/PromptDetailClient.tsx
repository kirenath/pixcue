"use client";

// prompt/[id]/PromptDetailClient.tsx — 详情页客户端组件

import { useState, useEffect } from "react";
import PromptDetail from "@/components/PromptDetail";
import Link from "next/link";

interface PromptDetailClientProps {
  id: string;
}

export default function PromptDetailClient({ id }: PromptDetailClientProps) {
  const [prompt, setPrompt] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const res = await fetch(`/api/prompts/${id}`);
        if (!res.ok) {
          setError("作品不存在或已被删除");
          return;
        }
        const json = await res.json();
        setPrompt(json.data);
      } catch {
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    }
    fetchPrompt();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "4rem",
          color: "var(--text-tertiary)",
        }}
      >
        加载中...
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "4rem",
          gap: "1rem",
        }}
      >
        <p style={{ color: "var(--text-tertiary)", fontSize: "1.125rem" }}>
          {error || "作品不存在"}
        </p>
        <Link href="/" className="btn btn-secondary">
          返回画廊
        </Link>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PromptDetail prompt={prompt as any} />;
}
