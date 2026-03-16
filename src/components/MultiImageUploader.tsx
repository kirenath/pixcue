"use client";

// components/MultiImageUploader.tsx — 多图拖拽上传 + 预览网格

import { useState, useRef, useCallback } from "react";
import styles from "./MultiImageUploader.module.css";

export interface UploadedImage {
  /** 本地临时 ID */
  localId: string;
  /** R2 公开 URL (上传完成后) */
  url: string;
  /** R2 缩略图 URL */
  thumbUrl: string;
  /** base64 预览 */
  preview: string;
  /** 上传状态 */
  status: "uploading" | "done" | "error";
  /** 进度文本 */
  progress: string;
}

interface MultiImageUploaderProps {
  /** 已上传的图片列表 */
  images: UploadedImage[];
  /** 图片列表变化回调 */
  onImagesChange: (images: UploadedImage[]) => void;
  /** 区域标签 */
  label?: string;
  /** 是否标记第一张为主图 */
  showPrimaryBadge?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

let idCounter = 0;
function genLocalId() {
  return `img_${Date.now()}_${++idCounter}`;
}

export default function MultiImageUploader({
  images,
  onImagesChange,
  label = "上传图片",
  showPrimaryBadge = false,
  disabled = false,
}: MultiImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // 用 ref 来跟踪最新的 images 以避免闭包陈旧问题
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const uploadFile = useCallback(
    async (file: File, localId: string) => {
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

        // 更新进度
        updateImage(localId, { progress: "上传图片..." });

        // 2. 上传到 R2
        const uploadRes = await fetch(url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) throw new Error("图片上传失败");

        // 3. 生成缩略图
        updateImage(localId, { progress: "生成缩略图..." });

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

        // 完成
        updateImage(localId, {
          url: publicUrl,
          thumbUrl,
          status: "done",
          progress: "完成 ✓",
        });
      } catch (error) {
        updateImage(localId, {
          status: "error",
          progress: `错误: ${error instanceof Error ? error.message : "上传失败"}`,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function updateImage(localId: string, updates: Partial<UploadedImage>) {
    const current = imagesRef.current;
    const next = current.map((img) =>
      img.localId === localId ? { ...img, ...updates } : img
    );
    onImagesChange(next);
  }

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return;

      const fileArray = Array.from(files);
      const newImages: UploadedImage[] = [];

      for (const file of fileArray) {
        if (!file.type.startsWith("image/")) continue;

        const localId = genLocalId();
        const preview = URL.createObjectURL(file);

        newImages.push({
          localId,
          url: "",
          thumbUrl: "",
          preview,
          status: "uploading",
          progress: "获取上传链接...",
        });

        // 异步上传 (不 await，并发上传)
        uploadFile(file, localId);
      }

      if (newImages.length > 0) {
        onImagesChange([...imagesRef.current, ...newImages]);
      }
    },
    [disabled, uploadFile, onImagesChange]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      handleFiles(e.target.files);
      // 清空 input 以允许重复选择同一文件
      e.target.value = "";
    }
  }

  function handleRemove(localId: string) {
    const next = imagesRef.current.filter((img) => img.localId !== localId);
    onImagesChange(next);
  }

  return (
    <div className={styles.wrapper}>
      {/* 预览网格 */}
      {images.length > 0 && (
        <div className={styles.grid}>
          {images.map((img, idx) => (
            <div key={img.localId} className={styles.imageCard}>
              {showPrimaryBadge && idx === 0 && (
                <span className={styles.primaryBadge}>主图</span>
              )}
              <img
                src={img.preview}
                alt={`预览 ${idx + 1}`}
                className={styles.thumb}
              />
              {img.status === "uploading" && (
                <div className={styles.uploadingOverlay}>
                  <div className={styles.spinner} />
                  <span>{img.progress}</span>
                </div>
              )}
              {img.status === "done" && (
                <div className={styles.successBadge}>✓</div>
              )}
              {img.status === "error" && (
                <div className={styles.errorBadge}>✗</div>
              )}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(img.localId);
                }}
                title="移除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 拖拽区 */}
      <div
        className={`${styles.dropzone} ${dragActive ? styles.dragActive : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleChange}
          className={styles.fileInput}
          disabled={disabled}
        />
        <div className={styles.placeholder}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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
            拖拽或点击上传 · 支持多选 · JPG / PNG / WebP / GIF · 最大 20MB
          </p>
        </div>
      </div>
    </div>
  );
}
