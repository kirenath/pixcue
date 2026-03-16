"use client";

// components/ManageTable.tsx — 内容管理表格

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PlatformBadge from "./PlatformBadge";
import styles from "./ManageTable.module.css";

interface PromptRow {
  id: string;
  title: string;
  platform: string;
  mj_version?: string;
  status: "published" | "draft" | "archived";
  is_nsfw: boolean;
  view_count: number;
  created_at: string;
  thumb_image_url?: string;
}

interface ManageTableProps {
  onStatsUpdate?: (stats: { total: number; published: number; draft: number; archived: number }) => void;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  published: { label: "已发布", className: styles.statusPublished },
  draft: { label: "草稿", className: styles.statusDraft },
  archived: { label: "已归档", className: styles.statusArchived },
};

export default function ManageTable({ onStatsUpdate }: ManageTableProps) {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      params.set("sort", "newest");

      const res = await fetch(`/api/prompts?${params}`);
      const json = await res.json();
      setPrompts(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotal(json.pagination?.total || 0);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // 统计各状态数量
  useEffect(() => {
    async function fetchStats() {
      const statuses = ["published", "draft", "archived"];
      const counts: Record<string, number> = {};
      for (const s of statuses) {
        try {
          const res = await fetch(`/api/prompts?status=${s}&limit=1`);
          const json = await res.json();
          counts[s] = json.pagination?.total || 0;
        } catch {
          counts[s] = 0;
        }
      }
      onStatsUpdate?.({
        total: counts.published + counts.draft + counts.archived,
        published: counts.published,
        draft: counts.draft,
        archived: counts.archived,
      });
    }
    fetchStats();
  }, [onStatsUpdate]);

  // 全选/全不选
  function toggleSelectAll() {
    if (selected.size === prompts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(prompts.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  // 批量操作
  async function batchAction(action: "publish" | "archive" | "delete") {
    if (selected.size === 0) return;
    const ids = Array.from(selected);

    const confirmMsg =
      action === "delete"
        ? `确认删除 ${ids.length} 条作品？此操作不可撤销。`
        : action === "archive"
        ? `确认归档 ${ids.length} 条作品？`
        : `确认发布 ${ids.length} 条作品？`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      for (const id of ids) {
        if (action === "delete") {
          await fetch(`/api/prompts/${id}`, { method: "DELETE" });
        } else {
          const status = action === "publish" ? "published" : "archived";
          await fetch(`/api/prompts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
        }
      }
      setSelected(new Set());
      fetchPrompts();
    } catch {
      alert("操作失败");
    } finally {
      setActionLoading(false);
    }
  }

  // 单条快速操作
  async function quickAction(id: string, action: "publish" | "archive" | "delete") {
    if (action === "delete" && !window.confirm("确认删除此作品？")) return;

    try {
      if (action === "delete") {
        await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      } else {
        const status = action === "publish" ? "published" : "archived";
        await fetch(`/api/prompts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      }
      fetchPrompts();
    } catch {
      alert("操作失败");
    }
  }

  return (
    <div className={styles.container}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {["", "published", "draft", "archived"].map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ""}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s === "" ? "全部" : STATUS_LABELS[s]?.label || s}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className={styles.batchActions}>
            <span className={styles.batchCount}>已选 {selected.size} 条</span>
            <button
              className="btn btn-secondary"
              onClick={() => batchAction("publish")}
              disabled={actionLoading}
            >
              发布
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => batchAction("archive")}
              disabled={actionLoading}
            >
              归档
            </button>
            <button
              className={`btn ${styles.btnDanger}`}
              onClick={() => batchAction("delete")}
              disabled={actionLoading}
            >
              删除
            </button>
          </div>
        )}
      </div>

      {/* 表格 */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thCheck}>
                <input
                  type="checkbox"
                  checked={prompts.length > 0 && selected.size === prompts.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>缩略图</th>
              <th>标题</th>
              <th>平台</th>
              <th>状态</th>
              <th>浏览</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={styles.loadingCell}>加载中...</td>
              </tr>
            ) : prompts.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>暂无数据</td>
              </tr>
            ) : (
              prompts.map((p) => (
                <tr key={p.id} className={selected.has(p.id) ? styles.rowSelected : ""}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td>
                    {p.thumb_image_url ? (
                      <img src={p.thumb_image_url} alt="" className={styles.thumb} />
                    ) : (
                      <div className={styles.noThumb}>—</div>
                    )}
                  </td>
                  <td>
                    <Link href={`/prompt/${p.id}`} className={styles.titleLink}>
                      {p.title}
                    </Link>
                    {p.is_nsfw && <span className={styles.nsfwBadge}>NSFW</span>}
                  </td>
                  <td><PlatformBadge platform={p.platform} version={p.mj_version} /></td>
                  <td>
                    <span className={`${styles.statusBadge} ${STATUS_LABELS[p.status]?.className}`}>
                      {STATUS_LABELS[p.status]?.label || p.status}
                    </span>
                  </td>
                  <td className={styles.numCell}>{p.view_count}</td>
                  <td className={styles.dateCell}>
                    {new Date(p.created_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {p.status !== "published" && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => quickAction(p.id, "publish")}
                          title="发布"
                        >📢</button>
                      )}
                      {p.status !== "archived" && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => quickAction(p.id, "archive")}
                          title="归档"
                        >📦</button>
                      )}
                      <button
                        className={`${styles.actionBtn} ${styles.actionDanger}`}
                        onClick={() => quickAction(p.id, "delete")}
                        title="删除"
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
            {page} / {totalPages} · 共 {total} 条
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
