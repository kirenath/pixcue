// api/tags/route.ts — GET (列表/搜索) + POST (创建)

import { supabaseAdmin } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/tags
 *
 * Query params:
 * - q: 搜索关键词 (模糊匹配 name)
 * - sort: 'name' | 'popular' (default: popular)
 * - limit: 每页数量 (default: 50)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const q = searchParams.get("q");
  const sort = searchParams.get("sort") || "popular";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  if (sort === "popular") {
    // 按使用次数排序 — 要用 RPC 或手动 join count
    // 简化方案: 查 prompt_tags 聚合
    let query = supabaseAdmin
      .from("tags")
      .select("*, prompt_tags(count)", { count: "exact" });

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("[Tags GET] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 按 prompt_tags count 排序
    const sorted = (data || []).sort((a, b) => {
      const countA = Array.isArray(a.prompt_tags)
        ? a.prompt_tags.length
        : (a.prompt_tags as { count: number })?.count || 0;
      const countB = Array.isArray(b.prompt_tags)
        ? b.prompt_tags.length
        : (b.prompt_tags as { count: number })?.count || 0;
      return countB - countA;
    });

    return NextResponse.json({ data: sorted });
  }

  // 按名称排序
  let query = supabaseAdmin.from("tags").select("*").order("name").limit(limit);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Tags GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/tags — 创建标签
 */
export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "标签名称不能为空" },
      { status: 400 }
    );
  }

  const trimmed = name.trim();
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "");

  // INSERT ... ON CONFLICT DO NOTHING 语义
  const { data, error } = await supabaseAdmin
    .from("tags")
    .upsert({ name: trimmed, slug }, { onConflict: "name" })
    .select()
    .single();

  if (error) {
    console.error("[Tags POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
