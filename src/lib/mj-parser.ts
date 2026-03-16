// lib/mj-parser.ts — Midjourney / NijiJourney Prompt 解析器
// 接收原始 prompt 字符串，输出结构化参数对象 + 纯净 prompt

export interface MjParsedResult {
  prompt_text: string; // 纯净提示词 (不含参数)
  platform: string;
  params: MjParams;
  mj_raw_params: string; // 原始参数字符串
}

export interface MjParams {
  mj_version?: string;
  mj_aspect_ratio?: string;
  mj_stylize?: number;
  mj_chaos?: number;
  mj_seed?: number;
  mj_quality?: number;
  mj_tile?: boolean;
  mj_no?: string;
  mj_stop?: number;
  mj_weird?: number;
  mj_repeat?: number;
  mj_style?: string;
  mj_personalize?: string;
  mj_sref?: string;
  mj_cref?: string;
  mj_oref?: string;
  mj_iw?: number;
  mj_cw?: number;
  mj_moodboard_id?: string;
}

/**
 * 解析 Midjourney / NijiJourney 原始 prompt 字符串
 *
 * 处理规则:
 * - 参数支持有空格和无空格两种形式: `--ar 16:9` 和 `--ar16:9`
 * - `--niji` 标志自动设置 platform 为 nijijourney
 * - `--v` 和 `--version` 视为同义
 * - `--s` 和 `--stylize` 视为同义
 * - `--p` 可能无值 (使用默认 profile)
 * - `--sref` / `--cref` / `--oref` 支持多值 (空格分隔)
 * - URL 保留在 prompt 中，不误识别为参数
 * - `--no` 后跟多词，贪婪匹配到下一个 `--`
 * - 重复参数后值覆盖前值
 */
