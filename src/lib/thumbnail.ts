// lib/thumbnail.ts — sharp 缩略图工具函数

import sharp from "sharp";

export interface ThumbnailOptions {
  maxWidth?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

const DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
  maxWidth: 400,
  quality: 80,
  format: "webp",
};

/**
 * 从图片 Buffer 生成缩略图
 * @returns 缩略图 Buffer
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  options?: ThumbnailOptions
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const result = await sharp(imageBuffer)
    .resize({ width: opts.maxWidth, withoutEnlargement: true })
    .toFormat(opts.format, { quality: opts.quality })
    .toBuffer();

  return result;
}

/**
 * 生成缩略图文件名
 * @param originalFilename - 原始文件名
 * @returns 缩略图文件名 (thumb-{timestamp}-{name}.webp)
 */
export function generateThumbFilename(originalFilename: string): string {
  const baseName = originalFilename.replace(/\.[^.]+$/, "");
  return `thumb-${Date.now()}-${baseName}.webp`;
}
