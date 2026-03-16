"use client";

// admin/manage/ManagePageClient.tsx — 内容管理页面客户端

import { useState } from "react";
import Link from "next/link";
import StatsCards, { type Stats } from "@/components/StatsCards";
import ManageTable from "@/components/ManageTable";

export default function ManagePageClient() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
  });

  return (
    <div
      style={{
        maxWidth: "var(--max-width)",
        margin: "0 auto",
        padding: "var(--space-6) var(--space-4)",
      }}
    >
      {/* 标题 + 操作 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-6)",
          flexWrap: "wrap",
          gap: "var(--space-3)",
        }}
      >
        <h1>内容管理</h1>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Link href="/admin/upload" className="btn btn-primary">
            + 上传作品
          </Link>
          <Link href="/admin" className="btn btn-secondary">
            仪表盘
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <StatsCards stats={stats} />

      {/* 表格 */}
      <ManageTable onStatsUpdate={setStats} />
    </div>
  );
}
