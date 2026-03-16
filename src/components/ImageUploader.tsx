"use client";

// components/ImageUploader.tsx — 拖拽上传 + 预览

import { useState, useRef, useCallback } from "react";
import styles from "./ImageUploader.module.css";

interface ImageUploaderProps {
  onUpload: (publicUrl: string, thumbUrl: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function ImageUploader({
  onUpload,
  label = "上传主图",
  disabled = false,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled || uploading) return;

      // 预览
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setUploading(true);
      setProgress("获取上传链接...");

      try {
        // 1. 获取 presigned URL
        const presignRes = await fetch("/api/r2-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            filetype: file.type,
            usage: "prompt",
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error || "获取上传链接失败");
        }

        const { url, publicUrl } = await presignRes.json();

        // 2. 上传到 R2
        setProgress("上传图片...");
        const uploadRes = await fetch(url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) {
          throw new Error("图片上传失败");
        }

        // 3. 生成缩略图
        setProgress("生成缩略图...");
        const thumbRes = await fetch("/api/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicUrl }),
        });

        let thumbUrl = "";
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json();
          thumbUrl = thumbData.thumbUrl;
        }

        setProgress("完成 ✓");
        onUpload(publicUrl, thumbUrl);
      } catch (error) {
        setProgress(`错误: ${error instanceof Error ? error.message : "上传失败"}`);
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [disabled, uploading, onUpload]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className={`${styles.uploader} ${dragActive ? styles.dragActive : ""} ${
        preview ? styles.hasPreview : ""
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className={styles.fileInput}
        disabled={disabled || uploading}
      />

      {preview ? (
        <div className={styles.previewWrapper}>
          <img src={preview} alt="预览" className={styles.previewImage} />
          {uploading && (
            <div className={styles.uploadingOverlay}>
              <div className={styles.spinner} />
              <span>{progress}</span>
            </div>
          )}
          {!uploading && progress.includes("✓") && (
            <div className={styles.successBadge}>✓</div>
          )}
        </div>
      ) : (
        <div className={styles.placeholder}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V8M8 12l4-4 4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <p className={styles.placeholderText}>{label}</p>
          <p className={styles.placeholderHint}>
            拖拽或点击上传 · JPG / PNG / WebP / GIF · 最大 20MB
          </p>
        </div>
      )}
    </div>
  );
}
