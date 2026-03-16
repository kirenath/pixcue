// api/thumbnail/route.ts — 缩略图生成 + R2 上传

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { generateThumbnail, generateThumbFilename } from "@/lib/thumbnail";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { publicUrl } = await req.json();

    if (!publicUrl) {
      return NextResponse.json(
        { error: "缺少 publicUrl 参数" },
        { status: 400 }
      );
    }

    // 1. 从 R2 公开 URL 获取原图
    const imageResponse = await fetch(publicUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `获取原图失败: ${imageResponse.status}` },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 2. 生成缩略图
    const thumbBuffer = await generateThumbnail(imageBuffer);

    // 3. 构建缩略图文件名
    const originalFilename =
      publicUrl.split("/").pop() || "image";
    const thumbKey = generateThumbFilename(originalFilename);

    // 4. 上传缩略图到 R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: thumbKey,
        Body: thumbBuffer,
        ContentType: "image/webp",
      })
    );

    const thumbUrl = `${process.env.R2_PUBLIC_DOMAIN}/${thumbKey}`;

    return NextResponse.json({ thumbUrl });
  } catch (error) {
    console.error("[Thumbnail] Error:", error);
    return NextResponse.json(
      { error: "缩略图生成失败" },
      { status: 500 }
    );
  }
}
