-- ============================================
-- PixCue — 迁移: 移除 platform CHECK 约束
-- 允许自由文本平台名 (不再限制为 midjourney/nijijourney)
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 移除现有 CHECK 约束
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_platform_check;

-- 确认: platform 字段仍保留 NOT NULL + DEFAULT
-- ALTER TABLE prompts ALTER COLUMN platform SET DEFAULT 'midjourney';
