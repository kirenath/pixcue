// api/prompts/[id]/route.ts — GET / PUT / DELETE 单个 prompt

import { supabaseAdmin } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/**
 * GET /api/prompts/[id] — 获取单个 prompt 详情 + 自增 view_count
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 获取 prompt + 关联的 tags + reference_images
  const { data, error } = await supabaseAdmin
    .from("prompts")
    .select(
      `
      *,
      prompt_tags(tag_id, tags(id, name, slug)),
      reference_images(*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Prompt 不存在" }, { status: 404 });
  }

  // 自增 view_count (异步, 不阻塞返回)
  supabaseAdmin
    .from("prompts")
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq("id", id)
    .then();

  return NextResponse.json({ data });
}

/**
 * PUT /api/prompts/[id] — 更新 prompt
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // 分离 tags 和 prompt 数据
  const { tags, ...promptData } = body;

  // 更新 prompt
  const { data, error } = await supabaseAdmin
    .from("prompts")
    .update(promptData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Prompts PUT] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 更新标签 (如果提供了 tags)
  if (tags && Array.isArray(tags)) {
    // 删除旧关联
    await supabaseAdmin.from("prompt_tags").delete().eq("prompt_id", id);

    // 重新关联
    for (const tagName of tags) {
      const trimmed = tagName.trim();
      if (!trimmed) continue;

      const slug = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data: tagData } = await supabaseAdmin
        .from("tags")
        .upsert({ name: trimmed, slug }, { onConflict: "name" })
        .select("id")
        .single();

      if (tagData) {
        await supabaseAdmin.from("prompt_tags").insert({
          prompt_id: id,
          tag_id: tagData.id,
        });
      }
    }
  }

  return NextResponse.json({ data });
}

/**
 * DELETE /api/prompts/[id] — 删除 prompt
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("prompts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Prompts DELETE] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
