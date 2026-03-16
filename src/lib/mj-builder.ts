// lib/mj-builder.ts — 参数 → 完整 prompt 拼接
// 将结构化参数对象重新组装为 MJ/Niji prompt 字符串

import type { MjParams } from "./mj-parser";

/**
 * 将纯净 prompt + 参数对象拼接为完整 MJ prompt 字符串
 *
 * @param promptText - 纯净提示词
 * @param params - 参数对象
 * @param platform - 平台 (影响 --v / --niji 输出)
 * @returns 完整的 prompt 字符串
 */
export function buildMjPrompt(
  promptText: string,
  params: MjParams,
  platform: string = "midjourney"
): string {
  const parts: string[] = [];

  if (promptText.trim()) {
    parts.push(promptText.trim());
  }

  // Version / Platform
  if (platform === "nijijourney") {
    parts.push(params.mj_version ? `--niji ${params.mj_version}` : "--niji");
  } else if (params.mj_version) {
    parts.push(`--v ${params.mj_version}`);
  }

  // Aspect ratio
  if (params.mj_aspect_ratio) {
    parts.push(`--ar ${params.mj_aspect_ratio}`);
  }

  // Stylize
  if (params.mj_stylize !== undefined) {
    parts.push(`--s ${params.mj_stylize}`);
  }

  // Chaos
  if (params.mj_chaos !== undefined) {
    parts.push(`--chaos ${params.mj_chaos}`);
  }

  // Seed
  if (params.mj_seed !== undefined) {
    parts.push(`--seed ${params.mj_seed}`);
  }

  // Quality
  if (params.mj_quality !== undefined) {
    parts.push(`--q ${params.mj_quality}`);
  }

  // Tile
  if (params.mj_tile) {
    parts.push("--tile");
  }

  // Stop
  if (params.mj_stop !== undefined) {
    parts.push(`--stop ${params.mj_stop}`);
  }

  // Weird
  if (params.mj_weird !== undefined) {
    parts.push(`--weird ${params.mj_weird}`);
  }

  // Repeat
  if (params.mj_repeat !== undefined) {
    parts.push(`--repeat ${params.mj_repeat}`);
  }

  // Style
  if (params.mj_style) {
    parts.push(`--style ${params.mj_style}`);
  }

  // Personalize
  if (params.mj_personalize) {
    if (params.mj_personalize === "default") {
      parts.push("--p");
    } else {
      parts.push(`--p ${params.mj_personalize}`);
    }
  }

  // Style reference
  if (params.mj_sref) {
    parts.push(`--sref ${params.mj_sref}`);
  }

  // Character reference
  if (params.mj_cref) {
    parts.push(`--cref ${params.mj_cref}`);
  }

  // Object reference
  if (params.mj_oref) {
    parts.push(`--oref ${params.mj_oref}`);
  }

  // Image weight
  if (params.mj_iw !== undefined) {
    parts.push(`--iw ${params.mj_iw}`);
  }

  // Character weight
  if (params.mj_cw !== undefined) {
    parts.push(`--cw ${params.mj_cw}`);
  }

  // Moodboard
  if (params.mj_moodboard_id) {
    parts.push(`--moodboard ${params.mj_moodboard_id}`);
  }

  // No (negative prompt) — always last
  if (params.mj_no) {
    parts.push(`--no ${params.mj_no}`);
  }

  return parts.join(" ");
}