export function parseMjPrompt(raw: string): MjParsedResult {
  if (!raw || !raw.trim()) {
    return {
      prompt_text: "",
      platform: "midjourney",
      params: {},
      mj_raw_params: "",
    };
  }

  const input = raw.trim();
  const params: MjParams = {};
  let platform: string = "midjourney";

  // Collect all parameter matches and their positions to reconstruct raw_params
  // and to strip them from the prompt text
  const paramRanges: Array<{ start: number; end: number }> = [];

  // ---- Helper: mark a range for removal from prompt ----
  function markRange(start: number, end: number) {
    paramRanges.push({ start, end });
  }

  // ---- 1. Handle --niji (platform detection) ----
  // --niji or --niji <version>
  const nijiRegex = /--niji\s*(\d+(?:\.\d+)?)?/gi;
  let match: RegExpExecArray | null;
  while ((match = nijiRegex.exec(input)) !== null) {
    platform = "nijijourney";
    if (match[1]) {
      params.mj_version = match[1];
    }
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 2. Handle --v / --version ----
  const versionRegex = /--(?:v|version)\s*(\d+(?:\.\d+)?)/gi;
  while ((match = versionRegex.exec(input)) !== null) {
    params.mj_version = match[1];
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 3. Handle --ar / --aspect ----
  const arRegex = /--(?:ar|aspect)\s*(\d+:\d+)/gi;
  while ((match = arRegex.exec(input)) !== null) {
    params.mj_aspect_ratio = match[1];
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 4. Handle --s / --stylize ----
  const stylizeRegex = /--(?:s|stylize)\s*(\d+)/gi;
  while ((match = stylizeRegex.exec(input)) !== null) {
    params.mj_stylize = parseInt(match[1], 10);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 5. Handle --chaos ----
  const chaosRegex = /--chaos\s*(\d+)/gi;
  while ((match = chaosRegex.exec(input)) !== null) {
    params.mj_chaos = parseInt(match[1], 10);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 6. Handle --seed ----
  const seedRegex = /--seed\s*(\d+)/gi;
  while ((match = seedRegex.exec(input)) !== null) {
    params.mj_seed = parseInt(match[1], 10);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 7. Handle --q / --quality ----
  const qualityRegex = /--(?:q|quality)\s*([\d.]+)/gi;
  while ((match = qualityRegex.exec(input)) !== null) {
    params.mj_quality = parseFloat(match[1]);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 8. Handle --tile ----
  const tileRegex = /--tile(?!\w)/gi;
  while ((match = tileRegex.exec(input)) !== null) {
    params.mj_tile = true;
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 9. Handle --no (greedy: match until next -- or end of string) ----
  const noRegex = /--no\s+([\s\S]+?)(?=\s--|\s*$)/gi;
  while ((match = noRegex.exec(input)) !== null) {
    params.mj_no = match[1].trim();
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 10. Handle --stop ----
  const stopRegex = /--stop\s*(\d+)/gi;
  while ((match = stopRegex.exec(input)) !== null) {
    params.mj_stop = parseInt(match[1], 10);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 11. Handle --weird / --w ----
  const weirdRegex = /--(?:weird|w)\s*(\d+)/gi;
  while ((match = weirdRegex.exec(input)) !== null) {
    params.mj_weird = parseInt(match[1], 10);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 12. Handle --repeat / --r ----
  const repeatRegex = /--(?:repeat|r)\s*(\d+)/gi;
  while ((match = repeatRegex.exec(input)) !== null) {
    params.mj_repeat = parseInt(match[1], 10);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 13. Handle --style ----
  const styleRegex = /--style\s+(\S+)/gi;
  while ((match = styleRegex.exec(input)) !== null) {
    params.mj_style = match[1];
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 14. Handle --p / --personalize / --profile ----
  // --p can appear alone (use default profile) or with a value
  // --profile is a synonym for --personalize in Midjourney
  const personalizeRegex = /--(?:p|personalize|profile)(?:\s+([a-zA-Z0-9_-]+))?(?=\s--|$|\s+--)/gi;
  while ((match = personalizeRegex.exec(input)) !== null) {
    params.mj_personalize = match[1] || "default";
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 15. Handle --sref (multi-value: URLs or codes, space-separated) ----
  const srefRegex = /--sref\s+([\s\S]+?)(?=\s--(?!sref)|\s*$)/gi;
  while ((match = srefRegex.exec(input)) !== null) {
    params.mj_sref = match[1].trim();
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 16. Handle --cref (multi-value) ----
  const crefRegex = /--cref\s+([\s\S]+?)(?=\s--(?!cref)|\s*$)/gi;
  while ((match = crefRegex.exec(input)) !== null) {
    params.mj_cref = match[1].trim();
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 17. Handle --oref (multi-value) ----
  const orefRegex = /--oref\s+([\s\S]+?)(?=\s--(?!oref)|\s*$)/gi;
  while ((match = orefRegex.exec(input)) !== null) {
    params.mj_oref = match[1].trim();
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 18. Handle --iw ----
  const iwRegex = /--iw\s*([\d.]+)/gi;
  while ((match = iwRegex.exec(input)) !== null) {
    params.mj_iw = parseFloat(match[1]);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 19. Handle --cw ----
  const cwRegex = /--cw\s*(\d+)/gi;
  while ((match = cwRegex.exec(input)) !== null) {
    params.mj_cw = parseInt(match[1], 10);
    markRange(match.index, match.index + match[0].length);
  }

  // ---- 20. Handle --moodboard ----
  const moodboardRegex = /--moodboard\s+(\S+)/gi;
  while ((match = moodboardRegex.exec(input)) !== null) {
    params.mj_moodboard_id = match[1];
    markRange(match.index, match.index + match[0].length);
  }

  // ---- Build raw params string ----
  // Sort ranges by start position
  paramRanges.sort((a, b) => a.start - b.start);

  // Merge overlapping ranges
  const mergedRanges: Array<{ start: number; end: number }> = [];
  for (const range of paramRanges) {
    const last = mergedRanges[mergedRanges.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      mergedRanges.push({ ...range });
    }
  }

  // Extract raw params from matched ranges
  const rawParamParts = mergedRanges.map((r) => input.slice(r.start, r.end).trim());
  const mj_raw_params = rawParamParts.join(" ");

  // ---- Build clean prompt text ----
  // Remove all param ranges from input
  let promptText = input;
  // Work backwards to preserve indices
  for (let i = mergedRanges.length - 1; i >= 0; i--) {
    const { start, end } = mergedRanges[i];
    promptText = promptText.slice(0, start) + promptText.slice(end);
  }

  // Clean up: collapse multiple spaces, trim
  promptText = promptText.replace(/\s{2,}/g, " ").trim();

  return {
    prompt_text: promptText,
    platform,
    params,
    mj_raw_params,
  };
}
