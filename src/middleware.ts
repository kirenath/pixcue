// middleware.ts — Admin 路由鉴权 (Supabase Auth Session + 多邮箱 Admin)

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * 鉴权规则:
 * /admin/*                      → 检查 Supabase session + admin 邮箱
 * /api/prompts  POST/PUT/DELETE → 检查 session + admin 邮箱
 * /api/r2-upload                → 检查 session + admin 邮箱
 * /api/thumbnail                → 检查 session + admin 邮箱
 * /api/tags     POST            → 检查 session + admin 邮箱
 * 其他所有路由                   → 公开访问
 */

const PROTECTED_API_ROUTES = ["/api/r2-upload", "/api/thumbnail"];
const WRITE_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

/** 获取允许的 admin 邮箱列表 */
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** 验证 session 并检查是否为 admin */
async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  let token = authHeader?.replace("Bearer ", "");

  if (!token) {
    token =
      req.cookies.get("sb-access-token")?.value ||
      req.cookies.get("supabase-auth-token")?.value;
  }

  if (!token) return false;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data } = await supabase.auth.getUser(token);
    if (!data?.user?.email) return false;

    // 检查邮箱是否在 admin 列表中
    const adminEmails = getAdminEmails();

    // 如果没有配置 ADMIN_EMAILS，则所有已登录用户都是 admin（向后兼容）
    if (adminEmails.size === 0) return true;

    return adminEmails.has(data.user.email.toLowerCase());
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Admin 页面
  if (pathname.startsWith("/admin")) {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 受保护的 API
  if (PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route))) {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Prompts API: 写操作需要鉴权
  if (pathname.startsWith("/api/prompts") && WRITE_METHODS.has(method)) {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Tags API: POST 需要鉴权
  if (pathname.startsWith("/api/tags") && method === "POST") {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/prompts/:path*",
    "/api/r2-upload/:path*",
    "/api/thumbnail/:path*",
    "/api/tags/:path*",
  ],
};
