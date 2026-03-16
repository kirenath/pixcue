-- ============================================
-- PixCue — Supabase 初始化 SQL
-- 在 Supabase SQL Editor 中一次性执行
-- ============================================

-- ========================================
-- prompts: 核心表
-- ========================================
CREATE TABLE prompts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  prompt_text    text NOT NULL,        -- 纯净提示词 (不含参数)
  description    text,                 -- 作者备注/说明

  type           text NOT NULL DEFAULT 'txt2img'
                   CHECK (type IN ('txt2img', 'img2img')),
  category       text NOT NULL DEFAULT 'gallery'
                   CHECK (category IN ('gallery', 'template')),

  -- 图片
  main_image_url   text,              -- R2 公开 URL
  thumb_image_url  text,              -- R2 缩略图 URL (sharp 生成)

  -- 元信息
  author         text,                -- 作者昵称 (可选)
  status         text NOT NULL DEFAULT 'published'
                   CHECK (status IN ('draft', 'published', 'archived')),
  is_nsfw        boolean NOT NULL DEFAULT false,
  view_count     integer NOT NULL DEFAULT 0,

  -- 时间
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  -- ★ 平台区分 (自由文本，不做 CHECK 约束，支持动态添加平台)
  platform       text NOT NULL DEFAULT 'midjourney',

  -- ★ 通用参数 (MJ + Niji 共享)
  mj_version       text,              -- MJ: '6.1','7' / Niji: '5','6','7'
  mj_aspect_ratio  text,              -- --ar '16:9', '2:3' 等
  mj_stylize       integer,           -- --s (0-1000)
  mj_chaos         integer,           -- --chaos (0-100)
  mj_seed          bigint,            -- --seed
  mj_quality       real,              -- --q (0.25/0.5/1)
  mj_tile          boolean,           -- --tile 无缝贴图
  mj_no            text,              -- --no 负向提示词
  mj_stop          integer,           -- --stop (10-100)
  mj_weird         integer,           -- --weird (0-3000)
  mj_repeat        integer,           -- --repeat 批量生成次数

  -- ★ 风格 & 个性化
  mj_style         text,              -- MJ: 'raw' / Niji: 'cute','expressive','scenic','original'
  mj_personalize   text,              -- --p 个性化代码 (profile code)
  mj_sref          text,              -- --sref 风格参考 (URL 或 code)
  mj_cref          text,              -- --cref 角色参考 (URL)
  mj_oref          text,              -- --oref 全局参考 (V7+)
  mj_iw            real,              -- --iw 图片权重 (0-2)
  mj_cw            integer,           -- --cw 角色权重 (0-100)
  mj_moodboard_id  text,              -- Moodboard ID

  -- ★ 原始保留 (用于重新解析 / 完整性)
  mj_raw_params    text               -- 原始参数字符串
);

-- 全文搜索索引
ALTER TABLE prompts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(prompt_text, ''))
  ) STORED;
CREATE INDEX idx_prompts_search ON prompts USING gin(search_vector);

-- 常用查询索引
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_platform ON prompts(platform);
CREATE INDEX idx_prompts_created ON prompts(created_at DESC);

-- updated_at 自动更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_prompts_updated
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- reference_images: 参考图 (img2img / sref / cref)
-- ========================================
CREATE TABLE reference_images (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id      uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  image_url      text NOT NULL,
  thumb_url      text,
  ref_type       text NOT NULL DEFAULT 'source'
                   CHECK (ref_type IN ('source', 'sref', 'cref', 'oref')),
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ref_images_prompt ON reference_images(prompt_id);

-- ========================================
-- tags: 标签
-- ========================================
CREATE TABLE tags (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL UNIQUE,
  slug           text NOT NULL UNIQUE,  -- URL-safe
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- prompt_tags: 多对多关联
-- ========================================
CREATE TABLE prompt_tags (
  prompt_id      uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id         uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);
