"use client";

// components/Gallery.tsx — 瀑布流画廊容器（纯内容展示）

import { useState, useEffect, useCallback } from "react";
import PromptCard from "./PromptCard";
import styles from "./Gallery.module.css";
import type { PromptCardData } from "./PromptCard";
import type { FilterState } from "./FilterBar";

interface GalleryResponse {
  data: PromptCardData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface GalleryProps {
  search: string;
  filters: FilterState;
}

export default function Gallery({ search, filters }: GalleryProps) {
  const [prompts, setPrompts] = useState<PromptCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (filters.platform) params.set("platform", filters.platform);
      params.set("sort", filters.sort);
      params.set("page", String(page));
      params.set("limit", "24");

      const res = await fetch(`/api/prompts?${params}`);
      const json: GalleryResponse = await res.json();

      setPrompts(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotal(json.pagination?.total || 0);
    } catch (error) {
      console.error("[Gallery] Fetch error:", error);
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [search, filters, page]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Reset page when search/filters change
  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  return (
    <div className={styles.container}>
      {/* 统计 */}
      <div className={styles.stats}>
        {loading ? "加载中..." : `共 ${total} 条作品`}
      </div>

      {/* 画廊 */}
      {loading ? (
        <div className="gallery-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeleton}>
              <div className={`skeleton ${styles.skeletonImg}`} />
              <div className={styles.skeletonInfo}>
                <div className={`skeleton ${styles.skeletonBadge}`} />
                <div className={`skeleton ${styles.skeletonTitle}`} />
              </div>
            </div>
          ))}
        </div>
      ) : prompts.length > 0 ? (
        <div className="gallery-grid">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🖼️</div>
          <p>
            {search
              ? `未找到与「${search}」相关的作品`
              : "画廊还没有作品，快去上传吧！"}
          </p>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </button>
          <span className={styles.pageInfo}>
            {page} / {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
