"use client";

// components/PlatformBadge.tsx — 平台标识 (支持所有预设 + 自定义平台)

import { getPlatformInfo } from "@/lib/platforms";

interface PlatformBadgeProps {
  platform: string;
  version?: string;
  className?: string;
}

export default function PlatformBadge({
  platform,
  version,
  className = "",
}: PlatformBadgeProps) {
  const info = getPlatformInfo(platform);

  return (
    <span
      className={`badge ${className}`}
      style={{
        background: `${info.color}26`,
        color: info.color,
      }}
    >
      {info.short}
      {version && <span> v{version}</span>}
    </span>
  );
}
