"use client";

// components/PromptCard.tsx — 画廊卡片

import Link from "next/link";
import PlatformBadge from "./PlatformBadge";
import NsfwOverlay from "./NsfwOverlay";
import styles from "./PromptCard.module.css";

export interface PromptCardData {
  id: string;
  title: string;
  thumb_image_url?: string;
  main_image_url?: string;
  platform: string;
  mj_version?: string;
  mj_aspect_ratio?: string;
  is_nsfw: boolean;
  status: string;
}

interface PromptCardProps {
  prompt: PromptCardData;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const imageUrl = prompt.thumb_image_url || prompt.main_image_url;

  return (
    <Link href={`/prompt/${prompt.id}`} className={styles.card}>
      <NsfwOverlay isNsfw={prompt.is_nsfw}>
        <div className={styles.imageWrapper}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={prompt.title}
              className={styles.image}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className={styles.placeholder}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path
                  d="M6 16l3-3 2 2 4-4 3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </NsfwOverlay>

      <div className={styles.info}>
        <div className={styles.badges}>
          <PlatformBadge
            platform={prompt.platform}
            version={prompt.mj_version}
          />
          {prompt.mj_aspect_ratio && (
            <span className={styles.arBadge}>{prompt.mj_aspect_ratio}</span>
          )}
        </div>
        <h3 className={styles.title}>{prompt.title}</h3>
      </div>
    </Link>
  );
}
