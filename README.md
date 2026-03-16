# PixCue

AI 绘画提示词画廊与管理系统，**Midjourney / NijiJourney 特化**。

管理员上传作品并自动解析 MJ/Niji 参数，访客匿名浏览瀑布流画廊、搜索筛选、一键复制 prompt。

## ✨ 功能特性

- **瀑布流画廊** — CSS Grid 瀑布流展示，响应式布局，暗/亮主题
- **Prompt 解析器** — 粘贴原始 prompt 自动提取 `--ar`、`--v`、`--s`、`--style` 等全部 MJ/Niji 参数
- **平台识别** — 自动区分 Midjourney / NijiJourney，`--niji` 标志智能识别
- **图片管理** — 拖拽上传至 Cloudflare R2，自动生成 WebP 缩略图 (sharp)
- **全文搜索** — PostgreSQL `tsvector` 全文搜索，标签筛选、平台筛选、版本筛选
- **标签系统** — 自由输入标签，自动创建，autocomplete 建议
- **NSFW 遮罩** — NSFW 作品默认模糊遮罩，点击确认后显示
- **一键复制** — 完整 prompt + 参数一键复制到剪贴板
- **管理后台** — 统计仪表盘、内容管理表格、批量操作
- **路由鉴权** — Middleware 保护 admin 路由，未登录自动跳转

## 🛠️ 技术栈

| 层       | 选择                        | 说明                            |
| -------- | --------------------------- | ------------------------------- |
| 框架     | Next.js 16 (App Router)     | React 19, TypeScript, Turbopack |
| 数据库   | Supabase PostgreSQL         | 结构化数据 + 全文搜索           |
| 认证     | Supabase Auth               | 管理员登录 (email + password)   |
| 图片存储 | Cloudflare R2               | presigned URL 直传              |
| 图片处理 | sharp                       | 服务端缩略图生成 (WebP, 400px)  |
| 样式     | Vanilla CSS + CSS Variables | 暗/亮主题，无框架依赖           |
| 测试     | Vitest                      | 解析器单元测试                  |
| 部署     | Docker + docker-compose     | 多阶段构建，VPS 自托管          |

## 📦 快速开始

### 环境要求

- Node.js 22+
- pnpm
- Supabase 项目 (PostgreSQL + Auth)
- Cloudflare R2 Bucket

### 安装

```bash
git clone https://github.com/kirenath/pixcue.git
cd pixcue
pnpm install
```

### 配置环境变量

复制模板文件并填入实际值：

```bash
cp MUST_READ_ME.env.template .env.local
```

需要配置以下环境变量：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=pixcue
R2_PUBLIC_DOMAIN=

# App
NEXT_PUBLIC_SITE_URL=https://pixcue.yourdomain.com

# Admin — 多个邮箱用逗号分隔
ADMIN_EMAILS=admin@example.com
```

### 初始化数据库

在 Supabase SQL Editor 中执行：

```bash
supabase/init.sql
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 🐳 Docker 部署

```bash
docker compose up -d --build
```

服务将监听 `3100` 端口。可通过反向代理 (Nginx / Caddy) 绑定域名。

## 📁 项目结构

```
pixcue/
├── src/
│   ├── app/
│   │   ├── page.tsx                ← 画廊首页 (瀑布流)
│   │   ├── prompt/[id]/page.tsx    ← 作品详情页
│   │   ├── login/page.tsx          ← 管理员登录
│   │   ├── admin/                  ← 管理后台 (仪表盘/上传/管理)
│   │   └── api/                    ← API Routes (prompts/r2/thumbnail/tags)
│   ├── components/                 ← UI 组件
│   ├── lib/
│   │   ├── mj-parser.ts           ← MJ/Niji 参数解析器
│   │   ├── mj-builder.ts          ← 参数 → 完整 prompt 拼接
│   │   ├── r2.ts                   ← Cloudflare R2 客户端
│   │   ├── thumbnail.ts           ← sharp 缩略图工具
│   │   └── supabase*.ts           ← Supabase 客户端 (浏览器/服务端)
│   ├── styles/globals.css          ← CSS 设计系统
│   └── middleware.ts               ← Admin 路由鉴权
├── supabase/                       ← 数据库 SQL
├── __tests__/                      ← 单元测试
├── Dockerfile                      ← 多阶段构建
└── docker-compose.yml
```

## 🔑 路由鉴权

| 路由                              | 方法                | 权限         |
| --------------------------------- | ------------------- | ------------ |
| `/` `/prompt/[id]`                | GET                 | 公开         |
| `/api/prompts` `/api/tags`        | GET                 | 公开         |
| `/admin/*`                        | ALL                 | 需管理员登录 |
| `/api/prompts`                    | POST / PUT / DELETE | 需管理员登录 |
| `/api/r2-upload` `/api/thumbnail` | POST                | 需管理员登录 |

## 📝 License

[AGPL-3.0](LICENSE)
