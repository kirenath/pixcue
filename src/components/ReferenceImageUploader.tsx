"use client";

// components/ReferenceImageUploader.tsx — 参考图上传 (带 ref_type 选择)

import { useState, useRef, useCallback } from "react";
import styles from "./ReferenceImageUploader.module.css";

export type RefType = "source" | "sref" | "cref" | "oref";

export interface RefImage {
  localId: string;
  url: string;
  thumbUrl: string;
  preview: string;
  refType: RefType;
  status: "uploading" | "done" | "error";
  progress: string;
}

interface ReferenceImageUploaderProps {
  images: RefImage[];
  onImagesChange: (images: RefImage[]) => void;
  /** prompt 类型，用于设定默认 refType */
  promptType?: "txt2img" | "img2img";
  disabled?: boolean;
}

const REF_TYPE_OPTIONS: { value: RefType; label: string }[] = [
  { value: "source", label: "源图 (img2img)" },
  { value: "sref", label: "风格参考 (--sref)" },
  { value: "cref", label: "角色参考 (--cref)" },
  { value: "oref", label: "全局参考 (--oref)" },
];

let idCounter = 0;
function genLocalId() {
  return `ref_${Date.now()}_${++idCounter}`;
}

export default function ReferenceImageUploader({
  images,
  onImagesChange,
  promptType = "txt2img",
  disabled = false,
}: ReferenceImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const defaultRefType: RefType = promptType === "img2img" ? "source" : "sref";

  function updateImage(localId: string, updates: Partial<RefImage>) {
    const current = imagesRef.current;
    const next = current.map((img) =>
      img.localId === localId ? { ...img, ...updates } : img
    );
    onImagesChange(next);
  }

  const uploadFile = useCallback(
    async (file: File, localId: string) => {
      try {
        const presignRes = await fetch("/api/r2-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            filetype: file.type,
            usage: "ref",
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error || "获取上传链接失败");
        }

        const { url, publicUrl } = await presignRes.json();

        updateImage(localId, { progress: "上传图片..." });

        const uploadRes = await fetch(url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) throw new Error("图片上传失败");

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

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return;

      const fileArray = Array.from(files);
      const newImages: RefImage[] = [];

      for (const file of fileArray) {
        if (!file.type.startsWith("image/")) continue;

        const localId = genLocalId();
        const preview = URL.createObjectURL(file);

        newImages.push({
          localId,
          url: "",
          thumbUrl: "",
          preview,
          refType: defaultRefType,
          status: "uploading",
          progress: "获取上传链接...",
        });

        uploadFile(file, localId);
      }

      if (newImages.length > 0) {
        onImagesChange([...imagesRef.current, ...newImages]);
      }
    },
    [disabled, uploadFile, onImagesChange, defaultRefType]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleRemove(localId: string) {
    onImagesChange(imagesRef.current.filter((img) => img.localId !== localId));
  }

  function handleRefTypeChange(localId: string, refType: RefType) {
    updateImage(localId, { refType });
  }

  return (
    <div className={styles.wrapper}>
      {promptType === "img2img" && (
        <p className={styles.hint}>
          <strong>图生图模式</strong> — 请上传原始参考图（source），也可添加风格/角色参考
        </p>
      )}

      {/* 参考图网格 */}
      {images.length > 0 && (
        <div className={styles.refGrid}>
          {images.map((img) => (
            <div key={img.localId} className={styles.refCard}>
              <div className={styles.refThumbWrap}>
                <img
                  src={img.preview}
                  alt="参考图"
                  className={styles.refThumb}
                />
                {img.status === "uploading" && (
                  <div className={styles.refOverlay}>
                    <div className={styles.refSpinner} />
                    <span>{img.progress}</span>
                  </div>
                )}
                {img.status === "done" && (
                  <div className={styles.refSuccess}>✓</div>
                )}
                <button
                  type="button"
                  className={styles.refRemoveBtn}
                  onClick={() => handleRemove(img.localId)}
                  title="移除"
                >
                  ×
                </button>
              </div>
              <select
                className={styles.refTypeSelect}
                value={img.refType}
                onChange={(e) =>
                  handleRefTypeChange(img.localId, e.target.value as RefType)
                }
              >
                {REF_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
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
          <p className={styles.placeholderText}>添加参考图</p>
          <p className={styles.placeholderHint}>
            拖拽或点击 · 支持多选 · 每张图可设置参考类型
          </p>
        </div>
      </div>
    </div>
  );
}
