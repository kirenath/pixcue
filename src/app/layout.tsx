import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PixCue — AI Prompt Gallery & Manager",
  description:
    "AI 绘画提示词与作品管理系统，Midjourney / NijiJourney 特化。浏览、搜索、管理你的 AI 画作与提示词。",
  keywords: [
    "Midjourney",
    "NijiJourney",
    "AI art",
    "prompt",
    "gallery",
    "prompt manager",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 主题初始化脚本 — 避免 FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('pixcue-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${notoSansSC.variable}`}>
        {children}
      </body>
    </html>
  );
}
