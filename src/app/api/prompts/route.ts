// api/prompts/route.ts — GET (列表/搜索/筛选) + POST (创建)

import { supabaseAdmin } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/prompts
 *
 * Query params:
 * - q: 搜索关键词 (全文搜索)
 * - platform: 平台标识 (midjourney, nijijourney, stable_diffusion, flux, novelai, imagen, 等)
 * - status: 'draft' | 'published' | 'archived'
 * - tag: tag slug
 * - sort: 'newest' | 'popular' (default: newest)
 * - page: 页码 (default: 1)
 * - limit: 每页数量 (default: 20, max: 50)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const q = searchParams.get("q");
  const platform = searchParams.get("platform");
  const status = searchParams.get("status") || "published";
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("prompts")
    .select("*, prompt_tags!inner(tag_id, tags!inner(name, slug))", {
      count: "exact",
    });

  // 状态筛选
  if (status) {
    query = query.eq("status", status);
  }

  // 平台筛选
  if (platform) {
    query = query.eq("platform", platform);
  }

  // 全文搜索
  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  }

  // 标签筛选
  if (tag) {
    query = query.eq("prompt_tags.tags.slug", tag);
  }

  // 排序
  if (sort === "popular") {
    query = query.order("view_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // 分页
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[Prompts GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

/**
 * POST /api/prompts — 创建新 prompt
 */
export async function POST(req: Request) {
  const body = await req.json();

  const {
    title,
    prompt_text,
    description,
    type,
    category,
    main_image_url,
    thumb_image_url,
    author,
    status,
    is_nsfw,
    platform,
    mj_version,
    mj_aspect_ratio,
    mj_stylize,
    mj_chaos,
    mj_seed,
    mj_quality,
    mj_tile,
    mj_no,
    mj_stop,
    mj_weird,
    mj_repeat,
    mj_style,
    mj_personalize,
    mj_sref,
    mj_cref,
    mj_oref,
    mj_iw,
    mj_cw,
    mj_moodboard_id,
    mj_raw_params,
    tags, // string[] — tag names
    reference_images, // { image_url, thumb_url, ref_type, sort_order }[]
  } = body;

  // 基础校验
  if (!title || !prompt_text) {
    return NextResponse.json(
      { error: "标题和提示词不能为空" },
      { status: 400 }
    );
  }

  // 1. 插入 prompt
  const { data: prompt, error: promptError } = await supabaseAdmin
    .from("prompts")
    .insert({
      title,
      prompt_text,
      description,
      type: type || "txt2img",
      category: category || "gallery",
      main_image_url,
      thumb_image_url,
      author,
      status: status || "published",
      is_nsfw: is_nsfw || false,
      platform: platform || "midjourney",
      mj_version,
      mj_aspect_ratio,
      mj_stylize,
      mj_chaos,
      mj_seed,
      mj_quality,
      mj_tile,
      mj_no,
      mj_stop,
      mj_weird,
      mj_repeat,
      mj_style,
      mj_personalize,
      mj_sref,
      mj_cref,
      mj_oref,
      mj_iw,
      mj_cw,
      mj_moodboard_id,
      mj_raw_params,
    })
    .select()
    .single();

  if (promptError) {
    console.error("[Prompts POST] Error:", promptError);
    return NextResponse.json({ error: promptError.message }, { status: 500 });
  }

  // 2. 处理标签 (如果有)
  if (tags && Array.isArray(tags) && tags.length > 0) {
    for (const tagName of tags) {
      const trimmed = tagName.trim();
      if (!trimmed) continue;

      const slug = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
        .replace(/^-|-$/g, "");

      // Upsert tag
      const { data: tagData } = await supabaseAdmin
        .from("tags")
        .upsert({ name: trimmed, slug }, { onConflict: "name" })
        .select("id")
        .single();

      if (tagData) {
        // 关联 prompt ↔ tag
        await supabaseAdmin.from("prompt_tags").insert({
          prompt_id: prompt.id,
          tag_id: tagData.id,
        });
      }
    }
  }

  // 3. 处理参考图 (如果有)
  if (reference_images && Array.isArray(reference_images) && reference_images.length > 0) {
    const refRows = reference_images.map((ref: { image_url: string; thumb_url?: string; ref_type?: string; sort_order?: number }, idx: number) => ({
      prompt_id: prompt.id,
      image_url: ref.image_url,
      thumb_url: ref.thumb_url || null,
      ref_type: ref.ref_type || "source",
      sort_order: ref.sort_order ?? idx,
    }));

    const { error: refError } = await supabaseAdmin
      .from("reference_images")
      .insert(refRows);

    if (refError) {
      console.error("[Prompts POST] Reference images error:", refError);
      // 不阻塞主流程，仅记录错误
    }
  }

  return NextResponse.json({ data: prompt }, { status: 201 });
}
