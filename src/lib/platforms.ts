// lib/platforms.ts — 平台预设配置 + 动态查找
// 管理所有 AI 绘图平台的显示名称、缩写、配色
// 上传时允许自由输入不在预设中的平台名

export interface PlatformInfo {
  label: string;
  short: string;
  color: string;
}

/**
 * 内置平台预设
 * 要添加新平台只需在此处追加一行
 */
export const PLATFORM_PRESETS: Record<string, PlatformInfo> = {
  midjourney:       { label: "Midjourney",        short: "MJ",     color: "#7c3aff" },
  nijijourney:      { label: "NijiJourney",       short: "Niji",   color: "#22d3ee" },
  stable_diffusion: { label: "Stable Diffusion",  short: "SD",     color: "#e87b35" },
  flux:             { label: "Flux",              short: "Flux",   color: "#f472b6" },
  novelai:          { label: "NovelAI",           short: "NAI",    color: "#34d399" },
  imagen:           { label: "Imagen",            short: "IMG",    color: "#60a5fa" },
  nano_banana_pro:  { label: "Nano Banana Pro",   short: "NB Pro", color: "#fbbf24" },
  nano_banana_2:    { label: "Nano Banana 2",     short: "NB2",    color: "#fb923c" },
  lora:             { label: "LoRA",              short: "LoRA",   color: "#a78bfa" },
};

/** 默认样式 — 用于预设中不存在的自定义平台 */
const DEFAULT_INFO: PlatformInfo = {
  label: "",
  short: "",
  color: "#737373",
};

/**
 * 获取平台显示信息
 * 预设中存在则返回预设配置，否则返回默认灰色样式 + slug 作为显示名
 */
export function getPlatformInfo(slug: string): PlatformInfo {
  const preset = PLATFORM_PRESETS[slug];
  if (preset) return preset;

  // 自定义平台: 将 slug 格式化为显示名 (下划线→空格, 首字母大写)
  const label = slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    ...DEFAULT_INFO,
    label,
    short: label.length <= 6 ? label : label.slice(0, 5) + "…",
  };
}

/**
 * 预设平台列表 (用于下拉菜单)
 * 返回 { value, label } 数组
 */
export function getPlatformOptions(): Array<{ value: string; label: string }> {
  return Object.entries(PLATFORM_PRESETS).map(([value, { label }]) => ({
    value,
    label,
  }));
}
