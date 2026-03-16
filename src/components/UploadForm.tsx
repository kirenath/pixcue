"use client";

// components/UploadForm.tsx — 上传表单主体 (支持多图 + 参考图)

import { useState } from "react";
import { useRouter } from "next/navigation";
import PromptParser from "./PromptParser";
import MultiImageUploader from "./MultiImageUploader";
import type { UploadedImage } from "./MultiImageUploader";
import ReferenceImageUploader from "./ReferenceImageUploader";
import type { RefImage } from "./ReferenceImageUploader";
import TagInput from "./TagInput";
import type { MjParsedResult } from "@/lib/mj-parser";
import { getPlatformOptions } from "@/lib/platforms";
import styles from "./UploadForm.module.css";

export default function UploadForm() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("midjourney");
  const [customPlatform, setCustomPlatform] = useState("");
  const [type, setType] = useState<"txt2img" | "img2img">("txt2img");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [isNsfw, setIsNsfw] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [parsedParams, setParsedParams] = useState<MjParsedResult["params"]>({});
  const [rawParams, setRawParams] = useState("");

  // 多图上传 state
  const [mainImages, setMainImages] = useState<UploadedImage[]>([]);
  const [refImages, setRefImages] = useState<RefImage[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleParsed(result: MjParsedResult) {
    setPromptText(result.prompt_text);
    setPlatform(result.platform);
    setParsedParams(result.params);
    setRawParams(result.mj_raw_params);

    // 自动填充标题 (取 prompt 前30字)
    if (!title && result.prompt_text) {
      setTitle(
        result.prompt_text.length > 30
          ? result.prompt_text.slice(0, 30) + "..."
          : result.prompt_text
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) {
      setError("标题和提示词不能为空");
      return;
    }

    // 检查是否有图片仍在上传中
    const allUploading = [
      ...mainImages.filter((i) => i.status === "uploading"),
      ...refImages.filter((i) => i.status === "uploading"),
    ];
    if (allUploading.length > 0) {
      setError("还有图片正在上传，请稍候...");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 取第一张已上传的主图
      const doneMainImages = mainImages.filter((i) => i.status === "done");
      const firstMain = doneMainImages[0];

      // 额外主图 → 存为 ref_type = 'result'
      const extraMainAsRefs = doneMainImages.slice(1).map((img, idx) => ({
        image_url: img.url,
        thumb_url: img.thumbUrl,
        ref_type: "result",
        sort_order: idx,
      }));

      // 参考图
      const refImagesPayload = refImages
        .filter((i) => i.status === "done")
        .map((img, idx) => ({
          image_url: img.url,
          thumb_url: img.thumbUrl,
          ref_type: img.refType,
          sort_order: extraMainAsRefs.length + idx,
        }));

      const allReferenceImages = [...extraMainAsRefs, ...refImagesPayload];

      const body = {
        title: title.trim(),
        prompt_text: promptText.trim(),
        description: description.trim() || undefined,
        type,
        platform: platform === "__custom__" ? customPlatform.trim() || "other" : platform,
        status,
        is_nsfw: isNsfw,
        main_image_url: firstMain?.url || undefined,
        thumb_image_url: firstMain?.thumbUrl || undefined,
        mj_raw_params: rawParams || undefined,
        tags,
        reference_images: allReferenceImages.length > 0 ? allReferenceImages : undefined,
        ...parsedParams,
      };

      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "发布失败");
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h2>发布成功！</h2>
        <p>正在返回画廊...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Step 1: 解析 Prompt */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.stepNum}>1</span>
          粘贴 Prompt
        </h2>
        <PromptParser onParsed={handleParsed} />
      </section>

      {/* Step 2: 上传主图 (支持多图) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.stepNum}>2</span>
          上传图片
        </h2>
        <MultiImageUploader
          images={mainImages}
          onImagesChange={setMainImages}
          label="上传生成结果图"
          showPrimaryBadge={true}
        />
      </section>

      {/* Step 3: 上传参考图 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.stepNum}>3</span>
          参考图 <span style={{ fontWeight: 400, fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>(可选)</span>
        </h2>
        <ReferenceImageUploader
          images={refImages}
          onImagesChange={setRefImages}
          promptType={type}
        />
      </section>

      {/* Step 4: 补充信息 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.stepNum}>4</span>
          补充信息
        </h2>

        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label}>标题 *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="作品标题"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>提示词 *</label>
            <textarea
              className="input"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="纯净提示词 (不含参数)"
              rows={3}
              required
              style={{ resize: "vertical", fontFamily: "var(--font-mono)" }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>描述 (可选)</label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="创作备注、灵感来源..."
              rows={2}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>平台</label>
              <select
                className="input"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                {getPlatformOptions().map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
                <option value="__custom__">自定义…</option>
              </select>
              {platform === "__custom__" && (
                <input
                  className="input"
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  placeholder="输入平台名称，如 stable_diffusion"
                  style={{ marginTop: "var(--space-2)" }}
                />
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>类型</label>
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value as "txt2img" | "img2img")}
              >
                <option value="txt2img">文生图</option>
                <option value="img2img">图生图</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>状态</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as "published" | "draft")}
              >
                <option value="published">发布</option>
                <option value="draft">草稿</option>
              </select>
            </div>
          </div>

          <div className={styles.checkbox}>
            <input
              type="checkbox"
              id="nsfw"
              checked={isNsfw}
              onChange={(e) => setIsNsfw(e.target.checked)}
            />
            <label htmlFor="nsfw">NSFW 内容</label>
          </div>
        </div>
      </section>

      {/* Step 5: 标签 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.stepNum}>5</span>
          标签
        </h2>
        <TagInput value={tags} onChange={setTags} />
      </section>

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Submit */}
      <button
        type="submit"
        className={`btn btn-primary ${styles.submit}`}
        disabled={submitting}
      >
        {submitting ? "发布中..." : "发布作品"}
      </button>
    </form>
  );
}
