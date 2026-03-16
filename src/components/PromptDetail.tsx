"use client";

// components/PromptDetail.tsx — 详情展示 + 参数表格

import PlatformBadge from "./PlatformBadge";
import CopyButton from "./CopyButton";
import { buildMjPrompt } from "@/lib/mj-builder";
import type { MjParams } from "@/lib/mj-parser";
import styles from "./PromptDetail.module.css";

interface PromptDetailData {
  id: string;
  title: string;
  prompt_text: string;
  description?: string;
  main_image_url?: string;
  platform: string;
  type: string;
  status: string;
  is_nsfw: boolean;
  view_count: number;
  created_at: string;
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
  mj_raw_params?: string;
  prompt_tags?: Array<{
    tag_id: string;
    tags: { id: string; name: string; slug: string };
  }>;
  reference_images?: Array<{
    id: string;
    image_url: string;
    thumb_url?: string;
    ref_type: string;
  }>;
}

interface PromptDetailProps {
  prompt: PromptDetailData;
}

// 参数显示配置
const PARAM_LABELS: Record<string, string> = {
  mj_version: "版本",
  mj_aspect_ratio: "宽高比",
  mj_stylize: "Stylize (--s)",
  mj_chaos: "Chaos",
  mj_seed: "Seed",
  mj_quality: "Quality (--q)",
  mj_tile: "Tile (无缝)",
  mj_stop: "Stop",
  mj_weird: "Weird",
  mj_repeat: "Repeat",
  mj_style: "Style",
  mj_personalize: "Personalize (--p)",
  mj_sref: "Style Ref (--sref)",
  mj_cref: "Char Ref (--cref)",
  mj_oref: "Object Ref (--oref)",
  mj_iw: "Image Weight (--iw)",
  mj_cw: "Char Weight (--cw)",
};

export default function PromptDetail({ prompt }: PromptDetailProps) {
  // 构建完整 prompt 用于复制
  const params: MjParams = {};
  for (const key of Object.keys(PARAM_LABELS)) {
    const value = prompt[key as keyof PromptDetailData];
    if (value !== undefined && value !== null) {
      (params as Record<string, unknown>)[key] = value;
    }
  }
  const fullPrompt = buildMjPrompt(prompt.prompt_text, params, prompt.platform);

  // 收集非空参数
  const activeParams = Object.entries(PARAM_LABELS).filter(([key]) => {
    const v = prompt[key as keyof PromptDetailData];
    return v !== undefined && v !== null && v !== false;
  });

  const REF_TYPE_LABELS: Record<string, string> = {
    source: "源图",
    sref: "风格参考",
    cref: "角色参考",
    oref: "全局参考",
    result: "生成结果",
  };

  return (
    <div className={styles.detail}>
      {/* 大图区域 */}
      <div className={styles.imageSection}>
        {prompt.main_image_url ? (
          <img
            src={prompt.main_image_url}
            alt={prompt.title}
            className={styles.mainImage}
          />
        ) : (
          <div className={styles.noImage}>暂无图片</div>
        )}
      </div>

      {/* 信息区域 */}
      <div className={styles.infoSection}>
        {/* 标题 + Badge */}
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{prompt.title}</h1>
          <PlatformBadge
            platform={prompt.platform}
            version={prompt.mj_version}
          />
        </div>

        {/* 描述 */}
        {prompt.description && (
          <p className={styles.description}>{prompt.description}</p>
        )}

        {/* Prompt 文本 + 复制 */}
        <div className={styles.promptSection}>
          <div className={styles.promptHeader}>
            <h2 className={styles.sectionTitle}>Prompt</h2>
            <CopyButton text={fullPrompt} label="复制完整 Prompt" />
          </div>
          <pre className={styles.promptText}>{prompt.prompt_text}</pre>
          {prompt.mj_raw_params && (
            <code className={styles.rawParams}>{prompt.mj_raw_params}</code>
          )}
        </div>

        {/* 参数表格 */}
        {activeParams.length > 0 && (
          <div className={styles.paramsSection}>
            <h2 className={styles.sectionTitle}>参数</h2>
            <div className={styles.paramsGrid}>
              {activeParams.map(([key, label]) => (
                <div key={key} className={styles.paramItem}>
                  <span className={styles.paramLabel}>{label}</span>
                  <span className={styles.paramValue}>
                    {String(prompt[key as keyof PromptDetailData])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 标签 */}
        {prompt.prompt_tags && prompt.prompt_tags.length > 0 && (
          <div className={styles.tagsSection}>
            <h2 className={styles.sectionTitle}>标签</h2>
            <div className={styles.tagsList}>
              {prompt.prompt_tags.map(({ tags: tag }) => (
                <a
                  key={tag.id}
                  href={`/?tag=${tag.slug}`}
                  className={styles.tag}
                >
                  #{tag.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 参考图 */}
        {prompt.reference_images && prompt.reference_images.length > 0 && (
          <div className={styles.refsSection}>
            <h2 className={styles.sectionTitle}>参考图</h2>
            <div className={styles.refsGrid}>
              {prompt.reference_images.map((ref) => (
                <div key={ref.id} className={styles.refItem}>
                  <img
                    src={ref.thumb_url || ref.image_url}
                    alt={REF_TYPE_LABELS[ref.ref_type]}
                    className={styles.refImage}
                  />
                  <span className={styles.refType}>
                    {REF_TYPE_LABELS[ref.ref_type] || ref.ref_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 元信息 */}
        <div className={styles.meta}>
          <span>👁 {prompt.view_count} 次浏览</span>
          <span>
            {new Date(prompt.created_at).toLocaleDateString("zh-CN")}
          </span>
        </div>
      </div>
    </div>
  );
}
