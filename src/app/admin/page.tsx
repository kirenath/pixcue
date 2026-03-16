// admin/page.tsx — 管理仪表盘 (Phase 5 完善，现在先做基础导航)

import Header from "@/components/Header";
import Link from "next/link";

export default function AdminPage() {
  return (
    <>
      <Header />
      <main
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "var(--space-8) var(--space-4)",
        }}
      >
        <h1 style={{ marginBottom: "var(--space-6)" }}>管理后台</h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <Link
            href="/admin/upload"
            className="card"
            style={{
              padding: "var(--space-6)",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <span style={{ fontSize: "2rem" }}>📤</span>
            <h2 style={{ fontSize: "var(--text-lg)" }}>上传作品</h2>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-tertiary)",
              }}
            >
              粘贴 Prompt → 自动解析 → 上传图片 → 发布
            </p>
          </Link>

          <Link
            href="/admin/manage"
            className="card"
            style={{
              padding: "var(--space-6)",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <span style={{ fontSize: "2rem" }}>📋</span>
            <h2 style={{ fontSize: "var(--text-lg)" }}>内容管理</h2>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-tertiary)",
              }}
            >
              编辑、归档、删除已有作品
            </p>
          </Link>

          <Link
            href="/"
            className="card"
            style={{
              padding: "var(--space-6)",
              textDecoration: "none",
              color: "inherit",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <span style={{ fontSize: "2rem" }}>🖼️</span>
            <h2 style={{ fontSize: "var(--text-lg)" }}>查看画廊</h2>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-tertiary)",
              }}
            >
              以访客视角浏览画廊
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
