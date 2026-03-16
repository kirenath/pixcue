"use client";

// login/page.tsx — 管理员登录页

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === "Invalid login credentials"
          ? "邮箱或密码错误"
          : authError.message);
        return;
      }

      // 将 access_token 写入 cookie，供 middleware 读取
      if (data?.session?.access_token) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      // 使用 window.location 确保完整刷新，让 middleware 能读到新 cookie
      window.location.href = "/admin";
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#login-grad)" />
            <path
              d="M14 16h20v2H14zM14 22h16v2H14zM14 28h12v2H14zM30 24l6 8h-12l6-8z"
              fill="white" opacity="0.9"
            />
            <defs>
              <linearGradient id="login-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AFF" /><stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>
            Pix<span className={styles.accent}>Cue</span>
          </span>
        </div>

        <h1 className={styles.title}>管理员登录</h1>
        <p className={styles.subtitle}>使用授权邮箱登录管理后台</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>邮箱</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>密码</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={`btn btn-primary ${styles.submit}`}
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <a href="/" className={styles.backLink}>← 返回画廊</a>
      </div>
    </div>
  );
}
